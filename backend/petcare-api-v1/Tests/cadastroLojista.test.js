const assert = require('node:assert/strict');
const test = require('node:test');
const { mock } = require('node:test');
const { simularBanco } = require('./apoioAcesso');

const db = require('../db');
// O controller importa a função por desestruturação: o stub precisa existir antes do require.
const emailService = require('../Services/emailService');
const enviados = [];
let falharEnvio = false;
mock.method(emailService, 'enviarAvisoCadastroExistente', async () => {});
mock.method(emailService, 'enviarEmailConfirmacao', async (email, token) => {
    if (falharEnvio) throw new Error('SMTP fora do ar');
    enviados.push({ email, token });
});

const authController = require('../Controllers/authController');
const { cnpjValido } = require('../utils/validacaoLoja');

function chamar(body) {
    return new Promise((resolve) => {
        const res = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(corpo) { resolve({ status: this.statusCode, body: corpo }); return this; }
        };
        authController.registerLojista({ body }, res);
    });
}

const VALIDO = {
    nomeFantasia: 'Pet Feliz',
    cnpj: '11.222.333/0001-81',
    email: ' Loja@Exemplo.com ',
    senha: 'senha12345',
    confirmacaoSenha: 'senha12345',
    aceiteTermos: true
};

function banco(t, { emailExiste = false, cnpjExiste = false } = {}) {
    return simularBanco(t, db, [
        [/SELECT id FROM usuarios WHERE email = \?/, emailExiste ? [{ id: 1 }] : []],
        [/SELECT id, email_verificado FROM usuarios/, emailExiste ? [{ id: 1, email_verificado: 1 }] : []],
        [/FROM lojas WHERE REGEXP_REPLACE/, cnpjExiste ? [{ id: 9 }] : []],
        [/INSERT INTO usuarios/, { insertId: 77 }],
        [/INSERT INTO lojas/, { insertId: 88 }]
    ]);
}

// Falha no INSERT da loja, depois de o usuário já ter sido inserido na transação.
function bancoComFalhaNaLoja(t) {
    const consultas = banco(t);
    const original = db.query;
    t.mock.method(db, 'query', (sql, values, cb) => {
        if (/INSERT INTO lojas/.test(sql)) {
            consultas.push({ sql: 'INSERT INTO lojas', values });
            return cb(Object.assign(new Error('falha'), { code: 'ER_X', sqlState: 'HY000' }));
        }
        return original(sql, values, cb);
    });
    return consultas;
}

const sqls = (consultas) => consultas.map((c) => c.sql.split(' ').slice(0, 3).join(' '));
const inseriu = (consultas) => consultas.some((c) => /^INSERT/.test(c.sql));

test('CNPJ: valida dígitos verificadores, com ou sem máscara', () => {
    assert.equal(cnpjValido('11.222.333/0001-81'), true);
    assert.equal(cnpjValido('11222333000181'), true);
    assert.equal(cnpjValido('11222333000182'), false);
    assert.equal(cnpjValido('00000000000000'), false);
    assert.equal(cnpjValido('123'), false);
});

for (const [descricao, alteracao, mensagem] of [
    ['CNPJ com dígito verificador errado', { cnpj: '12.345.678/0001-99' }, /CNPJ válido/],
    ['sem CNPJ', { cnpj: '' }, /CNPJ/],
    ['e-mail inválido', { email: 'nao-e-email' }, /e-mail válido/],
    ['senha com menos de 8 caracteres', { senha: '1234567', confirmacaoSenha: '1234567' }, /8 caracteres/],
    ['confirmação de senha diferente', { confirmacaoSenha: 'outra-senha' }, /confirmação de senha/],
    ['UF inválida', { uf: 'S1' }, /UF válida/],
    ['senha que não é texto', { senha: ['senha12345'], confirmacaoSenha: ['senha12345'] }, /8 caracteres/]
]) {
    test(`cadastro de lojista com ${descricao} é recusado (400) sem gravar`, async (t) => {
        const consultas = banco(t);
        const r = await chamar({ ...VALIDO, ...alteracao });
        assert.equal(r.status, 400);
        assert.match(r.body.mensagem, mensagem);
        assert.equal(inseriu(consultas), false);
    });
}

test('e-mail já cadastrado: mesma resposta de cadastro novo, sem gravar nada (M5)', async (t) => {
    const consultas = banco(t, { emailExiste: true });
    const r = await chamar(VALIDO);
    assert.equal(r.status, 201);
    assert.match(r.body.mensagem, /Verifique seu e-mail/);
    assert.equal(inseriu(consultas), false);
});

test('CNPJ já usado por outra loja: 409, nada gravado', async (t) => {
    const consultas = banco(t, { cnpjExiste: true });
    const r = await chamar(VALIDO);
    assert.equal(r.status, 409);
    assert.match(r.body.mensagem, /CNPJ/);
    assert.equal(inseriu(consultas), false);
    const busca = consultas.find((c) => /REGEXP_REPLACE/.test(c.sql));
    assert.deepEqual(busca.values, ['11222333000181'], 'compara só os dígitos do CNPJ');
});

test('falha ao criar a loja desfaz o usuário (sem usuário órfão) e responde 500 genérico', async (t) => {
    const consultas = bancoComFalhaNaLoja(t);
    const r = await chamar(VALIDO);
    assert.equal(r.status, 500);
    assert.doesNotMatch(JSON.stringify(r.body), /falha|ER_X/);
    const ordem = sqls(consultas);
    assert.ok(ordem.includes('ROLLBACK'));
    assert.equal(ordem.includes('COMMIT'), false);
});

test('cadastro válido: usuário e loja na mesma transação, e-mail pendente de confirmação, sem token', async (t) => {
    enviados.length = 0;
    const consultas = banco(t);
    const r = await chamar(VALIDO);
    assert.equal(r.status, 201);
    assert.match(r.body.mensagem, /Verifique seu e-mail/);
    assert.equal(r.body.token, undefined, 'não entra logado antes de confirmar o e-mail');

    const ordem = consultas.map((c) => c.sql);
    const posicao = (re) => ordem.findIndex((sql) => re.test(sql));
    assert.ok(posicao(/^BEGIN$/) < posicao(/^INSERT INTO usuarios/));
    assert.ok(posicao(/^INSERT INTO usuarios/) < posicao(/^INSERT INTO lojas/));
    assert.ok(posicao(/^INSERT INTO lojas/) < posicao(/^COMMIT$/));

    const insertUsuario = consultas.find((c) => /^INSERT INTO usuarios/.test(c.sql));
    assert.match(insertUsuario.sql, /'lojista', 0,/, 'lojista nasce com e-mail não verificado');
    assert.equal(insertUsuario.values[1], 'loja@exemplo.com', 'e-mail normalizado');
    assert.notEqual(insertUsuario.values[2], VALIDO.senha, 'grava o hash, não a senha');

    assert.equal(enviados.length, 1);
    assert.equal(enviados[0].email, 'loja@exemplo.com');
    assert.ok(insertUsuario.values.includes(require('../utils/tokenConfirmacaoEmail').hashTokenConfirmacao(enviados[0].token)),
        'o banco guarda só o hash do token enviado');
});

test('cadastro válido com falha no envio do e-mail responde 503 orientando a pedir novo link', async (t) => {
    falharEnvio = true;
    try {
        banco(t);
        const r = await chamar(VALIDO);
        assert.equal(r.status, 503);
        assert.match(r.body.mensagem, /novo link/);
    } finally {
        falharEnvio = false;
    }
});
