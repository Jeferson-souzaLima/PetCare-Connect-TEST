const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');

const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

const db = require('../db');
const adminRoutes = require('../Routes/admin');
const authMiddleware = require('../middlewares/authMiddleware');
const { permitidoNoGerenciamento } = require('../middlewares/sessaoToken');

/*
 * O admin gerencia uma loja com o acesso do lojista dela (token com admin_id),
 * mas sem chegar à conta Mercado Pago, aos pagamentos e à conta pessoal do lojista.
 */
const GERENCIANDO = { id: 20, tipo: 'lojista', loja_id: 9, admin_id: 1 };

const DONO = [{ loja_id: 9, nome_fantasia: 'Pet Shop Central', usuario_id: 20, nome: 'Dono', email: 'dono@loja.test' }];

test('só o admin inicia o gerenciamento; o token sai como lojista daquela loja, marcado com o admin', async (t) => {
    simularBanco(t, db, [[/FROM lojas l INNER JOIN usuarios u ON u.id = l.usuario_id\s+WHERE l.id = \?/, (v) => (Number(v[0]) === 9 ? DONO : [])]]);
    t.mock.method(console, 'log', () => {});

    await comServidor('/admin', adminRoutes, async (base) => {
        assert.equal((await pedir(base, 'POST', '/admin/lojas/9/gerenciar', USUARIOS.lojista)).status, 403);
        assert.equal((await pedir(base, 'POST', '/admin/lojas/9/gerenciar', GERENCIANDO)).status, 403, 'gerenciando não abre outra loja');
        assert.equal((await pedir(base, 'POST', '/admin/lojas/999/gerenciar', USUARIOS.admin)).status, 404);

        const r = await pedir(base, 'POST', '/admin/lojas/9/gerenciar', USUARIOS.admin);
        assert.equal(r.status, 200);
        const conteudo = jwt.decode(r.body.token);
        assert.deepEqual([conteudo.id, conteudo.tipo, conteudo.loja_id, conteudo.admin_id], [20, 'lojista', 9, 1]);
        assert.ok(conteudo.exp - conteudo.iat <= 2 * 60 * 60, 'acesso de no máximo 2 horas');
        assert.equal(r.body.usuario.gerenciado_por_admin, true);
    });
});

test('áreas liberadas e bloqueadas no gerenciamento', () => {
    const pode = (method, originalUrl) => permitidoNoGerenciamento({ method, originalUrl });

    for (const [metodo, url] of [['GET', '/lojas/minha'], ['PUT', '/lojas/minha'], ['POST', '/produtos'], ['DELETE', '/produtos/3'],
        ['PUT', '/servicos/2'], ['GET', '/pedidos/loja'], ['POST', '/agendamentos/manual'], ['POST', '/agenda-lojista/config'],
        ['GET', '/relatorios/painel?ano=2026']]) {
        assert.equal(pode(metodo, url), true, `${metodo} ${url}`);
    }
    for (const [metodo, url] of [['GET', '/mercadopago/conta'], ['POST', '/mercadopago/conta/conectar'], ['GET', '/pagamentos/1'],
        ['GET', '/usuarios/me'], ['DELETE', '/usuarios/me'], ['GET', '/admin/lojas'], ['DELETE', '/lojas/9'], ['GET', '/lojasfalsas'],
        ['GET', '/pets']]) {
        assert.equal(pode(metodo, url), false, `${metodo} ${url}`);
    }
});

test('token de gerenciamento é recusado (403) fora das áreas da loja, antes da rota rodar', async () => {
    const app = express();
    const rodou = [];
    app.get('/mercadopago/conta', authMiddleware, (req, res) => { rodou.push('mp'); res.json({}); });
    app.get('/produtos/meus', authMiddleware, (req, res) => { rodou.push('produtos'); res.json({}); });

    const server = app.listen(0);
    try {
        const base = `http://127.0.0.1:${server.address().port}`;
        assert.equal((await pedir(base, 'GET', '/mercadopago/conta', GERENCIANDO)).status, 403);
        assert.equal((await pedir(base, 'GET', '/produtos/meus', GERENCIANDO)).status, 200);
        assert.equal((await pedir(base, 'GET', '/mercadopago/conta', USUARIOS.lojista)).status, 200, 'o próprio lojista continua acessando');
    } finally {
        server.close();
    }
    assert.deepEqual(rodou, ['produtos', 'mp']);
});
