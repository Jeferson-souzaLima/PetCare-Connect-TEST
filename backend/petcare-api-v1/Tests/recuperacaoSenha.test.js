const assert = require('node:assert/strict');
const test = require('node:test');
const bcrypt = require('bcrypt');

const { comServidor, pedir, simularBanco } = require('./apoioAcesso');

const db = require('../db');
const emailService = require('../Services/emailService');
const RecuperacaoSenhaService = require('../Services/recuperacaoSenhaService');
const { hashTokenConfirmacao } = require('../utils/tokenConfirmacaoEmail');
const authRoutes = require('../Routes/auth');

const MENSAGEM = /Se houver uma conta com este e-mail/;
const esperarSegundoPlano = () => new Promise((resolve) => setImmediate(resolve));

test('esqueci-senha responde igual com ou sem conta e só envia e-mail quando a conta existe', async (t) => {
    const consultas = simularBanco(t, db, [
        [/SELECT id FROM usuarios WHERE email = \?/, (v) => (v[0] === 'ana@exemplo.com' ? [{ id: 10 }] : [])],
        [/SET senha_reset_token_hash = \?/, { affectedRows: 1 }]
    ]);
    const enviar = t.mock.method(emailService, 'enviarEmailRedefinicaoSenha', async () => {});

    await comServidor('/auth', authRoutes, async (base) => {
        const comConta = await pedir(base, 'POST', '/auth/esqueci-senha', null, { email: ' Ana@Exemplo.com ' });
        const semConta = await pedir(base, 'POST', '/auth/esqueci-senha', null, { email: 'ninguem@exemplo.com' });
        await esperarSegundoPlano();

        assert.equal(comConta.status, 200);
        assert.deepEqual(comConta.body, semConta.body);
        assert.match(comConta.body.mensagem, MENSAGEM);
    });

    await esperarSegundoPlano();
    assert.equal(enviar.mock.callCount(), 1);
    const [email, token] = enviar.mock.calls[0].arguments;
    assert.equal(email, 'ana@exemplo.com');
    assert.match(token, /^[a-f0-9]{64}$/);

    // O banco guarda só o hash do token, nunca o token do link.
    const gravacao = consultas.find(c => /SET senha_reset_token_hash/.test(c.sql));
    assert.deepEqual(gravacao.values, [hashTokenConfirmacao(token), 10]);
});

test('esqueci-senha valida o e-mail', async (t) => {
    simularBanco(t, db, []);
    await comServidor('/auth', authRoutes, async (base) => {
        assert.equal((await pedir(base, 'POST', '/auth/esqueci-senha', null, { email: 'invalido' })).status, 400);
        assert.equal((await pedir(base, 'POST', '/auth/esqueci-senha', null, {})).status, 400);
    });
});

test('redefinir-senha troca a senha com link válido e invalida o link', async (t) => {
    const token = 'a'.repeat(64);
    const consultas = simularBanco(t, db, [
        [/WHERE senha_reset_token_hash = \?/, (v) => ({ affectedRows: v[1] === hashTokenConfirmacao(token) ? 1 : 0 })]
    ]);

    await comServidor('/auth', authRoutes, async (base) => {
        const r = await pedir(base, 'POST', '/auth/redefinir-senha', null, { token, senha: 'novaSenha123', confirmacaoSenha: 'novaSenha123' });
        assert.equal(r.status, 200);

        const outro = await pedir(base, 'POST', '/auth/redefinir-senha', null, { token: 'b'.repeat(64), senha: 'novaSenha123', confirmacaoSenha: 'novaSenha123' });
        assert.equal(outro.status, 400);
        assert.match(outro.body.mensagem, /expirado/);
    });

    const [senhaHash, tokenHash] = consultas[0].values;
    assert.equal(tokenHash, hashTokenConfirmacao(token));
    assert.ok(await bcrypt.compare('novaSenha123', senhaHash));
    assert.match(consultas[0].sql, /senha_reset_token_hash = NULL/);
    assert.match(consultas[0].sql, /senha_reset_expira_em > NOW\(\)/);
});

test('redefinir-senha valida token e senha antes de ir ao banco', async (t) => {
    const consultas = simularBanco(t, db, []);
    const token = 'a'.repeat(64);

    await comServidor('/auth', authRoutes, async (base) => {
        assert.equal((await pedir(base, 'POST', '/auth/redefinir-senha', null, { token: 'curto', senha: 'novaSenha123', confirmacaoSenha: 'novaSenha123' })).status, 400);
        assert.equal((await pedir(base, 'POST', '/auth/redefinir-senha', null, { token, senha: 'curta', confirmacaoSenha: 'curta' })).status, 400);
        assert.equal((await pedir(base, 'POST', '/auth/redefinir-senha', null, { token, senha: 'novaSenha123', confirmacaoSenha: 'outraSenha1' })).status, 400);
    });

    assert.equal(consultas.length, 0);
});

test('falha no envio do e-mail fica só no log', async (t) => {
    t.mock.method(console, 'error', () => {});
    simularBanco(t, db, [
        [/SELECT id FROM usuarios WHERE email = \?/, [{ id: 10 }]],
        [/SET senha_reset_token_hash = \?/, { affectedRows: 1 }]
    ]);
    t.mock.method(emailService, 'enviarEmailRedefinicaoSenha', async () => { throw new Error('SMTP fora'); });

    await assert.doesNotReject(RecuperacaoSenhaService.solicitarRedefinicao('ana@exemplo.com'));
});
