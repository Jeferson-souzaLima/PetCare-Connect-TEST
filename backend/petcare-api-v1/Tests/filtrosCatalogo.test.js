const assert = require('node:assert/strict');
const test = require('node:test');
const { comServidor, pedir, simularBanco } = require('./apoioAcesso');

const db = require('../db');
const produtosRoutes = require('../Routes/produtos');
const lojasRoutes = require('../Routes/lojas');
const servicosRoutes = require('../Routes/servicos');

/*
 * Filtros das páginas Lojas, Produtos e Serviços aplicados no banco (com paginação certa),
 * sem colunas novas: produtos por preço, lojas que entregam e serviços por tipo (pelo nome).
 */
const selects = (consultas) => consultas.filter((c) => /SELECT/.test(c.sql) && !/COUNT/.test(c.sql));
const contagens = (consultas) => consultas.filter((c) => /COUNT/.test(c.sql));

function bancoVazio(t) {
    return simularBanco(t, db, [[/COUNT/, [{ total: 0 }]], [/SELECT/, []]]);
}

test('GET /produtos?ordem=preco_asc ordena por preço no banco, menor primeiro', async (t) => {
    const consultas = bancoVazio(t);
    const r = await comServidor('/produtos', produtosRoutes, (b) => pedir(b, 'GET', '/produtos?ordem=preco_asc&page=2'));
    assert.equal(r.status, 200);
    assert.match(selects(consultas)[0].sql, /ORDER BY\s+preco ASC/);
});

test('GET /produtos?ordem=preco_desc ordena do maior para o menor', async (t) => {
    const consultas = bancoVazio(t);
    await comServidor('/produtos', produtosRoutes, (b) => pedir(b, 'GET', '/produtos?ordem=preco_desc'));
    assert.match(selects(consultas)[0].sql, /ORDER BY\s+preco DESC/);
});

test('GET /produtos?q= busca pelo nome no banco, com o texto como parâmetro (sem SQL injection)', async (t) => {
    const consultas = bancoVazio(t);
    await comServidor('/produtos', produtosRoutes, (b) => pedir(b, 'GET', `/produtos?q=${encodeURIComponent("raç%o' OR 1=1")}`));
    const [contagem] = contagens(consultas);
    assert.match(contagem.sql, /p\.nome LIKE \?/);
    assert.ok(contagem.values.includes("%raç\\%o' OR 1=1%"));
    assert.doesNotMatch(contagem.sql, /OR 1=1/);
    assert.match(selects(consultas)[0].sql, /p\.nome LIKE \?/);
});

test('GET /lojas?entrega=1 lista só lojas com entrega ativa', async (t) => {
    const consultas = bancoVazio(t);
    const r = await comServidor('/lojas', lojasRoutes, (b) => pedir(b, 'GET', '/lojas?entrega=1'));
    assert.equal(r.status, 200);
    assert.match(contagens(consultas)[0].sql, /entrega_ativa = 1/);
    assert.match(selects(consultas)[0].sql, /entrega_ativa = 1/);
});

test('GET /servicos?tipo=banho_tosa filtra pelo nome do serviço (banho, tosa)', async (t) => {
    const consultas = bancoVazio(t);
    const r = await comServidor('/servicos', servicosRoutes, (b) => pedir(b, 'GET', '/servicos?tipo=banho_tosa'));
    assert.equal(r.status, 200);
    const sql = selects(consultas)[0];
    assert.match(sql.sql, /s\.nome LIKE \?/);
    assert.ok(sql.values.includes('%banho%') && sql.values.includes('%tosa%'));
    assert.match(contagens(consultas)[0].sql, /s\.nome LIKE \?/);
});

test('GET /servicos?tipo=outros exclui banho, tosa e saúde', async (t) => {
    const consultas = bancoVazio(t);
    await comServidor('/servicos', servicosRoutes, (b) => pedir(b, 'GET', '/servicos?tipo=outros'));
    assert.match(selects(consultas)[0].sql, /NOT \(/);
});

test('sem filtros, as listas continuam como antes', async (t) => {
    const consultas = bancoVazio(t);
    await comServidor('/produtos', produtosRoutes, (b) => pedir(b, 'GET', '/produtos'));
    assert.match(selects(consultas)[0].sql, /ordem_na_loja ASC/);
    assert.doesNotMatch(selects(consultas)[0].sql, /LIKE/);
});

test('valores inválidos de filtro respondem 400 sem consultar o banco', async (t) => {
    const consultas = bancoVazio(t);
    const casos = [
        ['/produtos', produtosRoutes, '/produtos?ordem=nome'],
        ['/produtos', produtosRoutes, `/produtos?q=${'a'.repeat(81)}`],
        ['/lojas', lojasRoutes, '/lojas?entrega=talvez'],
        ['/servicos', servicosRoutes, '/servicos?tipo=hospedagem'],
        ['/servicos', servicosRoutes, '/servicos?q=a&q=b']
    ];
    for (const [base, rotas, caminho] of casos) {
        const r = await comServidor(base, rotas, (b) => pedir(b, 'GET', caminho));
        assert.equal(r.status, 400, caminho);
    }
    assert.equal(consultas.length, 0);
});
