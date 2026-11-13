const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

process.env.MP_TOKEN_KEY = process.env.MP_TOKEN_KEY || crypto.randomBytes(32).toString('base64');

const { PaymentRefund } = require('mercadopago');
const db = require('../db');
const { cifrar } = require('../utils/criptografiaToken');
const { estornarVendaSePaga } = require('../Services/estornoService');
const pedidosRoutes = require('../Routes/pedidos');
const agendamentosRoutes = require('../Routes/agendamentos');

const silenciarLogs = (t) => {
    for (const metodo of ['log', 'warn', 'error']) t.mock.method(console, metodo, () => {});
};

const CONTA_LOJA = [{
    loja_id: 2, mp_user_id: '777',
    access_token_cifrado: cifrar('APP_USR-loja-2'),
    refresh_token_cifrado: cifrar('TG-r'),
    token_expira_em: new Date(Date.now() + 90 * 86400000)
}];

const pagamentoAprovado = (extra = {}) => ({
    id: 31, status: 'aprovado', gateway_payment_id: '999', valor: '80.00',
    valor_comissao: '8.00', loja_id: 2, ...extra
});

/** Regras de banco para um pagamento aprovado (split) da loja 2. */
const regrasPagamento = (pagamento = pagamentoAprovado()) => [
    [/FROM pagamentos\s+WHERE tipo_referencia = \?/, [pagamento]],
    [/FROM pagamentos p\s+LEFT JOIN/, [pagamento]],
    [/FROM lojas_mercadopago/, CONTA_LOJA],
    [/UPDATE pagamentos\s+SET status = \?/, { affectedRows: 1 }]
];

// ---------------------------------------------------------------
// Serviço de estorno
// ---------------------------------------------------------------

test('estorno do split usa o token da loja, chave de idempotência e marca estornado', async (t) => {
    const consultas = simularBanco(t, db, regrasPagamento());
    const criar = t.mock.method(PaymentRefund.prototype, 'create', async function () { return { id: 1 }; });

    assert.equal(await estornarVendaSePaga('agendamento', 5), true);

    const chamada = criar.mock.calls[0];
    assert.equal(chamada.this.config.accessToken, 'APP_USR-loja-2');
    assert.equal(chamada.arguments[0].payment_id, '999');
    assert.equal(chamada.arguments[0].requestOptions.idempotencyKey, 'estorno-pagamento-31');
    assert.deepEqual(consultas.at(-1).values, ['estornado', 31]);
});

test('pagamento antigo (antes do split) é estornado pela conta da plataforma', async (t) => {
    simularBanco(t, db, regrasPagamento(pagamentoAprovado({ valor_comissao: null })));
    const criar = t.mock.method(PaymentRefund.prototype, 'create', async () => ({ id: 1 }));

    await estornarVendaSePaga('pedido', 5);

    assert.notEqual(criar.mock.calls[0].this.config.accessToken, 'APP_USR-loja-2');
});

test('venda sem pagamento aprovado não estorna nada', async (t) => {
    simularBanco(t, db, [[/FROM pagamentos\s+WHERE tipo_referencia = \?/, [{ id: 1, status: 'cancelado' }]]]);
    const criar = t.mock.method(PaymentRefund.prototype, 'create', async () => ({}));

    assert.equal(await estornarVendaSePaga('agendamento', 5), false);
    assert.equal(criar.mock.callCount(), 0);
});

test('falha no Mercado Pago vira 502 com mensagem própria e não marca estornado', async (t) => {
    const consultas = simularBanco(t, db, regrasPagamento());
    t.mock.method(PaymentRefund.prototype, 'create', async () => { throw { status: 400, message: 'invalid payment status' }; });

    await assert.rejects(estornarVendaSePaga('agendamento', 5), (erro) =>
        erro.status === 502 && erro.paraUsuario && !/invalid/.test(erro.message));
    assert.ok(!consultas.some(c => /SET status = \?/.test(c.sql)));
});

// ---------------------------------------------------------------
// Cliente cancela pedido pago
// ---------------------------------------------------------------

const PEDIDO_PAGO = { id: 5, usuario_id: USUARIOS.cliente.id, loja_id: 2, total: '80.00', status: 'pago' };

