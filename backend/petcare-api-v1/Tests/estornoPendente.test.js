const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

process.env.MP_TOKEN_KEY = process.env.MP_TOKEN_KEY || crypto.randomBytes(32).toString('base64');

const { PaymentRefund, Preference } = require('mercadopago');
const db = require('../db');
const { cifrar } = require('../utils/criptografiaToken');
const EmailService = require('../Services/emailService');
const MercadoPagoService = require('../Services/mercadoPagoService');
const { estornarPagamento, reprocessarEstornosPendentes } = require('../Services/estornoService');
const adminRoutes = require('../Routes/admin');

const silenciarLogs = (t) => {
    for (const metodo of ['log', 'warn', 'error']) t.mock.method(console, metodo, () => {});
};

const CONTA_LOJA = [{
    loja_id: 2, mp_user_id: '777',
    access_token_cifrado: cifrar('APP_USR-loja-2'),
    refresh_token_cifrado: cifrar('TG-r'),
    token_expira_em: new Date(Date.now() + 90 * 86400000)
}];

const pagamento = (extra = {}) => ({
    id: 31, status: 'aprovado', gateway_payment_id: '999', valor: '80.00', valor_comissao: '8.00',
    tipo_referencia: 'pedido', referencia_id: 5, loja_id: 2,
    estorno_pendente_desde: null, estorno_ultima_falha_em: null, ...extra
});

const regras = (dadosPagamento = pagamento()) => [
    [/FROM lojas_mercadopago/, CONTA_LOJA],
    [/SET estorno_ultima_falha_em = NOW\(\)/, { affectedRows: 1 }],
    [/FROM usuarios WHERE tipo = 'admin'/, [{ email: 'admin@petcare.test' }]],
    [/FROM lojas l INNER JOIN usuarios u/, [{ nome_fantasia: 'Pet A', email: 'loja@petcare.test' }]],
    [/SELECT id FROM pagamentos\s+WHERE status = 'aprovado' AND estorno_pendente_desde IS NOT NULL/, [{ id: 31 }]],
    [/FROM pagamentos p\s+LEFT JOIN/, [dadosPagamento]],
    [/UPDATE pagamentos\s+SET status = \?/, { affectedRows: 1 }]
];

/** Espera os avisos por e-mail, que saem em segundo plano. */
const aguardarAvisos = () => new Promise((resolve) => setImmediate(resolve));

function simularEmails(t) {
    return {
        admin: t.mock.method(EmailService, 'enviarAlertaEstornoAdmin', async () => {}),
        loja: t.mock.method(EmailService, 'enviarAvisoEstornoLoja', async () => {})
    };
}

test('estorno obrigatório recusado fica pendente e avisa admins e loja', async (t) => {
    silenciarLogs(t);
    const consultas = simularBanco(t, db, regras());
    const emails = simularEmails(t);
    t.mock.method(PaymentRefund.prototype, 'create', async () => { throw new Error('insufficient_money_for_refund'); });

    await assert.rejects(estornarPagamento({ pagamento: pagamento(), obrigatorio: true }), (erro) => erro.status === 502);
    await aguardarAvisos();

    const falha = consultas.find((c) => /SET estorno_ultima_falha_em = NOW\(\)/.test(c.sql));
    assert.deepEqual(falha.values, ['insufficient_money_for_refund', 1, 31]);
    assert.deepEqual(emails.admin.mock.calls[0].arguments[0], ['admin@petcare.test']);
    assert.equal(emails.admin.mock.calls[0].arguments[1].obrigatorio, true);
    assert.equal(emails.loja.mock.calls[0].arguments[0], 'loja@petcare.test');
    assert.ok(!consultas.some((c) => /SET status = \?/.test(c.sql)), 'não marca estornado');
});

test('cancelamento pedido por alguém que falha no estorno não fica pendente', async (t) => {
    silenciarLogs(t);
    const consultas = simularBanco(t, db, regras());
    simularEmails(t);
    t.mock.method(PaymentRefund.prototype, 'create', async () => { throw new Error('timeout'); });

    await assert.rejects(estornarPagamento({ pagamento: pagamento() }));

    const falha = consultas.find((c) => /SET estorno_ultima_falha_em = NOW\(\)/.test(c.sql));
    assert.equal(falha.values[1], 0, 'só registra a falha; a venda continua e pode ser cancelada de novo');
});

