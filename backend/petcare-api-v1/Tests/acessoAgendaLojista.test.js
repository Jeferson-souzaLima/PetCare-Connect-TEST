const assert = require('node:assert/strict');
const test = require('node:test');
const { comServidor, pedir, USUARIOS } = require('./apoioAcesso');

const db = require('../db');
const agendaLojistaRoutes = require('../Routes/agendaLojista');

// A disponibilidade 40 e o bloqueio 50 pertencem à loja 2 (USUARIOS.lojista).
const REGISTROS = { agenda_disponibilidade: { 40: 2 }, agenda_bloqueios: { 50: 2 } };

// Simula o DELETE de verdade: só apaga se o filtro usado na consulta bater com o dono.
function bancoComDono(t) {
    const apagados = [];
    t.mock.method(db, 'query', (sql, values, cb) => {
        const tabela = /DELETE FROM (agenda_disponibilidade|agenda_bloqueios)/.exec(sql)?.[1];
        if (!tabela) return cb(new Error(`SQL inesperado no teste: ${sql}`));
        const [id, lojaFiltro] = values;
        const lojaDona = REGISTROS[tabela][id];
        const filtraPorLoja = /loja_id = \?/.test(sql);
        const apaga = lojaDona !== undefined && (!filtraPorLoja || Number(lojaFiltro) === lojaDona);
        if (apaga) apagados.push(`${tabela}:${id}`);
        cb(null, { affectedRows: apaga ? 1 : 0 });
    });
    return apagados;
}

for (const [rota, id] of [['/agenda-lojista/disponibilidade', 40], ['/agenda-lojista/bloqueios', 50]]) {
    const chamar = (usuario, alvo = id) =>
        comServidor('/agenda-lojista', agendaLojistaRoutes, (b) => pedir(b, 'DELETE', `${rota}/${alvo}`, usuario));

    test(`DELETE ${rota}/:id — lojista de outra loja não apaga (404, nada apagado)`, async (t) => {
        const apagados = bancoComDono(t);
        const r = await chamar(USUARIOS.outroLojista);
        assert.equal(r.status, 404);
        assert.deepEqual(apagados, []);
    });

    test(`DELETE ${rota}/:id — cliente não apaga (403, nada apagado)`, async (t) => {
        const apagados = bancoComDono(t);
        const r = await chamar(USUARIOS.cliente);
        assert.equal(r.status, 403);
        assert.deepEqual(apagados, []);
    });

    test(`DELETE ${rota}/:id — o lojista dono apaga (200)`, async (t) => {
        const apagados = bancoComDono(t);
        const r = await chamar(USUARIOS.lojista);
        assert.equal(r.status, 200);
        assert.equal(apagados.length, 1);
    });

    test(`DELETE ${rota}/:id — id inexistente responde 404`, async (t) => {
        bancoComDono(t);
        assert.equal((await chamar(USUARIOS.lojista, 999)).status, 404);
    });

    test(`DELETE ${rota}/:id — sem token responde 401`, async (t) => {
        bancoComDono(t);
        assert.equal((await chamar(null)).status, 401);
    });
}
