const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

// db.js exige estas variáveis ao ser carregado; nenhum teste abre conexão real.
for (const nome of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET']) {
    process.env[nome] = process.env[nome] || (nome === 'JWT_SECRET' ? 'segredo-de-teste-com-mais-de-32-caracteres' : 'test');
}

const PagamentosModel = require('../Models/pagamentosModel');
const PedidosModel = require('../Models/pedidosModel');
const AgendamentosModel = require('../Models/agendamentosModel');
const MercadoPagoService = require('../Services/mercadoPagoService');
const MercadoPagoOAuthService = require('../Services/mercadoPagoOAuthService');
const EstornoService = require('../Services/estornoService');
const servico = require('../Services/pagamentoStatusService');
const controller = require('../Controllers/pagamentosController');

const silenciarLogs = (t) => {
    for (const metodo of ['log', 'warn', 'error']) t.mock.method(console, metodo, () => {});
};

/** Simula as chamadas de banco usadas no fluxo e registra o que foi chamado. */
function simularModelos(t, { pagamentos = [], pagamentoComLoja = null, agendamentoAfetado = 1 } = {}) {
    const chamadas = [];
    t.mock.method(PagamentosModel, 'getByReferencia', (tipo, id, cb) => {
        chamadas.push(['getByReferencia', tipo, id]);
        cb(null, pagamentos);
    });
    t.mock.method(PagamentosModel, 'getComLoja', async (id) => {
        chamadas.push(['getComLoja', id]);
        return pagamentoComLoja;
    });
    t.mock.method(PagamentosModel, 'updateTarifaGateway', async (id, tarifa) => {
        chamadas.push(['updateTarifaGateway', id, tarifa]);
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
    t.mock.method(AgendamentosModel, 'confirmarPagamento', (id, cb) => {
        chamadas.push(['agendamento.confirmarPagamento', id]);
        cb(null, { affectedRows: agendamentoAfetado });
    });
    t.mock.method(AgendamentosModel, 'cancelarPorFaltaDePagamento', (id, cb) => {
        chamadas.push(['agendamento.cancelarPorFaltaDePagamento', id]);
        cb(null, { affectedRows: 1 });
    });
    return chamadas;
}

/** Simula a conta Mercado Pago conectada: mp_user_id 777 é da loja 4. */
function simularContas(t) {
    t.mock.method(MercadoPagoOAuthService, 'obterContaPorUsuarioMercadoPago', async (mpUserId) =>
        (String(mpUserId) === '777' ? { lojaId: 4 } : null));
    t.mock.method(MercadoPagoOAuthService, 'obterAccessTokenDaLoja', async () => 'APP_USR-loja-4');
}

test('mapeia os status do Mercado Pago para os status internos', () => {
    assert.equal(servico.mapearStatusMercadoPago('approved'), 'aprovado');
    assert.equal(servico.mapearStatusMercadoPago('rejected'), 'recusado');
    assert.equal(servico.mapearStatusMercadoPago('cancelled'), 'cancelado');
    assert.equal(servico.mapearStatusMercadoPago('expired'), 'expirado');
    for (const s of ['pending', 'in_process', 'in_mediation']) {
        assert.equal(servico.mapearStatusMercadoPago(s), 'pendente');
    }
    assert.equal(servico.mapearStatusMercadoPago('refunded'), 'estornado');
    assert.equal(servico.mapearStatusMercadoPago('charged_back'), null);
    assert.equal(servico.mapearStatusMercadoPago('constructor'), null);
});

test('valorConfere aceita diferença de até 1 centavo e rejeita valores inválidos', () => {
    assert.equal(servico.valorConfere(100, 100), true);
    assert.equal(servico.valorConfere(100.005, 100), true);
    assert.equal(servico.valorConfere(100.02, 100), false);
    assert.equal(servico.valorConfere(NaN, 100), false);
    assert.equal(servico.valorConfere(100, NaN), false);
});

test('tarifa do gateway soma só a tarifa do Mercado Pago, sem a comissão', () => {
    assert.equal(servico.calcularTarifaGateway({
        fee_details: [
            { type: 'mercadopago_fee', amount: 2.99 },
            { type: 'application_fee', amount: 8 },
            { type: 'mercadopago_fee', amount: 0.1 }
        ]
    }), 3.09);
    assert.equal(servico.calcularTarifaGateway({}), 0);
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

test('pagamento aprovado de agendamento confirma o agendamento', (t, done) => {
    silenciarLogs(t);
    const chamadas = simularModelos(t);

    servico.registrarResultadoPagamento(
        { id: 3, tipo_referencia: 'agendamento', referencia_id: 9 },
        555,
        'aprovado',
        () => {
            assert.deepEqual(chamadas.at(-1), ['agendamento.confirmarPagamento', 9]);
            done();
        }
    );
});

test('pagamento aprovado depois do prazo não reconfirma o agendamento e é estornado', (t, done) => {
    silenciarLogs(t);
    simularModelos(t, { agendamentoAfetado: 0 });
    const estornar = t.mock.method(EstornoService, 'estornarPagamento', async () => {});

    servico.registrarResultadoPagamento(
        { id: 3, tipo_referencia: 'agendamento', referencia_id: 9, valor_comissao: '8.00', loja_id: 4 },
        555,
        'aprovado',
        () => {
            const { pagamento } = estornar.mock.calls[0].arguments[0];
            assert.equal(pagamento.id, 3);
            assert.equal(pagamento.gateway_payment_id, '555');
            done();
        }
    );
});

test('pedido aprovado com reserva vencida é estornado; falha no estorno fica no log', (t, done) => {
    silenciarLogs(t);
    simularModelos(t);
    t.mock.method(PedidosModel, 'confirmarPagamento', (id, cb) => cb(null, { affectedRows: 0 }));
    t.mock.method(EstornoService, 'estornarPagamento', async () => { throw new Error('mp fora'); });

    servico.registrarResultadoPagamento(
        { id: 7, tipo_referencia: 'pedido', referencia_id: 42 },
        123,
        'aprovado',
        () => {
            const logs = console.error.mock.calls.map(c => String(c.arguments[0]));
            assert.ok(logs.some(l => /ESTORNO MANUAL NECESSÁRIO/.test(l)));
            done();
        }
    );
});

test('pagamento expirado de agendamento cancela o agendamento (status válido)', (t, done) => {
    silenciarLogs(t);
    const chamadas = simularModelos(t);

    servico.registrarResultadoPagamento(
        { id: 3, tipo_referencia: 'agendamento', referencia_id: 9 },
        555,
        'expirado',
        () => {
            assert.deepEqual(chamadas.at(-1), ['agendamento.cancelarPorFaltaDePagamento', 9]);
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
            assert.equal(chamadas.some(([nome]) => nome.startsWith('agendamento.')), false);
            done();
        }
    );
});

// ---------------------------------------------------------------------------
// Webhook (ponta a ponta no controller, com assinatura válida e banco simulado)
// ---------------------------------------------------------------------------

const SEGREDO = 'segredo-de-teste';

function requisicaoAssinada(dataId, userId) {
    const requestId = 'req-1';
    const ts = '1704908010';
    const assinatura = crypto
        .createHmac('sha256', SEGREDO)
        .update(`id:${dataId};request-id:${requestId};ts:${ts};`)
        .digest('hex');

    return {
        query: { 'data.id': dataId },
        headers: { 'x-request-id': requestId, 'x-signature': `ts=${ts},v1=${assinatura}` },
        body: { type: 'payment', action: 'payment.updated', data: { id: dataId }, user_id: userId }
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

const PAGAMENTO_SPLIT = {
    id: 11, status: 'pendente', valor: '59.90', valor_comissao: '4.79',
    tipo_referencia: 'pedido', referencia_id: 5, loja_id: 4
};

test('webhook do split consulta o pagamento com o token da loja e confirma o pedido', async (t) => {
    silenciarLogs(t);
    process.env.MP_WEBHOOK_SECRET = SEGREDO;
    simularContas(t);
    const chamadas = simularModelos(t, { pagamentoComLoja: PAGAMENTO_SPLIT });
    const buscar = t.mock.method(MercadoPagoService, 'buscarPagamento', async () => ({
        id: 999, status: 'approved', external_reference: 'pagamento:11', transaction_amount: 59.9,
        fee_details: [{ type: 'mercadopago_fee', amount: 2.99 }, { type: 'application_fee', amount: 4.79 }]
    }));

    const resposta = await chamarWebhook(requisicaoAssinada('999', 777));

    assert.equal(resposta.status, 200);
    assert.deepEqual(buscar.mock.calls[0].arguments, ['999', 'APP_USR-loja-4']);
    assert.deepEqual(chamadas, [
        ['getComLoja', 11],
        ['updateTarifaGateway', 11, 2.99],
        ['updateGatewayPaymentId', 11, '999'],
        ['updateStatus', 11, 'aprovado'],
        ['confirmarPagamento', 5]
    ]);
});

test('webhook recusa pagamento recebido por conta de outra loja', async (t) => {
    silenciarLogs(t);
    process.env.MP_WEBHOOK_SECRET = SEGREDO;
    simularContas(t);
    const chamadas = simularModelos(t, { pagamentoComLoja: { ...PAGAMENTO_SPLIT, loja_id: 8 } });
    t.mock.method(MercadoPagoService, 'buscarPagamento', async () => ({
        id: 999, status: 'approved', external_reference: 'pagamento:11', transaction_amount: 59.9
    }));

    const resposta = await chamarWebhook(requisicaoAssinada('999', 777));

    assert.equal(resposta.status, 200);
    assert.deepEqual(chamadas, [['getComLoja', 11]]);
});

test('webhook recusa pagamento do split que chega pela conta da plataforma', async (t) => {
    silenciarLogs(t);
    process.env.MP_WEBHOOK_SECRET = SEGREDO;
    simularContas(t);
    const chamadas = simularModelos(t, { pagamentoComLoja: PAGAMENTO_SPLIT });
    const buscar = t.mock.method(MercadoPagoService, 'buscarPagamento', async () => ({
        id: 999, status: 'approved', external_reference: 'pagamento:11', transaction_amount: 59.9
    }));

    await chamarWebhook(requisicaoAssinada('999', 123));

    assert.equal(buscar.mock.calls[0].arguments[1], undefined);
    assert.deepEqual(chamadas, [['getComLoja', 11]]);
});

test('webhook de pagamento antigo (conta da plataforma) continua funcionando', async (t) => {
    silenciarLogs(t);
    process.env.MP_WEBHOOK_SECRET = SEGREDO;
    simularContas(t);
    const chamadas = simularModelos(t, {
        pagamentos: [{ id: 11, status: 'pendente', valor: '59.90', valor_comissao: null, tipo_referencia: 'pedido', referencia_id: 5 }]
    });
    t.mock.method(MercadoPagoService, 'buscarPagamento', async () => ({
        id: 999, status: 'approved', external_reference: 'pedido:5', transaction_amount: 59.9
    }));

    const resposta = await chamarWebhook(requisicaoAssinada('999', 123));

    assert.equal(resposta.status, 200);
    assert.deepEqual(chamadas, [
        ['getByReferencia', 'pedido', 5],
        ['updateTarifaGateway', 11, 0],
        ['updateGatewayPaymentId', 11, '999'],
        ['updateStatus', 11, 'aprovado'],
        ['confirmarPagamento', 5]
    ]);
});

test('aviso repetido de pagamento já aprovado é ignorado (não vira estorno)', async (t) => {
    silenciarLogs(t);
    process.env.MP_WEBHOOK_SECRET = SEGREDO;
    simularContas(t);
    const chamadas = simularModelos(t, { pagamentoComLoja: { ...PAGAMENTO_SPLIT, status: 'aprovado' } });
    const estornar = t.mock.method(EstornoService, 'estornarPagamento', async () => {});
    t.mock.method(MercadoPagoService, 'buscarPagamento', async () => ({
        id: 999, status: 'approved', external_reference: 'pagamento:11', transaction_amount: 59.9
    }));

    await chamarWebhook(requisicaoAssinada('999', 777));

    assert.deepEqual(chamadas, [['getComLoja', 11]]);
    assert.equal(estornar.mock.callCount(), 0);
});

test('webhook com valor divergente não altera nada', async (t) => {
    silenciarLogs(t);
    process.env.MP_WEBHOOK_SECRET = SEGREDO;
    simularContas(t);
    const chamadas = simularModelos(t, { pagamentoComLoja: PAGAMENTO_SPLIT });
    t.mock.method(MercadoPagoService, 'buscarPagamento', async () => ({
        id: 999, status: 'approved', external_reference: 'pagamento:11', transaction_amount: 1.0
    }));

    const resposta = await chamarWebhook(requisicaoAssinada('999', 777));

    assert.equal(resposta.status, 200);
    assert.deepEqual(chamadas, [['getComLoja', 11]]);
});

test('webhook com assinatura inválida responde 401', async (t) => {
    silenciarLogs(t);
    process.env.MP_WEBHOOK_SECRET = 'outro-segredo';

    const resposta = await chamarWebhook(requisicaoAssinada('999', 777));

    assert.equal(resposta.status, 401);
});
