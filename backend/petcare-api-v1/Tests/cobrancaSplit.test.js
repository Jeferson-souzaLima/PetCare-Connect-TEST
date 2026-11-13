const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

process.env.MP_TOKEN_KEY = process.env.MP_TOKEN_KEY || crypto.randomBytes(32).toString('base64');
process.env.MP_CLIENT_ID = '123456';
process.env.MP_CLIENT_SECRET = 'segredo-cliente';
process.env.MP_OAUTH_REDIRECT_URI = 'https://api.exemplo.com/mercadopago/oauth/retorno';

const { OAuth, Preference } = require('mercadopago');
const db = require('../db');
const { cifrar, decifrar } = require('../utils/criptografiaToken');
const { iniciarCobranca } = require('../Services/cobrancaService');
const { obterAccessTokenDaLoja } = require('../Services/mercadoPagoOAuthService');
const AgendamentosModel = require('../Models/agendamentosModel');
const pagamentosRoutes = require('../Routes/pagamentos');
const pedidosRoutes = require('../Routes/pedidos');

const DIA = 24 * 60 * 60 * 1000;

const silenciarLogs = (t) => {
    for (const metodo of ['log', 'warn', 'error']) t.mock.method(console, metodo, () => {});
};

const contaDaLoja = (expiraEmMs = 90 * DIA) => ({
    loja_id: 4,
    mp_user_id: '777',
    access_token_cifrado: cifrar('APP_USR-loja-4'),
    refresh_token_cifrado: cifrar('TG-renovacao'),
    token_expira_em: new Date(Date.now() + expiraEmMs)
});

const ITENS = [{ id: '1', title: 'Ração', quantity: 1, currency_id: 'BRL', unit_price: 100 }];

// ---------------------------------------------------------------
// Token da loja
// ---------------------------------------------------------------

test('token válido é usado sem renovar', async (t) => {
    simularBanco(t, db, [[/FROM lojas_mercadopago/, [contaDaLoja()]]]);
    const refresh = t.mock.method(OAuth.prototype, 'refresh', async () => ({}));

    assert.equal(await obterAccessTokenDaLoja(4), 'APP_USR-loja-4');
    assert.equal(refresh.mock.callCount(), 0);
});

test('token perto de expirar é renovado e gravado cifrado', async (t) => {
    const consultas = simularBanco(t, db, [
        [/FROM lojas_mercadopago/, [contaDaLoja(3 * DIA)]],
        [/INSERT INTO lojas_mercadopago/, { affectedRows: 2 }]
    ]);
    const refresh = t.mock.method(OAuth.prototype, 'refresh', async () => ({
        access_token: 'APP_USR-novo', refresh_token: 'TG-novo', user_id: 777, expires_in: 15552000
    }));

    assert.equal(await obterAccessTokenDaLoja(4), 'APP_USR-novo');
    assert.equal(refresh.mock.calls[0].arguments[0].body.refresh_token, 'TG-renovacao');

    const gravado = consultas.find(c => /INSERT INTO lojas_mercadopago/.test(c.sql)).values;
    assert.equal(decifrar(gravado[2]), 'APP_USR-novo');
    assert.equal(decifrar(gravado[3]), 'TG-novo');
});

test('se a renovação falhar, usa o token atual enquanto ele valer', async (t) => {
    silenciarLogs(t);
    simularBanco(t, db, [[/FROM lojas_mercadopago/, [contaDaLoja(3 * DIA)]]]);
    t.mock.method(OAuth.prototype, 'refresh', async () => { throw new Error('invalid_grant'); });

    assert.equal(await obterAccessTokenDaLoja(4), 'APP_USR-loja-4');
});

test('autorização vencida e sem renovação possível bloqueia a cobrança (409)', async (t) => {
    silenciarLogs(t);
    simularBanco(t, db, [[/FROM lojas_mercadopago/, [contaDaLoja(-DIA)]]]);
    t.mock.method(OAuth.prototype, 'refresh', async () => { throw new Error('invalid_grant'); });

    await assert.rejects(obterAccessTokenDaLoja(4), (erro) => erro.status === 409);
});

test('loja sem conta conectada não pode cobrar (409)', async (t) => {
    simularBanco(t, db, [[/FROM lojas_mercadopago/, []]]);

    await assert.rejects(obterAccessTokenDaLoja(4), (erro) => erro.status === 409);
});

// ---------------------------------------------------------------
// Cobrança
// ---------------------------------------------------------------

