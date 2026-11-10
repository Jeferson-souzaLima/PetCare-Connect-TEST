const assert = require('node:assert/strict');
const test = require('node:test');
const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

const db = require('../db');
const lojasRoutes = require('../Routes/lojas');

// Loja 2 pertence ao usuário 20 (USUARIOS.lojista). A loja 999 não existe.
function bancoDeLojas(t) {
    return simularBanco(t, db, [
        [/SELECT usuario_id FROM lojas WHERE id = \?/, (v) => (Number(v[0]) === 2 ? [{ usuario_id: 20 }] : [])],
        [/^\s*UPDATE lojas/, { affectedRows: 1 }],
        [/^DELETE FROM lojas/, { affectedRows: 1 }]
    ]);
}

const alterou = (consultas) => consultas.some((c) => /^(UPDATE|DELETE)/.test(c.sql));
const dados = { nome_fantasia: 'Invadida', cnpj: '00', descricao: 'x', cidade: 'x', uf: 'SP', endereco: 'x', ativo: 1 };

for (const [metodo, corpo] of [['PUT', dados], ['DELETE', undefined]]) {
    test(`${metodo} /lojas/:id — cliente não altera loja alheia (403, nada gravado)`, async (t) => {
        const consultas = bancoDeLojas(t);
        const r = await comServidor('/lojas', lojasRoutes, (b) => pedir(b, metodo, '/lojas/2', USUARIOS.cliente, corpo));
        assert.equal(r.status, 403);
        assert.equal(alterou(consultas), false);
    });

    test(`${metodo} /lojas/:id — lojista de outra loja é bloqueado (403, nada gravado)`, async (t) => {
        const consultas = bancoDeLojas(t);
        const r = await comServidor('/lojas', lojasRoutes, (b) => pedir(b, metodo, '/lojas/2', USUARIOS.outroLojista, corpo));
        assert.equal(r.status, 403);
        assert.equal(alterou(consultas), false);
    });

    test(`${metodo} /lojas/:id — dono da loja continua podendo (200)`, async (t) => {
        const consultas = bancoDeLojas(t);
        const r = await comServidor('/lojas', lojasRoutes, (b) => pedir(b, metodo, '/lojas/2', USUARIOS.lojista, corpo));
        assert.equal(r.status, 200);
        assert.equal(alterou(consultas), true);
    });

    test(`${metodo} /lojas/:id — admin continua podendo (200)`, async (t) => {
        bancoDeLojas(t);
        const r = await comServidor('/lojas', lojasRoutes, (b) => pedir(b, metodo, '/lojas/2', USUARIOS.admin, corpo));
        assert.equal(r.status, 200);
    });

    test(`${metodo} /lojas/:id — loja inexistente responde 404`, async (t) => {
        const consultas = bancoDeLojas(t);
        const r = await comServidor('/lojas', lojasRoutes, (b) => pedir(b, metodo, '/lojas/999', USUARIOS.lojista, corpo));
        assert.equal(r.status, 404);
        assert.equal(alterou(consultas), false);
    });

    test(`${metodo} /lojas/:id — sem token responde 401`, async (t) => {
        bancoDeLojas(t);
        const r = await comServidor('/lojas', lojasRoutes, (b) => pedir(b, metodo, '/lojas/2', null, corpo));
        assert.equal(r.status, 401);
    });
}
