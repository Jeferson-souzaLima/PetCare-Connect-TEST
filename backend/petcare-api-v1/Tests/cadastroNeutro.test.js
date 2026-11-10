const assert = require('node:assert/strict');
const test = require('node:test');
const { mock } = require('node:test');
const { simularBanco } = require('./apoioAcesso');

const db = require('../db');
const emailService = require('../Services/emailService');
const enviados = [];
mock.method(emailService, 'enviarEmailConfirmacao', async (email) => { enviados.push({ tipo: 'confirmacao', email }); });
mock.method(emailService, 'enviarAvisoCadastroExistente', async (email) => { enviados.push({ tipo: 'aviso', email }); });

const emailConfirmationController = require('../Controllers/emailConfirmationController');
const authController = require('../Controllers/authController');

/*
 * M5: o cadastro não revela se um e-mail já tem conta. A resposta é a mesma
 * de um cadastro novo; quem fica sabendo é o dono do e-mail:
 * conta confirmada recebe um aviso; conta pendente recebe novo link.
 */
const CONTAS = {
    'ativa@exemplo.com': { id: 1, email_verificado: 1 },
    'pendente@exemplo.com': { id: 2, email_verificado: 0 }
};

function banco(t, { cnpjExiste = false } = {}) {
    return simularBanco(t, db, [
        [/SELECT id, email_verificado FROM usuarios WHERE email = \?/, (v) => (CONTAS[v[0]] ? [CONTAS[v[0]]] : [])],
        [/SELECT id FROM usuarios WHERE email = \?/, (v) => (CONTAS[v[0]] ? [{ id: CONTAS[v[0]].id }] : [])],
        [/FROM lojas WHERE REGEXP_REPLACE/, cnpjExiste ? [{ id: 9 }] : []],
        [/^\s*UPDATE usuarios/, { affectedRows: 1 }],
        [/INSERT INTO usuarios/, { insertId: 77 }],
        [/INSERT INTO lojas/, { insertId: 88 }]
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

const cliente = (email) => ({ nome: 'Fulano', email, senha: 'senha12345', confirmacaoSenha: 'senha12345', aceiteTermos: true });
const lojista = (email) => ({
    nomeFantasia: 'Pet Feliz', cnpj: '11.222.333/0001-81', email,
    senha: 'senha12345', confirmacaoSenha: 'senha12345', aceiteTermos: true
});
const inseriu = (consultas) => consultas.some((c) => /^INSERT/.test(c.sql));

for (const [nome, handler, corpo] of [
    ['cliente', emailConfirmationController.register, cliente],
    ['lojista', authController.registerLojista, lojista]
]) {
    test(`cadastro de ${nome}: e-mail com conta recebe a mesma resposta de um e-mail novo`, async (t) => {
        banco(t);
        const novo = await chamar(handler, corpo('novo@exemplo.com'));
        const existente = await chamar(handler, corpo('ativa@exemplo.com'));
        assert.equal(novo.status, 201);
        assert.deepEqual(existente, novo);
    });

    test(`cadastro de ${nome}: conta confirmada não é alterada e o dono recebe um aviso`, async (t) => {
        enviados.length = 0;
        const consultas = banco(t);
        await chamar(handler, corpo('ativa@exemplo.com'));
        assert.equal(inseriu(consultas), false);
        assert.equal(consultas.some((c) => /^UPDATE/.test(c.sql)), false);
        assert.deepEqual(enviados, [{ tipo: 'aviso', email: 'ativa@exemplo.com' }]);
    });

    test(`cadastro de ${nome}: conta pendente recebe um novo link de confirmação`, async (t) => {
        enviados.length = 0;
        const consultas = banco(t);
        await chamar(handler, corpo('pendente@exemplo.com'));
        assert.equal(inseriu(consultas), false);
        const update = consultas.find((c) => /^UPDATE usuarios/.test(c.sql));
        assert.match(update.sql, /email_verificacao_token_hash = \?/);
        assert.match(update.sql, /email_verificado = 0/, 'não mexe em conta já confirmada');
        assert.deepEqual(enviados, [{ tipo: 'confirmacao', email: 'pendente@exemplo.com' }]);
    });
}

test('cadastro de lojista: CNPJ repetido responde 409 com ou sem conta no e-mail', async (t) => {
    banco(t, { cnpjExiste: true });
    const comConta = await chamar(authController.registerLojista, lojista('ativa@exemplo.com'));
    const semConta = await chamar(authController.registerLojista, lojista('novo@exemplo.com'));
    assert.equal(comConta.status, 409);
    assert.deepEqual(comConta, semConta, 'a resposta do CNPJ não revela se o e-mail tem conta');
});

test('falha ao avisar o dono do e-mail não muda a resposta do cadastro', async (t) => {
    banco(t);
    t.mock.method(emailService, 'enviarAvisoCadastroExistente', async () => { throw new Error('SMTP fora do ar'); });
    const r = await chamar(emailConfirmationController.register, cliente('ativa@exemplo.com'));
    assert.equal(r.status, 201);
});
