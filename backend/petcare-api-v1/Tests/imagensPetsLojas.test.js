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
const petsRoutes = require('../Routes/pets');
const lojasRoutes = require('../Routes/lojas');
const tratarErros = require('../middlewares/tratarErros');

/*
 * Fotos de pets e imagens de lojas iam para "/uploads/undefined": o upload usa
 * memoryStorage e o arquivo nunca era gravado. Agora vão para o R2, com a
 * mesma validação de conteúdo dos produtos.
 */
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const URL_ANTIGA = 'https://img.petcare.test/pets/antiga.png';

function simularR2(t, { enviados, removidos }) {
    t.mock.method(r2Storage, 'upload', async function upload(file, pasta) {
        const { extension } = this.validateImage(file);
        const key = `${pasta}/novo-${enviados.length}${extension}`;
        enviados.push(key);
        return { key, url: `https://img.petcare.test/${key}` };
    });
    t.mock.method(r2Storage, 'deleteByKey', async (key) => { removidos.push(key); });
}

async function comApp(prefixo, rotas, fn) {
    const app = express();
    app.use(express.json());
    app.use(prefixo, rotas);
    app.use(tratarErros);
    const server = app.listen(0);
    try {
        return await fn(`http://127.0.0.1:${server.address().port}`);
    } finally {
        server.close();
    }
}

async function enviar(base, metodo, rota, usuario, campos = {}, arquivo) {
    const form = new FormData();
    for (const [k, v] of Object.entries(campos)) form.append(k, v);
    if (arquivo) form.append('imagem', new Blob([arquivo.conteudo], { type: arquivo.tipo }), arquivo.nome);
    const r = await fetch(`${base}${rota}`, { method: metodo, headers: { Authorization: `Bearer ${token(usuario)}` }, body: form });
    return { status: r.status, body: await r.json() };
}

const fotoPng = { conteudo: PNG, tipo: 'image/png', nome: 'rex.png' };

// Pet 5 é do cliente 10, com uma foto já salva no R2.
function bancoDePets(t, { falharGravacao = false } = {}) {
    const consultas = simularBanco(t, db, [
        [/FROM pets WHERE id = \? AND usuario_id = \?/, (v) =>
            (Number(v[0]) === 5 && Number(v[1]) === 10 ? [{ id: 5, usuario_id: 10, imagem: URL_ANTIGA }] : [])],
        [/^\s*INSERT INTO pets/, () => { if (falharGravacao) throw new Error('falha'); return { insertId: 9 }; }],
        [/^\s*UPDATE pets/, () => { if (falharGravacao) throw new Error('falha'); return { affectedRows: 1 }; }],
        [/^DELETE FROM pets/, { affectedRows: 1 }]
    ]);
    // simularBanco devolve o valor da regra; exceção na regra vira erro de banco.
    const original = db.query;
    t.mock.method(db, 'query', (sql, values, cb) => {
        try {
            return original(sql, values, cb);
        } catch (erro) {
            return cb(Object.assign(erro, { code: 'ER_X', sqlState: 'HY000' }));
        }
    });
    return consultas;
}

test('cadastrar pet com foto envia a imagem ao R2 (pasta pets) e grava a URL', async (t) => {
    const enviados = [], removidos = [];
    simularR2(t, { enviados, removidos });
    const consultas = bancoDePets(t);

    const r = await comApp('/pets', petsRoutes, (b) =>
        enviar(b, 'POST', '/pets', USUARIOS.cliente, { nome: 'Rex', especie: 'Cachorro', raca: '', idade: '' }, fotoPng));

    assert.equal(r.status, 201);
    assert.deepEqual(enviados, ['pets/novo-0.png']);
    const insert = consultas.find((c) => /^INSERT INTO pets/.test(c.sql));
    assert.ok(insert.values.includes('https://img.petcare.test/pets/novo-0.png'));
    assert.equal(insert.values.includes('/uploads/undefined'), false);
});

test('arquivo que não é imagem de verdade é recusado (400) sem gravar nada', async (t) => {
    const enviados = [], removidos = [];
    simularR2(t, { enviados, removidos });
    const consultas = bancoDePets(t);

    const falso = { conteudo: Buffer.from('não sou uma imagem'), tipo: 'image/png', nome: 'falso.png' };
    const r = await comApp('/pets', petsRoutes, (b) =>
        enviar(b, 'POST', '/pets', USUARIOS.cliente, { nome: 'Rex', especie: 'Cachorro' }, falso));

    assert.equal(r.status, 400);
    assert.match(r.body.mensagem, /JPEG ou PNG/);
    assert.equal(consultas.some((c) => /^INSERT/.test(c.sql)), false);
});

