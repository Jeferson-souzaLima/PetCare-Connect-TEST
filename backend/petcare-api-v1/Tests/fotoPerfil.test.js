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
const usuariosRoutes = require('../Routes/usuarios');
const tratarErros = require('../middlewares/tratarErros');

/*
 * Foto de perfil: cada usuário troca ou remove só a própria (o id vem do token).
 * A imagem vai para o R2 (pasta usuarios) com a mesma validação de conteúdo dos pets;
 * a antiga só é apagada depois de gravar a nova.
 */
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const FOTO_ANTIGA = 'https://img.petcare.test/usuarios/antiga.png';
const fotoPng = { conteudo: PNG, tipo: 'image/png', nome: 'eu.png' };

function simularR2(t) {
    const enviados = [], removidos = [];
    t.mock.method(r2Storage, 'upload', async function upload(file, pasta) {
        const { extension } = this.validateImage(file);
        const key = `${pasta}/nova-${enviados.length}${extension}`;
        enviados.push(key);
        return { key, url: `https://img.petcare.test/${key}` };
    });
    t.mock.method(r2Storage, 'deleteByKey', async (key) => { removidos.push(key); });
    return { enviados, removidos };
}

// Cliente 10 já tem foto; cliente 11 não tem; outros ids não existem.
function banco(t, { falharGravacao = false } = {}) {
    const consultas = simularBanco(t, db, [
        [/SELECT foto FROM usuarios WHERE id = \?/, (v) => {
            if (Number(v[0]) === 10) return [{ foto: FOTO_ANTIGA }];
            if (Number(v[0]) === 11) return [{ foto: null }];
            return [];
        }],
        [/^\s*UPDATE usuarios SET foto = \? WHERE id = \?/, () => {
            if (falharGravacao) throw new Error('falha');
            return { affectedRows: 1 };
        }]
    ]);
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

async function comApp(fn) {
    const app = express();
    app.use(express.json());
    app.use('/usuarios', usuariosRoutes);
    app.use(tratarErros);
    const server = app.listen(0);
    try {
        return await fn(`http://127.0.0.1:${server.address().port}`);
    } finally {
        server.close();
    }
}

async function pedir(base, metodo, usuario, arquivo) {
    const headers = usuario ? { Authorization: `Bearer ${token(usuario)}` } : {};
    let body;
    if (metodo === 'PUT') {
        body = new FormData();
        if (arquivo) body.append('foto', new Blob([arquivo.conteudo], { type: arquivo.tipo }), arquivo.nome);
    }
    const r = await fetch(`${base}/usuarios/me/foto`, { method: metodo, headers, body });
    return { status: r.status, body: await r.json() };
}

const updates = (consultas) => consultas.filter((c) => /^UPDATE usuarios SET foto/.test(c.sql));

test('sem login não troca nem remove a foto (401)', async (t) => {
    simularR2(t);
    banco(t);
    const r = await comApp(async (b) => [await pedir(b, 'PUT', null, fotoPng), await pedir(b, 'DELETE', null)]);
    assert.deepEqual(r.map((x) => x.status), [401, 401]);
});

test('trocar a foto envia ao R2 (pasta usuarios), grava a URL só no próprio usuário e apaga a antiga depois', async (t) => {
    const r2 = simularR2(t);
    const consultas = banco(t);
    const r = await comApp((b) => pedir(b, 'PUT', USUARIOS.cliente, fotoPng));

    assert.equal(r.status, 200);
    assert.equal(r.body.foto, 'https://img.petcare.test/usuarios/nova-0.png');
    assert.deepEqual(r2.enviados, ['usuarios/nova-0.png']);
    const [update] = updates(consultas);
    assert.deepEqual(update.values.map(String), ['https://img.petcare.test/usuarios/nova-0.png', '10']);
    assert.deepEqual(r2.removidos, ['usuarios/antiga.png']);
});

test('sem arquivo, ou com arquivo que não é imagem de verdade, responde 400 sem gravar', async (t) => {
    const r2 = simularR2(t);
    const consultas = banco(t);
    const falso = { conteudo: Buffer.from('não sou uma imagem'), tipo: 'image/png', nome: 'falso.png' };
    const gif = { conteudo: Buffer.from('GIF89a'), tipo: 'image/gif', nome: 'a.gif' };
    const r = await comApp(async (b) => [
        await pedir(b, 'PUT', USUARIOS.cliente),
        await pedir(b, 'PUT', USUARIOS.cliente, falso),
        await pedir(b, 'PUT', USUARIOS.cliente, gif)
    ]);
    assert.deepEqual(r.map((x) => x.status), [400, 400, 400]);
    assert.equal(updates(consultas).length, 0);
    assert.deepEqual(r2.removidos, []);
});

test('se gravar no banco falhar, a imagem nova é apagada e a antiga continua', async (t) => {
    const r2 = simularR2(t);
    banco(t, { falharGravacao: true });
    const r = await comApp((b) => pedir(b, 'PUT', USUARIOS.cliente, fotoPng));
    assert.equal(r.status, 500);
    assert.deepEqual(r2.removidos, ['usuarios/nova-0.png']);
});

test('remover a foto limpa a coluna do próprio usuário e apaga o arquivo; sem foto, não faz nada', async (t) => {
    const r2 = simularR2(t);
    const consultas = banco(t);
    const r = await comApp(async (b) => [await pedir(b, 'DELETE', USUARIOS.cliente), await pedir(b, 'DELETE', USUARIOS.outroCliente)]);

    assert.deepEqual(r.map((x) => [x.status, x.body.foto]), [[200, null], [200, null]]);
    const feitos = updates(consultas);
    assert.equal(feitos.length, 1);
    assert.deepEqual(feitos[0].values.map(String), ['null', '10']);
    assert.deepEqual(r2.removidos, ['usuarios/antiga.png']);
});
