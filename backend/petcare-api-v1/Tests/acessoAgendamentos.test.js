const assert = require('node:assert/strict');
const test = require('node:test');
const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

const db = require('../db');
const agendamentosRoutes = require('../Routes/agendamentos');

/*
 * Cenário: o cliente 10 tem o pedido 7 e o agendamento 8, ambos na loja 2
 * (do lojista 20). Pagamento 5 é do pedido 7; pagamento 6, do agendamento 8.
 */
const PEDIDO = { id: 7, usuario_id: 10, loja_id: 2 };
const AGENDAMENTO = { id: 8, cliente_id: 10, loja_id: 2, pedido_id: 7, servico_nome: 'Banho', cliente_nome: 'Fulano' };
const PAGAMENTOS = {
    5: { id: 5, tipo_referencia: 'pedido', referencia_id: 7, status: 'aprovado', valor: 50 },
    6: { id: 6, tipo_referencia: 'agendamento', referencia_id: 8, status: 'aprovado', valor: 40 }
};
const LOJA_DO_LOJISTA = { 20: 2, 30: 3 };

function bancoSimulado(t) {
    return simularBanco(t, db, [
        [/FROM pagamentos\s+WHERE id = \?/, (v) => (PAGAMENTOS[v[0]] ? [PAGAMENTOS[v[0]]] : [])],
        [/FROM pagamentos\s+WHERE tipo_referencia = \?/, (v) =>
            Object.values(PAGAMENTOS).filter((p) => p.tipo_referencia === v[0] && String(p.referencia_id) === String(v[1]))],
        // As consultas de dono renomeiam a coluna para dono_id; o MySQL devolve só as colunas pedidas.
        [/AS dono_id, loja_id FROM pedidos\s+WHERE id = \?/, (v) => (Number(v[0]) === 7 ? [{ dono_id: PEDIDO.usuario_id, loja_id: PEDIDO.loja_id }] : [])],
        [/FROM agendamentos a\s+JOIN/, (v) => (Number(v[0]) === 8 ? [AGENDAMENTO] : [])],
        [/FROM agendamentos\s+WHERE pedido_id = \?/, (v) => (Number(v[0]) === 7 ? [AGENDAMENTO] : [])],
        [/AS dono_id, loja_id FROM agendamentos\s+WHERE id = \?/, (v) => (Number(v[0]) === 8 ? [{ dono_id: AGENDAMENTO.cliente_id, loja_id: AGENDAMENTO.loja_id }] : [])],
        [/FROM lojas\s+WHERE usuario_id = \?/, (v) => (LOJA_DO_LOJISTA[v[0]] ? [{ id: LOJA_DO_LOJISTA[v[0]] }] : [])]
    ]);
}

const ROTAS = [
    ['/agendamentos', agendamentosRoutes, '/agendamentos/8', 'GET /agendamentos/:id'],
    ['/agendamentos', agendamentosRoutes, '/agendamentos/pedido/7', 'GET /agendamentos/pedido/:pedido_id']
];

for (const [prefixo, rotas, url, nome] of ROTAS) {
    const chamar = (t, usuario) => {
        t.mock.method(console, 'error', () => {});
        bancoSimulado(t);
        return comServidor(prefixo, rotas, (b) => pedir(b, 'GET', url, usuario));
    };

    test(`${nome} — outro cliente não vê (404, sem dados)`, async (t) => {
        const r = await chamar(t, USUARIOS.outroCliente);
        assert.equal(r.status, 404);
        assert.equal(JSON.stringify(r.body).includes('Fulano'), false);
        assert.equal(JSON.stringify(r.body).includes('valor'), false);
    });

    test(`${nome} — lojista de outra loja não vê (404)`, async (t) => {
        assert.equal((await chamar(t, USUARIOS.outroLojista)).status, 404);
    });

    test(`${nome} — o próprio cliente vê (200)`, async (t) => {
        assert.equal((await chamar(t, USUARIOS.cliente)).status, 200);
    });

    test(`${nome} — o lojista da loja vê (200)`, async (t) => {
        assert.equal((await chamar(t, USUARIOS.lojista)).status, 200);
    });

    test(`${nome} — admin vê (200)`, async (t) => {
        assert.equal((await chamar(t, USUARIOS.admin)).status, 200);
    });

    test(`${nome} — sem token responde 401`, async (t) => {
        assert.equal((await chamar(t, null)).status, 401);
    });
}

test('GET /agendamentos/pedido/:id de pedido inexistente responde 404', async (t) => {
    bancoSimulado(t);
    const r = await comServidor('/agendamentos', agendamentosRoutes, (b) => pedir(b, 'GET', '/agendamentos/pedido/999', USUARIOS.cliente));
    assert.equal(r.status, 404);
});
