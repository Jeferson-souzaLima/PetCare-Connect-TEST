const assert = require('node:assert/strict');
const test = require('node:test');
const { mock } = require('node:test');
const { simularBanco } = require('./apoioAcesso');

const db = require('../db');
// O controller importa a função por desestruturação: o stub precisa existir antes do require.
const emailService = require('../Services/emailService');
mock.method(emailService, 'enviarEmailConfirmacao', async () => {});

const emailConfirmationController = require('../Controllers/emailConfirmationController');
const authController = require('../Controllers/authController');
const { VERSAO_TERMOS, VERSAO_PRIVACIDADE } = require('../Config/documentosLegais');

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

function banco(t) {
    return simularBanco(t, db, [
        [/SELECT .* FROM usuarios WHERE email = \?/, []],
        [/FROM lojas WHERE REGEXP_REPLACE/, []],
        [/INSERT INTO usuarios/, { insertId: 77 }],
        [/INSERT INTO lojas/, { insertId: 88 }]
    ]);
}

const cliente = { nome: 'Fulano', email: 'fulano@exemplo.com', senha: 'senha12345', confirmacaoSenha: 'senha12345' };
const lojista = { nomeFantasia: 'Pet Feliz', cnpj: '11.222.333/0001-81', email: 'loja@exemplo.com', senha: 'senha12345', confirmacaoSenha: 'senha12345' };

for (const [nome, handler, corpo] of [
    ['cadastro de cliente', emailConfirmationController.register, cliente],
    ['cadastro de lojista', authController.registerLojista, lojista]
]) {
    for (const [descricao, aceite] of [['sem o aceite', undefined], ['com aceite false', false], ['com aceite em texto', 'true']]) {
        test(`${nome} ${descricao} é recusado (400) e nada é gravado`, async (t) => {
            const consultas = banco(t);
            const r = await chamar(handler, { ...corpo, aceiteTermos: aceite });
            assert.equal(r.status, 400);
            assert.match(r.body.mensagem, /Termos de Uso/);
            assert.equal(consultas.some((c) => /^INSERT/.test(c.sql)), false);
        });
    }

    test(`${nome} com aceite grava data e versões dos documentos`, async (t) => {
        const consultas = banco(t);
        const r = await chamar(handler, { ...corpo, aceiteTermos: true });
        assert.equal(r.status, 201);
        const insert = consultas.find((c) => /^INSERT INTO usuarios/.test(c.sql));
        assert.match(insert.sql, /termos_aceitos_em/);
        assert.match(insert.sql, /termos_versao/);
        assert.match(insert.sql, /privacidade_versao/);
        assert.match(insert.sql, /NOW\(\)/, 'a data do aceite vem do servidor, não do cliente');
        assert.ok(insert.values.includes(VERSAO_TERMOS));
        assert.ok(insert.values.includes(VERSAO_PRIVACIDADE));
    });

    test(`${nome}: versão e data enviadas pelo cliente são ignoradas`, async (t) => {
        const consultas = banco(t);
        await chamar(handler, { ...corpo, aceiteTermos: true, termos_versao: 'falsa', termos_aceitos_em: '2000-01-01' });
        const insert = consultas.find((c) => /^INSERT INTO usuarios/.test(c.sql));
        assert.equal(insert.values.includes('falsa'), false);
        assert.equal(insert.values.includes('2000-01-01'), false);
    });
}