test('cobrança é criada na conta da loja com a comissão como marketplace_fee', async (t) => {
    const consultas = simularBanco(t, db, [
        [/FROM lojas_mercadopago/, [contaDaLoja()]],
        [/UPDATE pagamentos\s+SET status = 'cancelado'/, { affectedRows: 1 }],
        [/INSERT INTO pagamentos/, { insertId: 55 }],
        [/SET gateway_preference_id/, { affectedRows: 1 }]
    ]);
    const criar = t.mock.method(Preference.prototype, 'create', async function () {
        return { id: 'pref-1', init_point: 'https://mp/checkout' };
    });
    const expiraEm = new Date('2026-11-13T15:00:00.000Z');

    const cobranca = await iniciarCobranca({
        tipoReferencia: 'pedido', referenciaId: 9, lojaId: 4,
        valor: 115, baseComissao: 100, itens: ITENS, expiraEm
    });

    assert.deepEqual(cobranca, { pagamentoId: 55, preferenceId: 'pref-1', checkoutUrl: 'https://mp/checkout' });

    // Preferência na conta da loja, apontando para a tentativa criada.
    const chamada = criar.mock.calls[0];
    assert.equal(chamada.this.config.accessToken, 'APP_USR-loja-4');
    const corpo = chamada.arguments[0].body;
    assert.equal(corpo.marketplace_fee, 8);
    assert.equal(corpo.external_reference, 'pagamento:55');
    assert.equal(corpo.expires, true);
    assert.equal(corpo.date_of_expiration, expiraEm.toISOString());

    // Tentativas pendentes anteriores são substituídas, na mesma transação.
    const sqls = consultas.map(c => c.sql);
    const inicio = sqls.indexOf('BEGIN');
    assert.ok(inicio >= 0);
    assert.match(sqls[inicio + 1], /SET status = 'cancelado'/);
    assert.match(sqls[inicio + 2], /INSERT INTO pagamentos/);
    assert.equal(sqls[inicio + 3], 'COMMIT');
    assert.deepEqual(consultas[inicio + 2].values, ['pedido', 9, 115, 8, 8]);
});

test('falha ao criar a preferência cancela a tentativa', async (t) => {
    const consultas = simularBanco(t, db, [
        [/FROM lojas_mercadopago/, [contaDaLoja()]],
        [/UPDATE pagamentos\s+SET status = 'cancelado'/, { affectedRows: 0 }],
        [/INSERT INTO pagamentos/, { insertId: 56 }],
        [/UPDATE pagamentos SET status = 'cancelado' WHERE id = \?/, { affectedRows: 1 }]
    ]);
    t.mock.method(Preference.prototype, 'create', async () => { throw new Error('mp fora do ar'); });

    await assert.rejects(iniciarCobranca({
        tipoReferencia: 'agendamento', referenciaId: 3, lojaId: 4, valor: 80, baseComissao: 80, itens: ITENS
    }), /mp fora do ar/);

    assert.deepEqual(consultas.at(-1).values, [56]);
});

test('loja sem conta: a cobrança não grava nada', async (t) => {
    const consultas = simularBanco(t, db, [[/FROM lojas_mercadopago/, []]]);

    await assert.rejects(iniciarCobranca({
        tipoReferencia: 'pedido', referenciaId: 9, lojaId: 4, valor: 10, baseComissao: 10, itens: ITENS
    }), (erro) => erro.status === 409);

    assert.equal(consultas.length, 1);
});

// ---------------------------------------------------------------
// Pagamento de agendamento
// ---------------------------------------------------------------

const agendamento = (criadoHaMin) => ({
    id: 3, cliente_id: USUARIOS.cliente.id, servico_id: 7, loja_id: 4, status: 'aguardando_pagamento',
    created_at: new Date(Date.now() - criadoHaMin * 60000), servico_nome: 'Banho', valor: '80.00'
});

