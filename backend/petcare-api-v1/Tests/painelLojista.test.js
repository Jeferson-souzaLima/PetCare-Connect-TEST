const assert = require('node:assert/strict');
const test = require('node:test');

const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

const db = require('../db');
const relatoriosRoutes = require('../Routes/relatorios');
const { agoraNoHorarioDasLojas, adicionarDias } = require('../utils/dataLocal');

const { data: HOJE } = agoraNoHorarioDasLojas();
const INICIO = adicionarDias(HOJE, -29);
const ONTEM_DO_PERIODO_ANTERIOR = adicionarDias(INICIO, -1);

const regras = ({ vendas = [], proximos = [] } = {}) => [
    [/DATE_FORMAT\(pg\.updated_at/, vendas],
    [/FROM agendamentos a\s+WHERE a\.loja_id = \?\s+AND a\.status IN/, [{ atual: '6', anterior: '4' }]],
    [/MIN\(data\) AS primeira/, [{ atual: '3', anterior: '0' }]],
    [/AND a\.status = 'confirmado'\s+AND a\.data_inicio >= \?/, proximos],
    [/AS pedidos_a_preparar/, [{ pedidos_a_preparar: 2, agendamentos_hoje: 1 }]]
];

test('painel recusa visitante e cliente', async (t) => {
    const consultas = simularBanco(t, db, regras());

    await comServidor('/relatorios', relatoriosRoutes, async (base) => {
        assert.equal((await pedir(base, 'GET', '/relatorios/painel')).status, 401);
        assert.equal((await pedir(base, 'GET', '/relatorios/painel', USUARIOS.cliente)).status, 403);
    });

    assert.equal(consultas.length, 0);
});

test('painel compara os últimos 30 dias com os 30 anteriores, só da loja do token', async (t) => {
    const consultas = simularBanco(t, db, regras({
        vendas: [
            { data: ONTEM_DO_PERIODO_ANTERIOR, receita: '100.00', pedidos: 2 },
            { data: INICIO, receita: '80.00', pedidos: 1 },
            { data: HOJE, receita: '70.50', pedidos: 2 }
        ],
        proximos: [{ id: 9, data_inicio: `${HOJE}T15:00:00`, servico: 'Banho', pet_nome: 'Thor', cliente: 'Ana' }]
    }));

    await comServidor('/relatorios', relatoriosRoutes, async (base) => {
        const r = await pedir(base, 'GET', '/relatorios/painel', USUARIOS.lojista);
        assert.equal(r.status, 200);
        assert.deepEqual(r.body.periodo, { data_inicial: INICIO, data_final: HOJE });
        assert.deepEqual(r.body.indicadores, {
            vendas: { atual: 150.5, anterior: 100, variacao: 50.5 },
            pedidos: { atual: 3, anterior: 2, variacao: 50 },
            agendamentos: { atual: 6, anterior: 4, variacao: 50 },
            novos_clientes: { atual: 3, anterior: 0, variacao: null }
        });

        assert.equal(r.body.vendas_por_dia.length, 30);
        assert.deepEqual(r.body.vendas_por_dia[0], { data: INICIO, receita: 80 });
        assert.deepEqual(r.body.vendas_por_dia[29], { data: HOJE, receita: 70.5 });
        assert.equal(r.body.vendas_por_dia[1].receita, 0);

        assert.equal(r.body.proximos_agendamentos[0].pet_nome, 'Thor');
        assert.deepEqual(r.body.pendencias, { pedidos_a_preparar: 2, agendamentos_hoje: 1 });
    });

    // Toda consulta é filtrada pela loja do token (loja 2), nunca por parâmetro do cliente.
    for (const consulta of consultas) {
        assert.ok(consulta.values.includes(USUARIOS.lojista.loja_id), consulta.sql.slice(0, 80));
    }
    const proximos = consultas.find((c) => /AND a\.status = 'confirmado'\s+AND a\.data_inicio >= \?/.test(c.sql));
    assert.match(proximos.values[1], /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
});

test('sem vendas, o painel mostra zeros e sem variação', async (t) => {
    simularBanco(t, db, regras());

    await comServidor('/relatorios', relatoriosRoutes, async (base) => {
        const r = await pedir(base, 'GET', '/relatorios/painel', USUARIOS.lojista);
        assert.equal(r.status, 200);
        assert.deepEqual(r.body.indicadores.vendas, { atual: 0, anterior: 0, variacao: null });
        assert.ok(r.body.vendas_por_dia.every((dia) => dia.receita === 0));
    });
});

test('horário das lojas usa o fuso de Brasília', () => {
    // 02:30 UTC de 15/11 ainda é 23:30 de 14/11 em Brasília.
    assert.deepEqual(agoraNoHorarioDasLojas(new Date('2026-11-15T02:30:00Z')), {
        data: '2026-11-14',
        dataHora: '2026-11-14 23:30:00'
    });
});
