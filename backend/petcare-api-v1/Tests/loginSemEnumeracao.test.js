const assert = require('node:assert/strict');
const test = require('node:test');
const { mock } = require('node:test');
const bcrypt = require('bcrypt');
const { simularBanco } = require('./apoioAcesso');

const db = require('../db');
const emailService = require('../Services/emailService');
mock.method(emailService, 'enviarEmailConfirmacao', async () => {});

const authController = require('../Controllers/authController');
const emailConfirmationController = require('../Controllers/emailConfirmationController');

/*
 * M5: login e reenvio de confirmação não podem revelar se um e-mail tem conta
 * (nem se ela está pendente) para quem não sabe a senha.
 */
const SENHA = 'senha-certa-123';
const HASH = bcrypt.hashSync(SENHA, 4);
const CONTAS = {
    'pendente@exemplo.com': { id: 1, nome: 'P', email: 'pendente@exemplo.com', senha_hash: HASH, tipo: 'cliente', email_verificado: 0 },
    'lojapendente@exemplo.com': { id: 2, nome: 'L', email: 'lojapendente@exemplo.com', senha_hash: HASH, tipo: 'lojista', email_verificado: 0 },
    'ativo@exemplo.com': { id: 3, nome: 'A', email: 'ativo@exemplo.com', senha_hash: HASH, tipo: 'cliente', email_verificado: 1 }
};

function banco(t) {
    return simularBanco(t, db, [
        [/FROM usuarios WHERE email = \?/, (v) => (CONTAS[v[0]] ? [CONTAS[v[0]]] : [])],
        [/^\s*UPDATE usuarios/, { affectedRows: 1 }]
    ]);
}

function chamar(handler, body) {
    return new Promise((resolve) => {
        const res = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(corpo) { resolve({ status: this.statusCode, body: corpo }); return this; }
        };
        handler({ body }, res);
    });
}

const login = (email, senha) => chamar(authController.login, { email, senha });

test('senha errada recebe a mesma resposta para conta inexistente, pendente ou ativa', async (t) => {
    banco(t);
    const respostas = await Promise.all([
        login('ninguem@exemplo.com', 'qualquer-senha'),
        login('pendente@exemplo.com', 'qualquer-senha'),
        login('ativo@exemplo.com', 'qualquer-senha')
    ]);
    for (const r of respostas) {
        assert.equal(r.status, 401);
        assert.equal(r.body.mensagem, 'Email ou senha inválidos.');
        assert.equal(r.body.codigo, undefined);
    }
});

test('só com a senha certa a conta pendente é avisada de que falta confirmar o e-mail', async (t) => {
    banco(t);
    for (const email of ['pendente@exemplo.com', 'lojapendente@exemplo.com']) {
        const r = await login(email, SENHA);
        assert.equal(r.status, 403, email);
        assert.equal(r.body.codigo, 'EMAIL_NAO_VERIFICADO');
        assert.equal(r.body.token, undefined);
    }
});

test('conta confirmada entra normalmente, com e-mail em maiúsculas e espaços', async (t) => {
    banco(t);
    const r = await login('  Ativo@Exemplo.com ', SENHA);
    assert.equal(r.status, 200);
    assert.ok(r.body.token);
});

test('reenvio de confirmação responde igual para conta inexistente, pendente e já confirmada', async (t) => {
    banco(t);
    const respostas = await Promise.all(
        ['ninguem@exemplo.com', 'pendente@exemplo.com', 'ativo@exemplo.com']
            .map((email) => chamar(emailConfirmationController.reenviarConfirmacao, { email }))
    );
    const [primeira, ...demais] = respostas;
    assert.equal(primeira.status, 200);
    for (const r of demais) assert.deepEqual(r, primeira);
});
