const assert = require('node:assert/strict');
const test = require('node:test');
const { comServidor, pedir, simularBanco } = require('./apoioAcesso');

const db = require('../db');
const lojasRoutes = require('../Routes/lojas');

// M9: as rotas públicas de loja não podem usar SELECT * nem pedir colunas internas.
const CAMPOS_PRIVADOS = ['usuario_id', 'cnpj', 'razao_social', 'telefone', 'latitude', 'longitude', 'ativo'];

function selectDeLojas(consultas) {
    return consultas.find((c) => /^SELECT .* FROM lojas WHERE (id = \?|ativo = 1)/.test(c.sql) && !/COUNT/.test(c.sql));
}

function assertSoCamposPublicos(sql) {
    assert.doesNotMatch(sql, /SELECT \*/);
    const colunas = sql.replace(/^SELECT (.*) FROM .*$/, '$1').split(',').map((c) => c.trim());
    for (const campo of CAMPOS_PRIVADOS) {
        assert.equal(colunas.includes(campo), false, `${campo} não deve ser público`);
    }
    for (const campo of ['id', 'nome_fantasia', 'imagem', 'cidade', 'uf']) {
        assert.ok(colunas.includes(campo), `${campo} é usado pelo site`);
    }
}

test('GET /lojas/:id devolve só campos públicos', async (t) => {
    const consultas = simularBanco(t, db, [
        [/FROM lojas WHERE id = \?/, [{ id: 2, nome_fantasia: 'Pet Feliz' }]]
    ]);
    const r = await comServidor('/lojas', lojasRoutes, (b) => pedir(b, 'GET', '/lojas/2'));
    assert.equal(r.status, 200);
    assert.equal(r.body.nome_fantasia, 'Pet Feliz');
    assertSoCamposPublicos(selectDeLojas(consultas).sql);
});

test('GET /lojas/:id de loja inexistente responde 404', async (t) => {
    simularBanco(t, db, [[/FROM lojas WHERE id = \?/, []]]);
    const r = await comServidor('/lojas', lojasRoutes, (b) => pedir(b, 'GET', '/lojas/999'));
    assert.equal(r.status, 404);
});

test('GET /lojas (listagem) devolve só campos públicos', async (t) => {
    const consultas = simularBanco(t, db, [
        [/COUNT\(\*\)/, [{ total: 1 }]],
        [/FROM lojas\s+WHERE ativo = 1/, [{ id: 2, nome_fantasia: 'Pet Feliz' }]]
    ]);
    const r = await comServidor('/lojas', lojasRoutes, (b) => pedir(b, 'GET', '/lojas?page=1&limit=20'));
    assert.equal(r.status, 200);
    assert.equal(r.body.dados.length, 1);
    assertSoCamposPublicos(selectDeLojas(consultas).sql);
});
