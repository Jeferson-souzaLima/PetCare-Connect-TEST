const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { simularBanco } = require('./apoioAcesso');

const db = require('../db');
const { assinar } = require('../Config/jwt');
const authController = require('../Controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const authOptionalMiddleware = require('../middlewares/authOptionalMiddleware');
const { redefinirSenha } = require('../Services/recuperacaoSenhaService');

const SENHA = 'senha-certa-123';
const CONTA = {
    id: 3, nome: 'Ana', email: 'ana@exemplo.com', senha_hash: bcrypt.hashSync(SENHA, 4),
    tipo: 'cliente', email_verificado: 1, sessao_versao: 4
};
const DIA = 24 * 60 * 60;

function chamarLogin(body) {
    return new Promise((resolve) => {
        const res = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(corpo) { resolve({ status: this.statusCode, body: corpo }); return this; }
        };
        authController.login({ body }, res);
    });
}

const duracaoEmDias = (token) => {
    const { iat, exp } = jwt.decode(token);
    return (exp - iat) / DIA;
};

test('sem "manter conectado" o token vale 1 dia e não leva versão de sessão', async (t) => {
    simularBanco(t, db, [[/FROM usuarios WHERE email = \?/, [CONTA]], [/^\s*UPDATE usuarios/, { affectedRows: 1 }]]);

    const r = await chamarLogin({ email: CONTA.email, senha: SENHA });
    assert.equal(r.status, 200);
    assert.equal(duracaoEmDias(r.body.token), 1);
    assert.equal(jwt.decode(r.body.token).sv, undefined);
});

test('com "manter conectado" o token vale 30 dias e leva a versão da sessão da conta', async (t) => {
    simularBanco(t, db, [[/FROM usuarios WHERE email = \?/, [CONTA]], [/^\s*UPDATE usuarios/, { affectedRows: 1 }]]);

    const r = await chamarLogin({ email: CONTA.email, senha: SENHA, manterConectado: true });
    assert.equal(r.status, 200);
    assert.equal(duracaoEmDias(r.body.token), 30);
    assert.equal(jwt.decode(r.body.token).sv, 4);

    // Só o booleano true liga a opção.
    const texto = await chamarLogin({ email: CONTA.email, senha: SENHA, manterConectado: 'true' });
    assert.equal(duracaoEmDias(texto.body.token), 1);
});

async function pedirRotaProtegida(middleware, token) {
    const app = express();
    app.get('/protegida', middleware, (req, res) => res.json({ id: req.usuario?.id ?? null }));
    const server = app.listen(0);
    try {
        const resposta = await fetch(`http://127.0.0.1:${server.address().port}/protegida`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return { status: resposta.status, body: await resposta.json() };
    } finally {
        server.close();
    }
}

test('token de 30 dias só vale enquanto a versão da sessão da conta não mudar', async (t) => {
    let versaoNoBanco = 4;
    const consultas = simularBanco(t, db, [
        [/SELECT sessao_versao FROM usuarios WHERE id = \?/, () => [{ sessao_versao: versaoNoBanco }]]
    ]);
    const tokenLongo = assinar({ id: 3, tipo: 'cliente', sv: 4 }, { manterConectado: true });

    for (const middleware of [authMiddleware, authOptionalMiddleware]) {
        versaoNoBanco = 4;
        assert.equal((await pedirRotaProtegida(middleware, tokenLongo)).status, 200);

        versaoNoBanco = 5; // senha redefinida ou conta excluída
        const recusado = await pedirRotaProtegida(middleware, tokenLongo);
        assert.equal(recusado.status, 401);
        assert.match(recusado.body.mensagem, /sessão foi encerrada/);
    }

    assert.ok(consultas.every((c) => c.values[0] === 3));
});

test('token comum não consulta o banco', async (t) => {
    const consultas = simularBanco(t, db, []);
    const r = await pedirRotaProtegida(authMiddleware, assinar({ id: 3, tipo: 'cliente' }));
    assert.equal(r.status, 200);
    assert.equal(consultas.length, 0);
});

test('conta que não existe mais derruba o token de 30 dias', async (t) => {
    simularBanco(t, db, [[/SELECT sessao_versao FROM usuarios/, []]]);
    const r = await pedirRotaProtegida(authMiddleware, assinar({ id: 99, tipo: 'cliente', sv: 0 }, { manterConectado: true }));
    assert.equal(r.status, 401);
});

test('redefinir a senha aumenta a versão da sessão', async (t) => {
    const consultas = simularBanco(t, db, [[/UPDATE usuarios/, { affectedRows: 1 }]]);
    await redefinirSenha('a'.repeat(64), 'nova-senha-123');
    const troca = consultas.find((c) => /WHERE senha_reset_token_hash = \?/.test(c.sql));
    assert.match(troca.sql, /sessao_versao = sessao_versao \+ 1/);
});
