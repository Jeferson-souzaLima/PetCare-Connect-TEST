const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const { token, simularBanco, USUARIOS } = require('./apoioAcesso');

Object.assign(process.env, {
    R2_ACCOUNT_ID: 'conta', R2_ACCESS_KEY_ID: 'chave', R2_SECRET_ACCESS_KEY: 'segredo',
    R2_BUCKET_NAME: 'bucket', R2_ENDPOINT: 'https://r2.test', R2_PUBLIC_URL: 'https://img.petcare.test'
});

const db = require('../db');
const r2Storage = require('../Services/r2Storage');
const adminRoutes = require('../Routes/admin');
const tratarErros = require('../middlewares/tratarErros');

/*
 * O admin envia imagens de produtos e o logo de qualquer loja, pelo mesmo
 * serviço usado pelo lojista (R2 + banco, tudo ou nada).
 */
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);

function simularR2(t, { enviados, removidos }) {
    t.mock.method(r2Storage, 'upload', async function upload(file, pasta = 'produtos') {
        const { extension } = this.validateImage(file);
        const key = `${pasta}/novo-${enviados.length}${extension}`;
        enviados.push(key);
        return { key, url: `https://img.petcare.test/${key}` };
    });
    t.mock.method(r2Storage, 'deleteByKey', async (key) => { removidos.push(key); });
}

async function comApp(fn) {
    const app = express();
    app.use(express.json());
    app.use('/admin', adminRoutes);
    app.use(tratarErros);
    const server = app.listen(0);
    try {
        return await fn(`http://127.0.0.1:${server.address().port}`);
    } finally {
        server.close();
    }
}

async function enviar(base, rota, usuario, campo, arquivos) {
    const form = new FormData();
    for (const { conteudo, tipo, nome } of arquivos) form.append(campo, new Blob([conteudo], { type: tipo }), nome);
    const r = await fetch(`${base}${rota}`, { method: 'POST', headers: { Authorization: `Bearer ${token(usuario)}` }, body: form });
    return { status: r.status, body: await r.json() };
}

const fotoJpg = (nome = 'racao.jpg') => ({ conteudo: JPEG, tipo: 'image/jpeg', nome });

const regrasCatalogo = [
    [/SELECT id, loja_id FROM produtos WHERE id = \?/, (v) => (Number(v[0]) === 31 ? [{ id: 31, loja_id: 6 }] : [])],
    [/SELECT id, imagem FROM lojas WHERE id = \?/, (v) => (Number(v[0]) === 9 ? [{ id: 9, imagem: 'https://img.petcare.test/lojas/antiga.png' }] : [])],
    [/SELECT COUNT\(\*\) AS total\s+FROM produtoimagens/, [{ total: 0 }]],
    [/INSERT INTO produtoimagens/, { affectedRows: 1 }],
    [/^UPDATE lojas SET imagem = \? WHERE id = \?$/, { affectedRows: 1 }]
];

test('só o admin envia imagens do catálogo de outras lojas', async (t) => {
    const enviados = [];
    simularR2(t, { enviados, removidos: [] });
    simularBanco(t, db, regrasCatalogo);

    await comApp(async (base) => {
        assert.equal((await enviar(base, '/admin/produtos/31/imagens', USUARIOS.lojista, 'imagens', [fotoJpg()])).status, 403);
        assert.equal((await enviar(base, '/admin/lojas/9/imagem', USUARIOS.cliente, 'imagem', [fotoJpg()])).status, 403);
    });
    assert.deepEqual(enviados, [], 'nada é enviado ao R2 antes de conferir o acesso');
});

