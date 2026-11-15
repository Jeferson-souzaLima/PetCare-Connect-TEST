const assert = require('node:assert/strict');
const test = require('node:test');

const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

const db = require('../db');
const adminRoutes = require('../Routes/admin');
const buscaRoutes = require('../Routes/busca');
const buscaModel = require('../Models/buscaModel');

const ANO_ATUAL = new Date().getFullYear();

const silenciarLogs = (t) => {
    for (const metodo of ['log', 'warn', 'error']) t.mock.method(console, metodo, () => {});
};

test('indicadores do admin recusam visitante, cliente e lojista', async (t) => {
    const consultas = simularBanco(t, db, []);

    await comServidor('/admin', adminRoutes, async (base) => {
        assert.equal((await pedir(base, 'GET', '/admin/financeiro')).status, 401);
        assert.equal((await pedir(base, 'GET', '/admin/financeiro', USUARIOS.cliente)).status, 403);
        assert.equal((await pedir(base, 'GET', '/admin/rankings', USUARIOS.lojista)).status, 403);
    });

    assert.equal(consultas.length, 0);
});

test('financeiro devolve os 12 meses do ano, com totais e ticket médio', async (t) => {
    const consultas = simularBanco(t, db, [
        [/FROM pagamentos pg\s+WHERE pg\.status IN/, [
            { mes: 3, gmv: '200.00', gmv_produtos: '150.00', gmv_servicos: '50.00', receita_comissoes: '17.00', vendas: 3, estornos: '0.00', vendas_estornadas: 0 },
            { mes: 11, gmv: '100.50', gmv_produtos: '100.50', gmv_servicos: '0.00', receita_comissoes: '8.04', vendas: 1, estornos: '40.00', vendas_estornadas: 1 }
        ]]
    ]);

    await comServidor('/admin', adminRoutes, async (base) => {
        const r = await pedir(base, 'GET', `/admin/financeiro?ano=${ANO_ATUAL}`, USUARIOS.admin);
        assert.equal(r.status, 200);
        assert.equal(r.body.meses.length, 12);
        assert.deepEqual(r.body.meses[0], {
            mes: 1, gmv: 0, gmv_produtos: 0, gmv_servicos: 0, receita_comissoes: 0,
            vendas: 0, estornos: 0, vendas_estornadas: 0, ticket_medio: 0
        });
        assert.equal(r.body.meses[2].ticket_medio, 66.67);
        assert.deepEqual(r.body.total, {
            gmv: 300.5, gmv_produtos: 250.5, gmv_servicos: 50, receita_comissoes: 25.04,
            vendas: 4, estornos: 40, vendas_estornadas: 1, ticket_medio: 75.13
        });

        for (const ano of ['2024', String(ANO_ATUAL + 1), 'abc']) {
            assert.equal((await pedir(base, 'GET', `/admin/financeiro?ano=${ano}`, USUARIOS.admin)).status, 400);
        }
    });

    assert.equal(consultas.length, 1);
    assert.deepEqual(consultas[0].values, [`${ANO_ATUAL}-01-01 00:00:00`, `${ANO_ATUAL + 1}-01-01 00:00:00`]);
});

const regrasRankings = [
    [/FROM buscas_realizadas[\s\S]*total_resultados = 0/, [{ termo: 'ração de coelho', total: 2 }]],
    [/FROM buscas_realizadas/, [{ termo: 'banho', total: 9 }]],
    [/itenspedido ip/, [{ id: 1, nome: 'Ração 10kg', loja: 'Pet A', quantidade: '7', valor: '700.00' }]],
    [/servicos s ON s\.id = ag\.servico_id/, [{ id: 3, nome: 'Banho', loja: 'Pet A', quantidade: 4, valor: '160.00' }]],
    [/COALESCE\(pe\.loja_id, ag\.loja_id\)/, [{ id: 2, nome: 'Pet A', vendas: 11, valor: '860.00', comissao: '72.00' }]],
    [/FROM favoritos f/, [
        { tipo: 'loja', id: 2, nome: 'Pet A', total: 5 },
        { tipo: 'produto', id: 1, nome: 'Ração 10kg', total: 3 }
    ]]
];