test('pagamento de agendamento usa 10% sobre o serviço e expira no prazo', async (t) => {
    simularBanco(t, db, [
        [/FROM agendamentos a/, [agendamento(5)]],
        [/FROM lojas_mercadopago/, [contaDaLoja()]],
        [/UPDATE pagamentos\s+SET status = 'cancelado'/, { affectedRows: 0 }],
        [/INSERT INTO pagamentos/, { insertId: 70 }],
        [/SET gateway_preference_id/, { affectedRows: 1 }]
    ]);
    const criar = t.mock.method(Preference.prototype, 'create', async () => ({ id: 'pref-2', init_point: 'https://mp/ag' }));

    await comServidor('/pagamentos', pagamentosRoutes, async (base) => {
        const r = await pedir(base, 'POST', '/pagamentos/agendamento/3', USUARIOS.cliente);
        assert.equal(r.status, 201);
        assert.equal(r.body.checkout_url, 'https://mp/ag');
    });

    const corpo = criar.mock.calls[0].arguments[0].body;
    assert.equal(corpo.marketplace_fee, 8);
    assert.equal(corpo.items[0].title, 'Banho');
    const minutosAteExpirar = (new Date(corpo.date_of_expiration) - Date.now()) / 60000;
    assert.ok(minutosAteExpirar > 24 && minutosAteExpirar <= 25, String(minutosAteExpirar));
});

test('agendamento com prazo de pagamento vencido não gera cobrança', async (t) => {
    const consultas = simularBanco(t, db, [[/FROM agendamentos a/, [agendamento(31)]]]);

    await comServidor('/pagamentos', pagamentosRoutes, async (base) => {
        const r = await pedir(base, 'POST', '/pagamentos/agendamento/3', USUARIOS.cliente);
        assert.equal(r.status, 400);
        assert.match(r.body.mensagem, /prazo/);
    });

    assert.equal(consultas.length, 1);
});

test('cliente não paga agendamento de outro cliente', async (t) => {
    simularBanco(t, db, [[/FROM agendamentos a/, [agendamento(5)]]]);

    await comServidor('/pagamentos', pagamentosRoutes, async (base) => {
        const r = await pedir(base, 'POST', '/pagamentos/agendamento/3', USUARIOS.outroCliente);
        assert.equal(r.status, 403);
    });
});

test('nova tentativa de pagamento é aceita mesmo com uma pendente (cliente não fica travado)', async (t) => {
    simularBanco(t, db, [
        [/FROM agendamentos a/, [agendamento(5)]],
        [/FROM lojas_mercadopago/, [contaDaLoja()]],
        [/UPDATE pagamentos\s+SET status = 'cancelado'/, { affectedRows: 1 }],
        [/INSERT INTO pagamentos/, { insertId: 71 }],
        [/SET gateway_preference_id/, { affectedRows: 1 }]
    ]);
    t.mock.method(Preference.prototype, 'create', async () => ({ id: 'pref-3', init_point: 'https://mp/ag2' }));

    await comServidor('/pagamentos', pagamentosRoutes, async (base) => {
        const r = await pedir(base, 'POST', '/pagamentos/agendamento/3', USUARIOS.cliente);
        assert.equal(r.status, 201);
    });
});

// ---------------------------------------------------------------
// Checkout de pedido
// ---------------------------------------------------------------

test('checkout em loja sem conta conectada é recusado antes de reservar estoque', async (t) => {
    const consultas = simularBanco(t, db, [[/FROM lojas_mercadopago/, []]]);

    await comServidor('/pedidos', pedidosRoutes, async (base) => {
        const r = await pedir(base, 'POST', '/pedidos/checkout', USUARIOS.cliente, { loja_id: 4, itens: [{ produto_id: 1, quantidade: 1 }] });
        assert.equal(r.status, 409);
    });

    assert.ok(!consultas.some(c => c.sql === 'BEGIN'));
});

// ---------------------------------------------------------------
// Liberação de horários não pagos
// ---------------------------------------------------------------

test('libera horários vencidos e expira as tentativas pendentes deles', (t, done) => {
    const consultas = simularBanco(t, db, [
        [/SELECT id FROM agendamentos/, [{ id: 3 }, { id: 8 }]],
        [/UPDATE agendamentos SET status = 'cancelado_cliente'/, { affectedRows: 2 }],
        [/UPDATE pagamentos SET status = 'expirado'/, { affectedRows: 2 }]
    ]);

    AgendamentosModel.liberarHorariosNaoPagos(35, (erro, liberados) => {
        assert.equal(erro, null);
        assert.equal(liberados, 2);
        assert.deepEqual(consultas[1].values, [35]);
        assert.match(consultas[1].sql, /criado_por = 'cliente'/);
        assert.deepEqual(consultas[2].values, [[3, 8]]);
        assert.deepEqual(consultas[3].values, [[3, 8]]);
        assert.equal(consultas.at(-1).sql, 'COMMIT');
        done();
    });
});
