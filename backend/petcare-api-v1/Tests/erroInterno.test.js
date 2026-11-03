const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

// db.js exige estas variáveis ao ser carregado; nenhum teste abre conexão real.
for (const nome of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET']) {
    process.env[nome] = process.env[nome] || 'test';
}

const db = require('../db');
const authController = require('../Controllers/authController');
const agendamentosController = require('../Controllers/agendamentosController');
const agendaLojistaController = require('../Controllers/agendaLojistaController');
const AgendaDisponibilidade = require('../Models/agendaDisponibilidadeModel');

/** Erro no formato do mysql2, com SQL e dado pessoal na mensagem. */
function erroMysql() {
    const erro = new Error("Duplicate entry 'fulano@exemplo.com' for key 'email'");
    erro.code = 'ER_DUP_ENTRY';
    erro.errno = 1062;
    erro.sqlState = '23000';
    erro.sqlMessage = "Duplicate entry 'fulano@exemplo.com' for key 'email'";
    erro.sql = "SELECT * FROM usuarios WHERE email = 'fulano@exemplo.com'";
    return erro;
}

function chamar(handler, req) {
    return new Promise((resolve) => {
        const res = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(body) { resolve({ status: this.statusCode, body }); return this; },
            send(body) { resolve({ status: this.statusCode, body }); return this; }
        };
        handler(req, res);
    });
}

function assertSemVazamento(t, resposta, logs) {
    const corpo = JSON.stringify(resposta.body);
    assert.equal(resposta.status, 500);
    for (const proibido of ['SELECT', 'fulano@exemplo.com', 'sqlMessage', 'ER_DUP_ENTRY', 'stack', 'at ']) {
        assert.equal(corpo.includes(proibido), false, `resposta contém "${proibido}": ${corpo}`);
    }
    assert.equal(typeof resposta.body.mensagem, 'string');
    const textoLog = JSON.stringify(logs);
    assert.equal(textoLog.includes('SELECT'), false, 'log contém SQL');
    assert.equal(textoLog.includes('fulano@exemplo.com'), false, 'log contém dado pessoal');
    assert.equal(textoLog.includes('ER_DUP_ENTRY'), true, 'log deve manter o código do erro');
}

function capturarLogs(t) {
    const logs = [];
    t.mock.method(console, 'error', (...args) => logs.push(args));
    return logs;
}

test('login: erro de banco não vaza SQL nem dados (antes: res.status(500).send(err))', async (t) => {
    const logs = capturarLogs(t);
    t.mock.method(db, 'query', (_sql, _v, cb) => cb(erroMysql()));
    const resposta = await chamar(authController.login, { body: { email: 'a@b.com', senha: 'x' } });
    assertSemVazamento(t, resposta, logs);
});

test('meus agendamentos: erro de banco não vaza (antes: json({ error: err }))', async (t) => {
    const logs = capturarLogs(t);
    t.mock.method(db, 'query', (_sql, _v, cb) => cb(erroMysql()));
    const resposta = await chamar(agendamentosController.getMeusAgendamentos, { usuario: { id: 1, tipo: 'cliente' } });
    assertSemVazamento(t, resposta, logs);
});

test('apagar disponibilidade: erro de banco não vaza (antes: error + code)', async (t) => {
    const logs = capturarLogs(t);
    t.mock.method(AgendaDisponibilidade, 'deleteByLoja', (_id, cb) => cb(erroMysql()));
    const resposta = await chamar(agendaLojistaController.deleteDisponibilidadeByLoja, { usuario: { loja_id: 1 } });
    assertSemVazamento(t, resposta, logs);
});

test('nenhum controller/rota devolve o objeto ou a mensagem de erro em respostas de erro', () => {
    const raiz = path.join(__dirname, '..');
    const pastas = ['Controllers', 'Routes', 'middlewares', 'Services'];
    // Qualquer identificador que contenha err/erro/error (err, selectErr, hashErr, erro...).
    const idErro = String.raw`\w*(?:[Ee]rr|[Ee]rro|[Ee]rror)\w*`;
    const padroes = [
        new RegExp(String.raw`\.(?:send|json)\(\s*` + idErro + String.raw`\s*\)`),
        new RegExp(String.raw`\b(?:error|erro|err|code|stack)\s*:\s*` + idErro + String.raw`(?:\.\w+)?\s*(?:[,}]|$)`)
    ];
    const ocorrencias = [];
    for (const pasta of pastas) {
        for (const arquivo of fs.readdirSync(path.join(raiz, pasta))) {
            if (!arquivo.endsWith('.js')) continue;
            const conteudo = fs.readFileSync(path.join(raiz, pasta, arquivo), 'utf8');
            // Mensagem do erro devolvida ao cliente, mesmo quebrada em várias linhas.
            for (const m of conteudo.matchAll(/(?:mensagem|message)\s*:\s*\w*(?:[Ee]rr|[Ee]rro|[Ee]rror)\w*\.message\b/g)) {
                const linha = conteudo.slice(0, m.index).split('\n').length;
                ocorrencias.push(`${pasta}/${arquivo}:${linha}: ${m[0].replace(/\s+/g, ' ')}`);
            }
            conteudo.split('\n').forEach((linha, i) => {
                const codigo = linha.trim();
                if (codigo.startsWith('//') || codigo.startsWith('*') || /console\.(error|warn|log)/.test(codigo)) return;
                if (padroes.some((p) => p.test(codigo))) ocorrencias.push(`${pasta}/${arquivo}:${i + 1}: ${codigo}`);
            });
        }
    }
    assert.deepEqual(ocorrencias, []);
});

const { responderErroDoServico } = require('../utils/erroInterno');

test('erro de negócio (4xx) do checkout/frete mantém a mensagem para o usuário', async (t) => {
    capturarLogs(t);
    const erro = new Error('Loja indisponível.');
    erro.status = 404;
    const resposta = await chamar((_req, res) => responderErroDoServico(res, erro, 'teste', 'Padrão.'), {});
    assert.deepEqual(resposta, { status: 404, body: { mensagem: 'Loja indisponível.' } });
});

test('erro interno do checkout/frete vira 500 com mensagem padrão, sem detalhes', async (t) => {
    const logs = capturarLogs(t);
    const resposta = await chamar((_req, res) => responderErroDoServico(res, erroMysql(), 'teste', 'Não foi possível iniciar o checkout.'), {});
    assert.deepEqual(resposta, { status: 500, body: { mensagem: 'Não foi possível iniciar o checkout.' } });
    assert.equal(JSON.stringify(logs).includes('fulano@exemplo.com'), false);
});

test('cadastro (POST /auth/register): erro de banco não vaza (antes: send(selectErr))', async (t) => {
    const logs = capturarLogs(t);
    const emailConfirmationController = require('../Controllers/emailConfirmationController');
    t.mock.method(db, 'query', (_sql, _v, cb) => cb(erroMysql()));
    const resposta = await chamar(emailConfirmationController.register, {
        body: { nome: 'Fulano', email: 'fulano@exemplo.com', senha: 'senha12345', confirmarSenha: 'senha12345', confirmacaoSenha: 'senha12345', aceiteTermos: true }
    });
    assertSemVazamento(t, resposta, logs);
});
