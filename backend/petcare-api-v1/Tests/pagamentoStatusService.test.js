const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

// db.js exige estas variáveis ao ser carregado; nenhum teste abre conexão real.
for (const nome of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET']) {
    process.env[nome] = process.env[nome] || 'test';
}

const PagamentosModel = require('../Models/pagamentosModel');
const PedidosModel = require('../Models/pedidosModel');
const AgendamentosModel = require('../Models/agendamentosModel');
const MercadoPagoService = require('../Services/mercadoPagoService');
const servico = require('../Services/pagamentoStatusService');
const controller = require('../Controllers/pagamentosController');

const silenciarLogs = (t) => {
    for (const metodo of ['log', 'warn', 'error']) t.mock.method(console, metodo, () => {});
};

/** Simula as chamadas de banco usadas no fluxo e registra o que foi chamado. */
function simularModelos(t, { pagamentos = [] } = {}) {
    const chamadas = [];
    t.mock.method(PagamentosModel, 'getByReferencia', (tipo, id, cb) => {
        chamadas.push(['getByReferencia', tipo, id]);
        cb(null, pagamentos);
    });
    t.mock.method(PagamentosModel, 'updateGatewayPaymentId', (id, gatewayId, cb) => {
        chamadas.push(['updateGatewayPaymentId', id, gatewayId]);
        cb(null);
    });
    t.mock.method(PagamentosModel, 'updateStatus', (id, status, cb) => {
        chamadas.push(['updateStatus', id, status]);
        cb(null);
    });
    t.mock.method(PedidosModel, 'confirmarPagamento', (id, cb) => {
        chamadas.push(['confirmarPagamento', id]);
        cb(null, { affectedRows: 1 });
    });
    t.mock.method(AgendamentosModel, 'atualizarStatus', (id, status, cb) => {
        chamadas.push(['agendamento.atualizarStatus', id, status]);
        cb(null);
    });
    return chamadas;
}

test('mapeia os status do Mercado Pago para os status internos', () => {
    assert.equal(servico.mapearStatusMercadoPago('approved'), 'aprovado');
    assert.equal(servico.mapearStatusMercadoPago('rejected'), 'recusado');
    assert.equal(servico.mapearStatusMercadoPago('cancelled'), 'cancelado');
    assert.equal(servico.mapearStatusMercadoPago('expired'), 'expirado');
    for (const s of ['pending', 'in_process', 'in_mediation']) {
        assert.equal(servico.mapearStatusMercadoPago(s), 'pendente');
    }
    assert.equal(servico.mapearStatusMercadoPago('refunded'), null);
    assert.equal(servico.mapearStatusMercadoPago('constructor'), null);
});

test('valorConfere aceita diferença de até 1 centavo e rejeita valores inválidos', () => {
    assert.equal(servico.valorConfere(100, 100), true);
    assert.equal(servico.valorConfere(100.005, 100), true);
    assert.equal(servico.valorConfere(100.02, 100), false);
    assert.equal(servico.valorConfere(NaN, 100), false);
    assert.equal(servico.valorConfere(100, NaN), false);
});

test('pagamento aprovado de pedido grava gateway, status e confirma o pedido', (t, done) => {
    silenciarLogs(t);
    const chamadas = simularModelos(t);

    servico.registrarResultadoPagamento(
        { id: 7, tipo_referencia: 'pedido', referencia_id: 42 },
        123456,
        'aprovado',
        () => {
            assert.deepEqual(chamadas, [
                ['updateGatewayPaymentId', 7, '123456'],
                ['updateStatus', 7, 'aprovado'],
                ['confirmarPagamento', 42]
            ]);
            done();
        }
    );
});

test('pagamento expirado de agendamento cancela o agendamento', (t, done) => {
    silenciarLogs(t);
    const chamadas = simularModelos(t);

    servico.registrarResultadoPagamento(
        { id: 3, tipo_referencia: 'agendamento', referencia_id: 9 },
        555,
        'expirado',
        () => {
            assert.deepEqual(chamadas.at(-1), ['agendamento.atualizarStatus', 9, 'cancelado']);
            done();
        }
    );
});

test('pagamento recusado de agendamento não altera o agendamento', (t, done) => {
    silenciarLogs(t);
    const chamadas = simularModelos(t);

    servico.registrarResultadoPagamento(
        { id: 3, tipo_referencia: 'agendamento', referencia_id: 9 },
        555,
        'recusado',
        () => {
            assert.equal(chamadas.some(([nome]) => nome === 'agendamento.atualizarStatus'), false);
            done();
        }
    );
});

// ---------------------------------------------------------------------------
// Webhook (ponta a ponta no controller, com assinatura válida e banco simulado)
// ---------------------------------------------------------------------------

const SEGREDO = 'segredo-de-teste';

function requisicaoAssinada(dataId) {
    const requestId = 'req-1';
    const ts = '1704908010';
    const assinatura = crypto
        .createHmac('sha256', SEGREDO)
        .update(`id:${dataId};request-id:${requestId};ts:${ts};`)
        .digest('hex');

    return {
        query: { 'data.id': dataId },
        headers: { 'x-request-id': requestId, 'x-signature': `ts=${ts},v1=${assinatura}` },
        body: { type: 'payment', action: 'payment.updated', data: { id: dataId } }
    };
}

function chamarWebhook(req) {
    return new Promise((resolve) => {
        const res = {
            status(code) { this.code = code; return this; },
            json(body) { resolve({ status: this.code, body }); return this; },
            sendStatus(code) { resolve({ status: code }); return this; }
        };
        controller.webhook(req, res);
    });
}

test('webhook aprovado de pedido atualiza pagamento e confirma o pedido', async (t) => {
    silenciarLogs(t);
    process.env.MP_WEBHOOK_SECRET = SEGREDO;
    const chamadas = simularModelos(t, {
        pagamentos: [{ id: 11, status: 'pendente', valor: '59.90', tipo_referencia: 'pedido', referencia_id: 5 }]
    });
    t.mock.method(MercadoPagoService, 'buscarPagamento', async () => ({
        id: 999, status: 'approved', external_reference: 'pedido:5', transaction_amount: 59.9
    }));

    const resposta = await chamarWebhook(requisicaoAssinada('999'));

    assert.equal(resposta.status, 200);
    assert.deepEqual(chamadas, [
        ['getByReferencia', 'pedido', 5],
        ['updateGatewayPaymentId', 11, '999'],
        ['updateStatus', 11, 'aprovado'],
        ['confirmarPagamento', 5]
    ]);
});

test('webhook com valor divergente não altera nada', async (t) => {
    silenciarLogs(t);
    process.env.MP_WEBHOOK_SECRET = SEGREDO;
    const chamadas = simularModelos(t, {
        pagamentos: [{ id: 11, status: 'pendente', valor: '59.90', tipo_referencia: 'pedido', referencia_id: 5 }]
    });
    t.mock.method(MercadoPagoService, 'buscarPagamento', async () => ({
        id: 999, status: 'approved', external_reference: 'pedido:5', transaction_amount: 1.0
    }));

    const resposta = await chamarWebhook(requisicaoAssinada('999'));

    assert.equal(resposta.status, 200);
    assert.deepEqual(chamadas, [['getByReferencia', 'pedido', 5]]);
});

test('webhook com assinatura inválida responde 401', async (t) => {
    silenciarLogs(t);
    process.env.MP_WEBHOOK_SECRET = 'outro-segredo';

    const resposta = await chamarWebhook(requisicaoAssinada('999'));

    assert.equal(resposta.status, 401);
});