test('cliente cancela pedido pago: estorna, cancela e devolve estoque', async (t) => {
    silenciarLogs(t);
    const consultas = simularBanco(t, db, [
        [/FROM pedidos\s+WHERE id = \?\s*$/m, [PEDIDO_PAGO]],
        ...regrasPagamento(),
        [/SELECT id FROM pedidos WHERE id = \? AND status = 'pago' FOR UPDATE/, [{ id: 5 }]],
        [/FROM itenspedido/, [{ item_id: 1, quantidade: 2 }]],
        [/UPDATE produtos SET estoque = estoque \+ \?/, { affectedRows: 1 }],
        [/UPDATE pedidos SET status = 'cancelado'/, { affectedRows: 1 }],
        [/INSERT INTO historico_status/, { insertId: 1 }]
    ]);
    const criar = t.mock.method(PaymentRefund.prototype, 'create', async () => ({ id: 1 }));

    await comServidor('/pedidos', pedidosRoutes, async (base) => {
        const r = await pedir(base, 'POST', '/pedidos/5/cancelar', USUARIOS.cliente);
        assert.equal(r.status, 200);
        assert.match(r.body.mensagem, /devolvido pelo Mercado Pago/);
    });

    assert.equal(criar.mock.callCount(), 1);
    const sqls = consultas.map(c => c.sql);
    const estorno = sqls.findIndex(s => /SET status = \?/.test(s));
    const cancelamento = sqls.findIndex(s => /UPDATE pedidos SET status = 'cancelado'/.test(s));
    assert.ok(estorno >= 0 && estorno < cancelamento, 'estorno antes do cancelamento');
    assert.ok(sqls.some(s => /estoque = estoque \+ \?/.test(s)));
});

test('se o estorno falhar, o pedido pago não é cancelado (502)', async (t) => {
    silenciarLogs(t);
    const consultas = simularBanco(t, db, [
        [/FROM pedidos\s+WHERE id = \?\s*$/m, [PEDIDO_PAGO]],
        ...regrasPagamento()
    ]);
    t.mock.method(PaymentRefund.prototype, 'create', async () => { throw new Error('timeout'); });

    await comServidor('/pedidos', pedidosRoutes, async (base) => {
        const r = await pedir(base, 'POST', '/pedidos/5/cancelar', USUARIOS.cliente);
        assert.equal(r.status, 502);
        assert.match(r.body.mensagem, /estornar/);
    });

    assert.ok(!consultas.some(c => /UPDATE pedidos SET status = 'cancelado'/.test(c.sql)));
});

test('cliente não cancela pedido de outro cliente', async (t) => {
    simularBanco(t, db, [[/FROM pedidos\s+WHERE id = \?\s*$/m, [PEDIDO_PAGO]]]);
    const criar = t.mock.method(PaymentRefund.prototype, 'create', async () => ({}));

    await comServidor('/pedidos', pedidosRoutes, async (base) => {
        const r = await pedir(base, 'POST', '/pedidos/5/cancelar', USUARIOS.outroCliente);
        assert.equal(r.status, 404);
    });

    assert.equal(criar.mock.callCount(), 0);
});

// ---------------------------------------------------------------
// Agendamentos
// ---------------------------------------------------------------

const AGENDAMENTO_CONFIRMADO = {
    id: 9, cliente_id: USUARIOS.cliente.id, status: 'confirmado',
    data_inicio: new Date(Date.now() + 2 * 86400000)
};

test('cliente cancela agendamento pago: estorna e só cancela se o status não mudou', async (t) => {
    silenciarLogs(t);
    const consultas = simularBanco(t, db, [
        [/FROM agendamentos\s+WHERE id = \?/, [AGENDAMENTO_CONFIRMADO]],
        ...regrasPagamento(),
        [/UPDATE agendamentos SET status = \? WHERE id = \? AND status = \?/, { affectedRows: 1 }]
    ]);
    const criar = t.mock.method(PaymentRefund.prototype, 'create', async () => ({ id: 1 }));

    await comServidor('/agendamentos', agendamentosRoutes, async (base) => {
        const r = await pedir(base, 'PUT', '/agendamentos/9/cancelar', USUARIOS.cliente);
        assert.equal(r.status, 200);
        assert.equal(r.body.estornado, true);
    });

    assert.equal(criar.mock.callCount(), 1);
    assert.deepEqual(consultas.at(-1).values, ['cancelado_cliente', '9', 'confirmado']);
});