test('rankings do mês: mais vendidos, favoritados e buscas', async (t) => {
    const consultas = simularBanco(t, db, regrasRankings);

    await comServidor('/admin', adminRoutes, async (base) => {
        const r = await pedir(base, 'GET', `/admin/rankings?ano=${ANO_ATUAL}&mes=12`, USUARIOS.admin);
        assert.equal(r.status, 200);
        assert.deepEqual(r.body.periodo, { ano: ANO_ATUAL, mes: 12 });
        assert.deepEqual(r.body.mais_vendidos.produtos[0], { id: 1, nome: 'Ração 10kg', loja: 'Pet A', quantidade: 7, valor: 700 });
        assert.equal(r.body.mais_vendidos.lojas[0].comissao, 72);
        assert.deepEqual(r.body.mais_favoritados, {
            produtos: [{ id: 1, nome: 'Ração 10kg', total: 3 }],
            servicos: [],
            lojas: [{ id: 2, nome: 'Pet A', total: 5 }]
        });
        assert.deepEqual(r.body.buscas, {
            mais_buscadas: [{ termo: 'banho', total: 9 }],
            sem_resultado: [{ termo: 'ração de coelho', total: 2 }]
        });

        for (const mes of ['0', '13', '1.5', '']) {
            assert.equal((await pedir(base, 'GET', `/admin/rankings?ano=${ANO_ATUAL}&mes=${mes}`, USUARIOS.admin)).status, 400);
        }
    });

    const comPeriodo = consultas.filter((c) => c.values?.length);
    assert.ok(comPeriodo.length >= 5);
    for (const consulta of comPeriodo) {
        assert.deepEqual(consulta.values, [`${ANO_ATUAL}-12-01 00:00:00`, `${ANO_ATUAL + 1}-01-01 00:00:00`]);
    }
});

const RESULTADOS = { produtos: [{ id: 1 }], lojas: [], servicos: [{ id: 2 }, { id: 3 }] };

test('a página de resultados registra o termo normalizado, sem usuário nem IP', async (t) => {
    t.mock.method(buscaModel, 'buscarResultados', (_termo, cb) => cb(null, RESULTADOS));
    t.mock.method(buscaModel, 'buscar', (_termo, cb) => cb(null, RESULTADOS));
    const consultas = simularBanco(t, db, [[/INSERT INTO buscas_realizadas/, { insertId: 1 }]]);

    await comServidor('/busca', buscaRoutes, async (base) => {
        assert.equal((await pedir(base, 'GET', '/busca/resultados?q=%20Ra%C3%A7%C3%A3o%20%20Premium%20', USUARIOS.cliente)).status, 200);
        assert.equal((await pedir(base, 'GET', '/busca/resultados?q=a')).status, 200);
        assert.equal((await pedir(base, 'GET', '/busca?q=racao')).status, 200);
    });

    assert.equal(consultas.length, 1, 'só a busca completa com 2+ letras é registrada');
    assert.deepEqual(consultas[0].values, ['ração premium', 3]);
    assert.match(consultas[0].sql, /\(termo, total_resultados\)/);
});

test('falha ao registrar a busca não afeta a resposta ao cliente', async (t) => {
    silenciarLogs(t);
    t.mock.method(buscaModel, 'buscarResultados', (_termo, cb) => cb(null, RESULTADOS));
    simularBanco(t, db, []);

    await comServidor('/busca', buscaRoutes, async (base) => {
        const r = await pedir(base, 'GET', '/busca/resultados?q=banho');
        assert.equal(r.status, 200);
        assert.equal(r.body.produtos.length, 1);
    });
});