test('admin envia imagem de produto: vai ao R2 e vira a principal', async (t) => {
    const enviados = [];
    simularR2(t, { enviados, removidos: [] });
    const consultas = simularBanco(t, db, regrasCatalogo);

    const r = await comApp((base) => enviar(base, '/admin/produtos/31/imagens', USUARIOS.admin, 'imagens', [fotoJpg()]));

    assert.equal(r.status, 200);
    assert.deepEqual(enviados, ['produtos/novo-0.jpg']);
    const insert = consultas.find((c) => /INSERT INTO produtoimagens/.test(c.sql));
    // [produto_id, caminho, principal]: produto sem imagens, então a primeira vira a principal.
    assert.match(JSON.stringify(insert.values), /\[31,"https:\/\/img\.petcare\.test\/produtos\/novo-0\.jpg",1\]/);
});

test('admin troca o logo da loja e a imagem antiga é apagada depois', async (t) => {
    const enviados = [], removidos = [];
    simularR2(t, { enviados, removidos });
    const consultas = simularBanco(t, db, regrasCatalogo);

    const r = await comApp((base) => enviar(base, '/admin/lojas/9/imagem', USUARIOS.admin, 'imagem', [fotoJpg('logo.jpg')]));

    assert.equal(r.status, 200);
    assert.equal(r.body.imagem, 'https://img.petcare.test/lojas/novo-0.jpg');
    assert.deepEqual(consultas.find((c) => /^UPDATE lojas/.test(c.sql)).values, ['https://img.petcare.test/lojas/novo-0.jpg', 9]);
    assert.deepEqual(removidos, ['lojas/antiga.png']);
});

test('produto ou loja inexistente: 404 sem enviar nada', async (t) => {
    const enviados = [];
    simularR2(t, { enviados, removidos: [] });
    simularBanco(t, db, regrasCatalogo);

    await comApp(async (base) => {
        assert.equal((await enviar(base, '/admin/produtos/999/imagens', USUARIOS.admin, 'imagens', [fotoJpg()])).status, 404);
        assert.equal((await enviar(base, '/admin/lojas/999/imagem', USUARIOS.admin, 'imagem', [fotoJpg()])).status, 404);
    });
    assert.deepEqual(enviados, []);
});

test('arquivo que não é imagem de verdade é recusado (400) sem gravar', async (t) => {
    simularR2(t, { enviados: [], removidos: [] });
    const consultas = simularBanco(t, db, regrasCatalogo);
    const falso = { conteudo: Buffer.from('não sou imagem'), tipo: 'image/jpeg', nome: 'falso.jpg' };

    const r = await comApp((base) => enviar(base, '/admin/produtos/31/imagens', USUARIOS.admin, 'imagens', [falso]));

    assert.equal(r.status, 400);
    assert.ok(!consultas.some((c) => /INSERT INTO produtoimagens/.test(c.sql)));
});

test('catálogo da loja traz logo e produtos com as imagens', async (t) => {
    simularBanco(t, db, [
        [/SELECT id, nome_fantasia, imagem FROM lojas WHERE id = \?/, [{ id: 9, nome_fantasia: 'Pet Shop Central', imagem: null }]],
        [/SELECT id, nome, ativo FROM produtos WHERE loja_id = \?/, [{ id: 43, nome: 'Ração', ativo: 1 }, { id: 44, nome: 'Pote', ativo: 0 }]],
        [/FROM produtoimagens WHERE produto_id IN/, [{ id: 7, produto_id: 43, caminho: 'https://img.petcare.test/produtos/a.jpg', principal: 1 }]]
    ]);

    const r = await comApp(async (base) => {
        const resposta = await fetch(`${base}/admin/lojas/9/catalogo`, { headers: { Authorization: `Bearer ${token(USUARIOS.admin)}` } });
        return { status: resposta.status, body: await resposta.json() };
    });

    assert.equal(r.status, 200);
    assert.equal(r.body.nome_fantasia, 'Pet Shop Central');
    assert.deepEqual(r.body.produtos.map((p) => [p.id, p.ativo, p.imagens.length]), [[43, true, 1], [44, false, 0]]);
    assert.equal(r.body.produtos[0].imagens[0].principal, true);
});