test('tipo de arquivo não aceito responde 400 em JSON (não a página de erro do Express)', async (t) => {
    simularR2(t, { enviados: [], removidos: [] });
    bancoDePets(t);
    const gif = { conteudo: Buffer.from('GIF89a'), tipo: 'image/gif', nome: 'a.gif' };
    const r = await comApp('/pets', petsRoutes, (b) =>
        enviar(b, 'POST', '/pets', USUARIOS.cliente, { nome: 'Rex', especie: 'Cachorro' }, gif));
    assert.equal(r.status, 400);
    assert.match(r.body.mensagem, /Tipo de arquivo inválido/);
});

test('cadastrar pet sem nome ou espécie é recusado (400)', async (t) => {
    simularR2(t, { enviados: [], removidos: [] });
    bancoDePets(t);
    const r = await comApp('/pets', petsRoutes, (b) => enviar(b, 'POST', '/pets', USUARIOS.cliente, { nome: 'Rex' }));
    assert.equal(r.status, 400);
});

test('trocar a foto apaga a antiga só depois de salvar a nova', async (t) => {
    const enviados = [], removidos = [];
    simularR2(t, { enviados, removidos });
    bancoDePets(t);

    const r = await comApp('/pets', petsRoutes, (b) =>
        enviar(b, 'PUT', '/pets/5', USUARIOS.cliente, { nome: 'Rex' }, fotoPng));

    assert.equal(r.status, 200);
    assert.equal(r.body.imagem, 'https://img.petcare.test/pets/novo-0.png');
    assert.deepEqual(removidos, ['pets/antiga.png']);
});

test('se o banco falhar, a foto recém-enviada é apagada e a antiga é mantida', async (t) => {
    const enviados = [], removidos = [];
    simularR2(t, { enviados, removidos });
    bancoDePets(t, { falharGravacao: true });

    const r = await comApp('/pets', petsRoutes, (b) =>
        enviar(b, 'PUT', '/pets/5', USUARIOS.cliente, {}, fotoPng));

    assert.equal(r.status, 500);
    assert.deepEqual(removidos, ['pets/novo-0.png']);
});

test('pet de outra pessoa: 404, sem enviar nem apagar imagem', async (t) => {
    const enviados = [], removidos = [];
    simularR2(t, { enviados, removidos });
    const consultas = bancoDePets(t);

    for (const [metodo, rota] of [['PUT', '/pets/5'], ['POST', '/pets/5/imagem'], ['DELETE', '/pets/5']]) {
        const r = await comApp('/pets', petsRoutes, (b) => enviar(b, metodo, rota, USUARIOS.outroCliente, {}, fotoPng));
        assert.equal(r.status, 404, `${metodo} ${rota}`);
    }
    assert.deepEqual(enviados, []);
    assert.deepEqual(removidos, []);
    assert.equal(consultas.some((c) => /^(UPDATE|DELETE)/.test(c.sql)), false);
});

test('editar pet sem nenhum campo não derruba a API', async (t) => {
    simularR2(t, { enviados: [], removidos: [] });
    bancoDePets(t);
    const r = await comApp('/pets', petsRoutes, (b) => enviar(b, 'PUT', '/pets/5', USUARIOS.cliente, {}));
    assert.equal(r.status, 200);
});

test('excluir pet apaga a foto dele', async (t) => {
    const enviados = [], removidos = [];
    simularR2(t, { enviados, removidos });
    bancoDePets(t);
    const r = await comApp('/pets', petsRoutes, (b) => enviar(b, 'DELETE', '/pets/5', USUARIOS.cliente));
    assert.equal(r.status, 200);
    assert.deepEqual(removidos, ['pets/antiga.png']);
});

test('imagem da loja vai para o R2 (pasta lojas) e a anterior é apagada', async (t) => {
    const enviados = [], removidos = [];
    simularR2(t, { enviados, removidos });
    const consultas = simularBanco(t, db, [
        [/SELECT \* FROM lojas WHERE usuario_id = \?/, [{ id: 2, usuario_id: 20, imagem: 'https://img.petcare.test/lojas/antiga.png' }]],
        [/^UPDATE lojas SET imagem/, { affectedRows: 1 }]
    ]);

    const r = await comApp('/lojas', lojasRoutes, (b) => enviar(b, 'POST', '/lojas/minha/imagem', USUARIOS.lojista, {}, fotoPng));

    assert.equal(r.status, 200);
    assert.equal(r.body.imagem, 'https://img.petcare.test/lojas/novo-0.png');
    assert.deepEqual(enviados, ['lojas/novo-0.png']);
    assert.deepEqual(removidos, ['lojas/antiga.png']);
    assert.deepEqual(consultas.find((c) => /^UPDATE lojas/.test(c.sql)).values, ['https://img.petcare.test/lojas/novo-0.png', 2, 20]);
});