test('falhas repetidas em menos de 6 horas não repetem o e-mail', async (t) => {
    silenciarLogs(t);
    simularBanco(t, db, regras());
    const emails = simularEmails(t);
    t.mock.method(PaymentRefund.prototype, 'create', async () => { throw new Error('insufficient_money_for_refund'); });

    const falhouHaUmaHora = pagamento({ estorno_pendente_desde: new Date(), estorno_ultima_falha_em: new Date(Date.now() - 3600000) });
    await assert.rejects(estornarPagamento({ pagamento: falhouHaUmaHora, obrigatorio: true }));
    await aguardarAvisos();

    assert.equal(emails.admin.mock.callCount(), 0);
});

test('loja que desconectou o Mercado Pago também conta como estorno recusado', async (t) => {
    silenciarLogs(t);
    const consultas = simularBanco(t, db, [...regras().filter(([re]) => !/lojas_mercadopago/.test(String(re))), [/FROM lojas_mercadopago/, []]]);
    simularEmails(t);

    await assert.rejects(estornarPagamento({ pagamento: pagamento(), obrigatorio: true }));
    assert.ok(consultas.some((c) => /SET estorno_ultima_falha_em = NOW\(\)/.test(c.sql)));
});

test('reprocessamento estorna o pendente e limpa a pendência', async (t) => {
    silenciarLogs(t);
    const consultas = simularBanco(t, db, regras(pagamento({ estorno_pendente_desde: new Date() })));
    t.mock.method(PaymentRefund.prototype, 'create', async () => ({ id: 1 }));

    assert.deepEqual(await reprocessarEstornosPendentes(), { estornados: 1, falhas: 0 });

    const marcar = consultas.find((c) => /SET status = \?/.test(c.sql));
    assert.match(marcar.sql, /estorno_pendente_desde = CASE WHEN \? = 'estornado' THEN NULL/);
    assert.deepEqual(marcar.values, ['estornado', 'estornado', 31]);
});

test('admin lista estornos com falha e tenta de novo só os pendentes', async (t) => {
    silenciarLogs(t);
    const pendente = pagamento({ estorno_pendente_desde: new Date() });
    let atual = pendente;
    simularBanco(t, db, [
        [/WHERE p\.status = 'aprovado'\s+AND \(p\.estorno_pendente_desde IS NOT NULL/, [
            { id: 31, valor: '80.00', estorno_pendente_desde: '2026-11-19 10:00:00', loja: 'Pet A' },
            { id: 32, valor: '50.00', estorno_pendente_desde: null, loja: 'Pet A' }
        ]],
        ...regras().filter(([re]) => !/FROM pagamentos p\\s\+LEFT JOIN/.test(String(re))),
        [/FROM pagamentos p\s+LEFT JOIN/, () => [atual]]
    ]);
    t.mock.method(PaymentRefund.prototype, 'create', async () => ({ id: 1 }));

    await comServidor('/admin', adminRoutes, async (base) => {
        assert.equal((await pedir(base, 'GET', '/admin/estornos', USUARIOS.lojista)).status, 403);

        const lista = await pedir(base, 'GET', '/admin/estornos', USUARIOS.admin);
        assert.equal(lista.status, 200);
        assert.deepEqual(lista.body.map((e) => [e.id, e.valor, e.pendente]), [[31, 80, true], [32, 50, false]]);

        atual = pagamento();
        assert.equal((await pedir(base, 'POST', '/admin/estornos/31/tentar', USUARIOS.admin)).status, 400);

        atual = pendente;
        const tentativa = await pedir(base, 'POST', '/admin/estornos/31/tentar', USUARIOS.admin);
        assert.equal(tentativa.status, 200);
        assert.match(tentativa.body.mensagem, /Estorno feito/);
    });
});

test('cobrança não oferece boleto nem pagamento em lotérica', async (t) => {
    const criar = t.mock.method(Preference.prototype, 'create', async () => ({ id: 'pref' }));

    await MercadoPagoService.criarPreferencia({
        accessToken: 'APP_USR-loja-2', marketplaceFee: 8, referenciaExterna: 'pagamento:1', itens: [], expiraEm: new Date()
    });

    assert.deepEqual(criar.mock.calls[0].arguments[0].body.payment_methods, {
        excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }]
    });
});
