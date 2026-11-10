const assert = require('node:assert/strict');
const test = require('node:test');
const bcrypt = require('bcrypt');
const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

const db = require('../db');
const usuariosRoutes = require('../Routes/usuarios');

/*
 * LGPD (art. 18): o titular exporta os próprios dados e exclui a própria conta.
 * O cliente 10 tem senha "senha-certa-1"; o lojista 20 tem loja.
 */
const SENHA = 'senha-certa-1';
const HASH = bcrypt.hashSync(SENHA, 4);

function banco(t, { pedidosAbertos = 0, agendamentosAbertos = 0 } = {}) {
    return simularBanco(t, db, [
        [/SELECT id, tipo, senha_hash FROM usuarios/, (v) => [{ id: v[0], tipo: Number(v[0]) === 20 ? 'lojista' : 'cliente', senha_hash: HASH }]],
        [/SELECT id, nome, email, telefone, tipo/, (v) => [{ id: v[0], nome: 'Fulano', email: 'fulano@exemplo.com', tipo: 'cliente' }]],
        [/SELECT imagem FROM pets/, [{ imagem: '/uploads/pet-teste-inexistente.png' }, { imagem: null }]],
        [/FROM pets WHERE usuario_id/, [{ id: 1, nome: 'Rex' }]],
        [/FROM favoritos WHERE usuario_id/, [{ tipo: 'loja', referencia_id: 2 }]],
        [/COUNT\(\*\) AS total FROM pedidos/, [{ total: pedidosAbertos }]],
        [/COUNT\(\*\) AS total FROM agendamentos/, [{ total: agendamentosAbertos }]],
        [/FROM pedidos WHERE usuario_id = \? ORDER BY/, [{ id: 7, usuario_id: 10 }]],
        [/FROM itenspedido i/, [{ id: 1, pedido_id: 7 }]],
        [/FROM agendamentos a/, [{ id: 8, cliente_id: 10 }]],
        [/FROM pagamentos/, [{ id: 5, referencia_id: 7 }]],
        [/FROM lojas WHERE usuario_id/, []],
        [/^\s*(DELETE|UPDATE)/, { affectedRows: 1 }]
    ]);
}

const alteracoes = (consultas) => consultas.filter((c) => /^(DELETE|UPDATE)/.test(c.sql));

test('exportar dados exige login (401)', async (t) => {
    banco(t);
    const r = await comServidor('/usuarios', usuariosRoutes, (b) => pedir(b, 'GET', '/usuarios/me/dados', null));
    assert.equal(r.status, 401);
});

test('exportar dados devolve só os dados do próprio usuário, sem hash de senha nem token', async (t) => {
    const consultas = banco(t);
    const r = await comServidor('/usuarios', usuariosRoutes, (b) => pedir(b, 'GET', '/usuarios/me/dados', USUARIOS.cliente));
    assert.equal(r.status, 200);
    for (const chave of ['gerado_em', 'usuario', 'pets', 'favoritos', 'pedidos', 'itens_pedidos', 'agendamentos', 'pagamentos', 'lojas']) {
        assert.ok(chave in r.body, chave);
    }
    const selectUsuario = consultas.find((c) => /FROM usuarios/.test(c.sql));
    assert.doesNotMatch(selectUsuario.sql, /senha_hash|token_hash|SELECT \*/);
    for (const c of consultas) {
        assert.ok(c.values.every((v) => Number(v) === 10), `consulta filtrada pelo usuário do token: ${c.sql}`);
    }
});

test('excluir conta sem senha é recusado (400) e nada muda', async (t) => {
    const consultas = banco(t);
    const r = await comServidor('/usuarios', usuariosRoutes, (b) => pedir(b, 'DELETE', '/usuarios/me', USUARIOS.cliente, {}));
    assert.equal(r.status, 400);
    assert.equal(alteracoes(consultas).length, 0);
});

test('excluir conta com senha errada responde 403 (não 401, que encerraria a sessão no site)', async (t) => {
    const consultas = banco(t);
    const r = await comServidor('/usuarios', usuariosRoutes, (b) =>
        pedir(b, 'DELETE', '/usuarios/me', USUARIOS.cliente, { senha: 'senha-errada' }));
    assert.equal(r.status, 403);
    assert.equal(alteracoes(consultas).length, 0);
});

test('lojista não exclui a conta pelo site (409) e nada muda', async (t) => {
    const consultas = banco(t);
    const r = await comServidor('/usuarios', usuariosRoutes, (b) =>
        pedir(b, 'DELETE', '/usuarios/me', USUARIOS.lojista, { senha: SENHA }));
    assert.equal(r.status, 409);
    assert.match(r.body.mensagem, /atendimento/);
    assert.equal(alteracoes(consultas).length, 0);
});

for (const [descricao, pendencias] of [['pedido', { pedidosAbertos: 1 }], ['agendamento', { agendamentosAbertos: 2 }]]) {
    test(`excluir conta com ${descricao} em andamento é recusado (409) e a transação é desfeita`, async (t) => {
        const consultas = banco(t, pendencias);
        const r = await comServidor('/usuarios', usuariosRoutes, (b) =>
            pedir(b, 'DELETE', '/usuarios/me', USUARIOS.cliente, { senha: SENHA }));
        assert.equal(r.status, 409);
        assert.match(r.body.mensagem, /em andamento/);
        assert.equal(alteracoes(consultas).length, 0);
        assert.ok(consultas.some((c) => c.sql === 'ROLLBACK'));
    });
}

test('excluir conta anonimiza o usuário e remove pets e favoritos numa transação', async (t) => {
    const consultas = banco(t);
    const r = await comServidor('/usuarios', usuariosRoutes, (b) =>
        pedir(b, 'DELETE', '/usuarios/me', USUARIOS.cliente, { senha: SENHA }));
    assert.equal(r.status, 200);

    const sqls = consultas.map((c) => c.sql);
    const pos = (re) => sqls.findIndex((s) => re.test(s));
    assert.ok(pos(/^BEGIN$/) < pos(/^DELETE FROM favoritos/));
    assert.ok(pos(/^UPDATE usuarios/) < pos(/^COMMIT$/));
    for (const re of [/^DELETE FROM favoritos/, /^DELETE FROM pets/, /^UPDATE pedidos SET nome_contato = NULL/, /^UPDATE agendamentos SET pet_nome/, /^UPDATE usuarios SET nome = 'Conta excluída'/]) {
        assert.ok(pos(re) >= 0, `executa ${re}`);
    }

    for (const c of alteracoes(consultas)) {
        assert.equal(Number(c.values.at(-1)), 10, `só altera registros do próprio usuário: ${c.sql}`);
    }

    const update = consultas.find((c) => /^UPDATE usuarios/.test(c.sql));
    assert.match(update.sql, /email = CONCAT\('excluido-', id/);
    assert.match(update.sql, /telefone = NULL/);
    assert.match(update.sql, /latitude = NULL, longitude = NULL/);
    const novoHash = update.values[0];
    assert.equal(await bcrypt.compare(SENHA, novoHash), false, 'a senha antiga deixa de entrar');
});
