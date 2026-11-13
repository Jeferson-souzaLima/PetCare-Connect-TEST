const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

process.env.MP_TOKEN_KEY = process.env.MP_TOKEN_KEY || crypto.randomBytes(32).toString('base64');

const { PaymentRefund } = require('mercadopago');
const db = require('../db');
const { cifrar } = require('../utils/criptografiaToken');
const adminRoutes = require('../Routes/admin');

const silenciarLogs = (t) => {
    for (const metodo of ['log', 'warn', 'error']) t.mock.method(console, metodo, () => {});
};

test('rotas do admin recusam visitante, cliente e lojista', async (t) => {
    const consultas = simularBanco(t, db, []);

    await comServidor('/admin', adminRoutes, async (base) => {
        assert.equal((await pedir(base, 'GET', '/admin/lojas')).status, 401);
        assert.equal((await pedir(base, 'GET', '/admin/usuarios', USUARIOS.cliente)).status, 403);
        assert.equal((await pedir(base, 'PATCH', '/admin/lojas/2', USUARIOS.lojista, { ativo: true })).status, 403);
        assert.equal((await pedir(base, 'POST', '/admin/pedidos/5/cancelar', USUARIOS.lojista)).status, 403);
    });

    assert.equal(consultas.length, 0);
});

test('admin lista lojas pendentes sem expor dados sensíveis', async (t) => {
    const consultas = simularBanco(t, db, [
        [/FROM lojas l/, [{ id: 4, nome_fantasia: 'Pet Nova', ativo: 0, email_verificado: 1, recebe_online: 0 }]]
    ]);

    await comServidor('/admin', adminRoutes, async (base) => {
        const r = await pedir(base, 'GET', '/admin/lojas', USUARIOS.admin);
        assert.equal(r.status, 200);
        assert.deepEqual(r.body[0], { id: 4, nome_fantasia: 'Pet Nova', ativo: false, email_verificado: true, recebe_online: false });

        assert.equal((await pedir(base, 'GET', '/admin/lojas?status=qualquer', USUARIOS.admin)).status, 400);
    });

    assert.match(consultas[0].sql, /WHERE l\.ativo = 0/);
    assert.doesNotMatch(consultas[0].sql, /senha|token/);
});

test('admin aprova e suspende loja; valida a entrada', async (t) => {
    const consultas = simularBanco(t, db, [
        [/UPDATE lojas SET ativo = \? WHERE id = \?/, (v) => ({ affectedRows: v[1] === 4 ? 1 : 0 })]
    ]);

    await comServidor('/admin', adminRoutes, async (base) => {
        const aprovar = await pedir(base, 'PATCH', '/admin/lojas/4', USUARIOS.admin, { ativo: true });
        assert.equal(aprovar.status, 200);
        assert.match(aprovar.body.mensagem, /aprovada/);

        assert.equal((await pedir(base, 'PATCH', '/admin/lojas/4', USUARIOS.admin, { ativo: false })).status, 200);
        assert.equal((await pedir(base, 'PATCH', '/admin/lojas/99', USUARIOS.admin, { ativo: true })).status, 404);
        assert.equal((await pedir(base, 'PATCH', '/admin/lojas/4', USUARIOS.admin, { ativo: 'sim' })).status, 400);
        assert.equal((await pedir(base, 'PATCH', '/admin/lojas/abc', USUARIOS.admin, { ativo: true })).status, 400);
    });

    assert.deepEqual(consultas.map(c => c.values), [[1, 4], [0, 4], [1, 99]]);
});

test('admin busca usuários por tipo e texto, com parâmetros no SQL', async (t) => {
    const consultas = simularBanco(t, db, [
        [/FROM usuarios/, [{ id: 10, nome: 'Ana', email: 'ana@exemplo.com', tipo: 'cliente', email_verificado: 0 }]]
    ]);

    await comServidor('/admin', adminRoutes, async (base) => {
        const r = await pedir(base, 'GET', '/admin/usuarios?tipo=cliente&busca=ana', USUARIOS.admin);
        assert.equal(r.status, 200);
        assert.equal(r.body[0].email_verificado, false);

        assert.equal((await pedir(base, 'GET', '/admin/usuarios?tipo=papel', USUARIOS.admin)).status, 400);
    });

    assert.deepEqual(consultas[0].values, ['cliente', '%ana%', '%ana%']);
    assert.doesNotMatch(consultas[0].sql, /senha_hash|token/);
});

const PEDIDO = (status) => ({ id: 5, usuario_id: 10, loja_id: 2, total: '80.00', status });

const regrasCancelamento = (pedido, pagamentos = []) => [
    [/FROM pedidos\s+WHERE id = \?\s*$/m, [pedido]],
    [/FROM pagamentos\s+WHERE tipo_referencia = \?/, pagamentos],
    [/FROM pagamentos p\s+LEFT JOIN/, pagamentos],
    [/FROM lojas_mercadopago/, [{
        loja_id: 2, mp_user_id: '777', access_token_cifrado: cifrar('APP_USR-loja-2'),
        refresh_token_cifrado: cifrar('TG-r'), token_expira_em: new Date(Date.now() + 90 * 86400000)
    }]],
    [/UPDATE pagamentos\s+SET status = \?/, { affectedRows: 1 }],
    [/SELECT id FROM pedidos WHERE id = \? AND status IN/, [{ id: 5 }]],
    [/FROM itenspedido/, [{ item_id: 1, quantidade: 2 }]],
    [/UPDATE produtos SET estoque = estoque \+ \?/, { affectedRows: 1 }],
    [/UPDATE pedidos SET status = 'cancelado'/, { affectedRows: 1 }],
    [/INSERT INTO historico_status/, { insertId: 1 }]
];

test('admin cancela pedido em preparo: estorna, cancela e devolve o estoque', async (t) => {
    silenciarLogs(t);
    const pagamento = { id: 31, status: 'aprovado', gateway_payment_id: '999', valor: '80.00', valor_comissao: '8.00', loja_id: 2 };
    const consultas = simularBanco(t, db, regrasCancelamento(PEDIDO('em_preparo'), [pagamento]));
    const criar = t.mock.method(PaymentRefund.prototype, 'create', async () => ({ id: 1 }));

    await comServidor('/admin', adminRoutes, async (base) => {
        const r = await pedir(base, 'POST', '/admin/pedidos/5/cancelar', USUARIOS.admin);
        assert.equal(r.status, 200);
        assert.match(r.body.mensagem, /estornado/);
    });

    assert.equal(criar.mock.callCount(), 1);
    const sqls = consultas.map(c => c.sql);
    const estorno = sqls.findIndex(s => /SET status = \?/.test(s));
    const cancelamento = sqls.findIndex(s => /UPDATE pedidos SET status = 'cancelado'/.test(s));
    assert.ok(estorno >= 0 && estorno < cancelamento, 'estorno antes do cancelamento');
    assert.ok(sqls.some(s => /estoque = estoque \+ \?/.test(s)));
});

test('admin não cancela pedido que já saiu para entrega', async (t) => {
    const consultas = simularBanco(t, db, regrasCancelamento(PEDIDO('em_entrega')));
    const criar = t.mock.method(PaymentRefund.prototype, 'create', async () => ({}));

    await comServidor('/admin', adminRoutes, async (base) => {
        const r = await pedir(base, 'POST', '/admin/pedidos/5/cancelar', USUARIOS.admin);
        assert.equal(r.status, 400);
    });

    assert.equal(criar.mock.callCount(), 0);
    assert.ok(!consultas.some(c => /UPDATE pedidos SET status = 'cancelado'/.test(c.sql)));
});