test('loja cancela agendamento pago: cliente é reembolsado', async (t) => {
    silenciarLogs(t);
    const consultas = simularBanco(t, db, [
        [/SELECT id FROM lojas WHERE usuario_id = \?/, [{ id: 2 }]],
        [/SELECT id, status FROM agendamentos WHERE id = \? AND loja_id = \?/, [{ id: 9, status: 'confirmado' }]],
        ...regrasPagamento(),
        [/UPDATE agendamentos SET status = \? WHERE id = \? AND status = \?/, { affectedRows: 1 }]
    ]);
    const criar = t.mock.method(PaymentRefund.prototype, 'create', async () => ({ id: 1 }));

    await comServidor('/agendamentos', agendamentosRoutes, async (base) => {
        const r = await pedir(base, 'PUT', '/agendamentos/9/status', USUARIOS.lojista, { status: 'cancelado_loja' });
        assert.equal(r.status, 200);
        assert.match(r.body.message, /devolvido ao cliente/);
    });

    assert.equal(criar.mock.callCount(), 1);
    assert.deepEqual(consultas.at(-1).values, ['cancelado_loja', '9', 'confirmado']);
});

test('agendamento manual da loja (sem pagamento online) cancela sem estorno', async (t) => {
    silenciarLogs(t);
    simularBanco(t, db, [
        [/SELECT id FROM lojas WHERE usuario_id = \?/, [{ id: 2 }]],
        [/SELECT id, status FROM agendamentos WHERE id = \? AND loja_id = \?/, [{ id: 9, status: 'confirmado' }]],
        [/FROM pagamentos\s+WHERE tipo_referencia = \?/, []],
        [/UPDATE agendamentos SET status = \? WHERE id = \? AND status = \?/, { affectedRows: 1 }]
    ]);
    const criar = t.mock.method(PaymentRefund.prototype, 'create', async () => ({}));

    await comServidor('/agendamentos', agendamentosRoutes, async (base) => {
        const r = await pedir(base, 'PUT', '/agendamentos/9/status', USUARIOS.lojista, { status: 'cancelado_loja' });
        assert.equal(r.status, 200);
        assert.equal(r.body.estornado, false);
    });

    assert.equal(criar.mock.callCount(), 0);
});

test('estorno de agendamento falhou: agendamento continua confirmado (502)', async (t) => {
    silenciarLogs(t);
    const consultas = simularBanco(t, db, [
        [/FROM agendamentos\s+WHERE id = \?/, [AGENDAMENTO_CONFIRMADO]],
        ...regrasPagamento()
    ]);
    t.mock.method(PaymentRefund.prototype, 'create', async () => { throw new Error('timeout'); });

    await comServidor('/agendamentos', agendamentosRoutes, async (base) => {
        const r = await pedir(base, 'PUT', '/agendamentos/9/cancelar', USUARIOS.cliente);
        assert.equal(r.status, 502);
        assert.match(r.body.message, /estornar/);
    });

    assert.ok(!consultas.some(c => /UPDATE agendamentos/.test(c.sql)));
});

// ---------------------------------------------------------------
// Exclusão de agendamento
// ---------------------------------------------------------------

const regrasExclusao = (pagamentos) => [
    [/SELECT id FROM lojas WHERE usuario_id = \?/, [{ id: 2 }]],
    [/SELECT \* FROM agendamentos WHERE id = \? AND loja_id = \?/, [{ id: 9, status: 'confirmado' }]],
    [/SELECT id FROM pagamentos/, pagamentos],
    [/DELETE FROM agendamentos/, { affectedRows: 1 }]
];

test('lojista não exclui agendamento com pagamento online (409, nada apagado)', async (t) => {
    const consultas = simularBanco(t, db, regrasExclusao([{ id: 31 }]));

    await comServidor('/agendamentos', agendamentosRoutes, async (base) => {
        const r = await pedir(base, 'DELETE', '/agendamentos/9', USUARIOS.lojista);
        assert.equal(r.status, 409);
        assert.match(r.body.message, /Cancelar/);
    });

    assert.ok(!consultas.some(c => /DELETE FROM agendamentos/.test(c.sql)));
});

test('lojista continua excluindo agendamento manual (sem pagamento)', async (t) => {
    const consultas = simularBanco(t, db, regrasExclusao([]));

    await comServidor('/agendamentos', agendamentosRoutes, async (base) => {
        const r = await pedir(base, 'DELETE', '/agendamentos/9', USUARIOS.lojista);
        assert.equal(r.status, 200);
    });

    assert.ok(consultas.some(c => /DELETE FROM agendamentos/.test(c.sql)));
});
