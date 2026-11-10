const assert = require('node:assert/strict');
const test = require('node:test');
const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

const db = require('../db');
const agendamentosRoutes = require('../Routes/agendamentos');

/*
 * M1: o lojista criava pelo POST /agendamentos um agendamento já "confirmado"
 * em serviço de outra loja, ocupando a agenda do concorrente.
 * Serviço 50 é da loja 2 (lojista 20); serviço 60 é da loja 3 (lojista 30).
 * A agenda da loja simulada não está configurada: quem passa da checagem do
 * serviço recebe 400 "Agenda não configurada", antes de qualquer INSERT.
 */
const SERVICOS = {
    50: { id: 50, loja_id: 2, ativo: 1, duracao_min: 30 },
    60: { id: 60, loja_id: 3, ativo: 1, duracao_min: 30 }
};
const LOJA_DO_LOJISTA = { 20: 2, 30: 3 };

function banco(t) {
    return simularBanco(t, db, [
        [/FROM servicos WHERE id = \?/, (v) => (SERVICOS[v[0]] ? [SERVICOS[v[0]]] : [])],
        [/FROM lojas\s+WHERE usuario_id = \?/, (v) => (LOJA_DO_LOJISTA[v[0]] ? [{ id: LOJA_DO_LOJISTA[v[0]] }] : [])],
        [/FROM agenda_config/, []],
        [/^\s*INSERT INTO agendamentos/, { insertId: 1 }]
    ]);
}

const amanha = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const corpo = (servicoId) => ({
    servico_id: servicoId,
    data_inicio: amanha(),
    pet_nome: 'Rex',
    cliente_nome_externo: 'Cliente de balcão'
});
const inseriu = (consultas) => consultas.some((c) => /^INSERT INTO agendamentos/.test(c.sql));

test('lojista não agenda em serviço de outra loja (404, nada gravado)', async (t) => {
    const consultas = banco(t);
    const r = await comServidor('/agendamentos', agendamentosRoutes, (b) =>
        pedir(b, 'POST', '/agendamentos', USUARIOS.lojista, corpo(60)));
    assert.equal(r.status, 404);
    assert.equal(inseriu(consultas), false);
});

test('lojista continua agendando em serviço da própria loja', async (t) => {
    banco(t);
    const r = await comServidor('/agendamentos', agendamentosRoutes, (b) =>
        pedir(b, 'POST', '/agendamentos', USUARIOS.lojista, corpo(50)));
    assert.equal(r.status, 400);
    assert.match(r.body.message, /Agenda não configurada/);
});

test('cliente continua agendando em serviço de qualquer loja', async (t) => {
    banco(t);
    const r = await comServidor('/agendamentos', agendamentosRoutes, (b) =>
        pedir(b, 'POST', '/agendamentos', USUARIOS.cliente, corpo(60)));
    assert.equal(r.status, 400);
    assert.match(r.body.message, /Agenda não configurada/);
});

test('admin não cria agendamento sem cliente nem loja definidos (403)', async (t) => {
    const consultas = banco(t);
    const r = await comServidor('/agendamentos', agendamentosRoutes, (b) =>
        pedir(b, 'POST', '/agendamentos', USUARIOS.admin, corpo(50)));
    assert.equal(r.status, 403);
    assert.equal(inseriu(consultas), false);
});
