const assert = require('node:assert/strict');
const test = require('node:test');

const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

const db = require('../db');
const relatoriosRoutes = require('../Routes/relatorios');
const { calcularLiquido } = require('../Services/comissaoService');

test('líquido da loja = total − comissão − tarifa, em centavos', () => {
    assert.equal(calcularLiquido('115.00', '8.00', '5.74'), 101.26);
    assert.equal(calcularLiquido(0.3, 0.1, 0.1), 0.1);
    assert.equal(calcularLiquido('80.00', null, null), 80);
});

test('relatório traz comissão, tarifa, líquido e a divisão de cada venda', async (t) => {
    const consultas = simularBanco(t, db, [
        [/AS comissao_total/, [{
            receita_produtos: '115.00', receita_servicos: '80.00', receita_total: '195.00',
            comissao_total: '16.00', tarifa_total: '9.74', pedidos_pagos: 1, agendamentos_pagos: 1
        }]],
        [/GROUP BY DATE\(pg\.updated_at\)/, []],
        [/FROM itenspedido|INNER JOIN itenspedido/, []],
        [/SELECT COUNT\(\*\) AS total/, [{ total: 1 }]],
        [/GROUP BY status/, []],
        [/INNER JOIN servicos/, []],
        [/AS pagamento_id/, [
            { pagamento_id: 1, tipo_referencia: 'pedido', referencia_id: 5, status: 'aprovado', valor: '115.00', valor_comissao: '8.00', tarifa_gateway: '5.74', data: '2026-11-13T10:00:00Z' },
            { pagamento_id: 2, tipo_referencia: 'agendamento', referencia_id: 9, status: 'estornado', valor: '80.00', valor_comissao: '8.00', tarifa_gateway: null, data: '2026-11-12T10:00:00Z' }
        ]]
    ]);

    await comServidor('/relatorios', relatoriosRoutes, async (base) => {
        const r = await pedir(base, 'GET', '/relatorios?data_inicial=2026-11-01&data_final=2026-11-13', USUARIOS.lojista);
        assert.equal(r.status, 200);

        const resumo = r.body.resumo_financeiro;
        assert.equal(resumo.comissao_total, 16);
        assert.equal(resumo.tarifa_total, 9.74);
        assert.equal(resumo.valor_liquido, 169.26);

        assert.deepEqual(r.body.vendas[0], {
            pagamento_id: 1, tipo: 'pedido', referencia_id: 5, status: 'aprovado', data: '2026-11-13T10:00:00Z',
            valor: 115, comissao: 8, tarifa_gateway: 5.74, valor_liquido: 101.26
        });
        assert.equal(r.body.vendas[1].tarifa_gateway, null);
        assert.equal(r.body.vendas[1].status, 'estornado');
    });

    // A lista de vendas é sempre da loja do token.
    const vendas = consultas.find(c => /AS pagamento_id/.test(c.sql));
    assert.deepEqual(vendas.values.slice(0, 2), [2, 2]);
});
