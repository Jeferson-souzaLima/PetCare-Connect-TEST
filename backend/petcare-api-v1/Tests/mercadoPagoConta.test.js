const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

process.env.MP_TOKEN_KEY = crypto.randomBytes(32).toString('base64');
process.env.MP_CLIENT_ID = '123456';
process.env.MP_CLIENT_SECRET = 'segredo-cliente';
process.env.MP_OAUTH_REDIRECT_URI = 'https://api.exemplo.com/mercadopago/oauth/retorno';
process.env.APP_URL = 'https://app.exemplo.com';

const { OAuth } = require('mercadopago');
const db = require('../db');
const rotas = require('../Routes/mercadoPago');
const { cifrar, decifrar } = require('../utils/criptografiaToken');
const servico = require('../Services/mercadoPagoOAuthService');
const { verificar } = require('../Config/jwt');

const silenciarLogs = (t) => {
    for (const metodo of ['log', 'warn', 'error']) t.mock.method(console, metodo, () => {});
};

const semRedirecionar = async (url) => {
    const resposta = await fetch(url, { redirect: 'manual' });
    return { status: resposta.status, location: resposta.headers.get('location') };
};

// ---------------------------------------------------------------
// Criptografia dos tokens
// ---------------------------------------------------------------

test('cifra e decifra o token, sem deixar o valor original visível', () => {
    const cifrado = cifrar('APP_USR-token-da-loja');
    assert.match(cifrado, /^v1:/);
    assert.ok(!cifrado.includes('APP_USR'));
    assert.equal(decifrar(cifrado), 'APP_USR-token-da-loja');
});

test('o mesmo token gera cifras diferentes a cada vez', () => {
    assert.notEqual(cifrar('igual'), cifrar('igual'));
});

test('recusa token cifrado que foi alterado', () => {
    const partes = cifrar('token').split(':');
    const conteudo = Buffer.from(partes[3], 'base64');
    conteudo[0] ^= 1;
    partes[3] = conteudo.toString('base64');
    assert.throws(() => decifrar(partes.join(':')));
});

test('recusa chave de criptografia ausente ou com tamanho errado', (t) => {
    const original = process.env.MP_TOKEN_KEY;
    t.after(() => { process.env.MP_TOKEN_KEY = original; });

    process.env.MP_TOKEN_KEY = Buffer.alloc(16).toString('base64');
    assert.throws(() => cifrar('x'), /MP_TOKEN_KEY/);

    delete process.env.MP_TOKEN_KEY;
    assert.throws(() => cifrar('x'), /MP_TOKEN_KEY/);
});

// ---------------------------------------------------------------
// State do OAuth
// ---------------------------------------------------------------

const stateValido = (extra = {}) => servico.assinarState({
    loja: 2, usuario: 20, expira: Date.now() + 60000, nonce: 'abc', ...extra
});

test('state assinado é lido de volta', () => {
    assert.equal(servico.lerState(stateValido()).loja, 2);
});

test('state alterado, expirado ou malformado é recusado', () => {
    const [conteudo, assinatura] = stateValido().split('.');
    const outraLoja = Buffer.from(JSON.stringify({ loja: 3, usuario: 20, expira: Date.now() + 60000 })).toString('base64url');

    assert.equal(servico.lerState(`${outraLoja}.${assinatura}`), null);
    assert.equal(servico.lerState(`${conteudo}.x`), null);
    assert.equal(servico.lerState(stateValido({ expira: Date.now() - 1 })), null);
    assert.equal(servico.lerState(''), null);
    assert.equal(servico.lerState(undefined), null);
});

test('state não serve como token de login', () => {
    assert.throws(() => verificar(stateValido()));
});

// ---------------------------------------------------------------
// Rotas da conta
// ---------------------------------------------------------------

test('cliente e visitante não acessam a conta Mercado Pago', async () => {
    await comServidor('/mercadopago', rotas, async (base) => {
        assert.equal((await pedir(base, 'GET', '/mercadopago/conta', USUARIOS.cliente)).status, 403);
        assert.equal((await pedir(base, 'POST', '/mercadopago/conta/conectar', USUARIOS.cliente)).status, 403);
        assert.equal((await pedir(base, 'DELETE', '/mercadopago/conta', null)).status, 401);
    });
});

test('lojista sem loja recebe orientação para cadastrar a loja', async () => {
    await comServidor('/mercadopago', rotas, async (base) => {
        const resposta = await pedir(base, 'GET', '/mercadopago/conta', { id: 40, tipo: 'lojista' });
        assert.equal(resposta.status, 400);
    });
});

test('status consulta a loja do token e não expõe tokens', async (t) => {
    const consultas = simularBanco(t, db, [
        [/FROM lojas_mercadopago/, [{ token_expira_em: new Date(Date.now() + 86400000), conectado_em: new Date() }]]
    ]);

    await comServidor('/mercadopago', rotas, async (base) => {
        const resposta = await pedir(base, 'GET', '/mercadopago/conta', USUARIOS.lojista);
        assert.equal(resposta.status, 200);
        assert.equal(resposta.body.conectado, true);
        assert.equal(resposta.body.expirado, false);
        assert.ok(!JSON.stringify(resposta.body).includes('token_cifrado'));
    });

    assert.deepEqual(consultas[0].values, [2]);
    assert.doesNotMatch(consultas[0].sql, /access_token|refresh_token/);
});

test('status de loja não conectada', async (t) => {
    simularBanco(t, db, [[/FROM lojas_mercadopago/, []]]);

    await comServidor('/mercadopago', rotas, async (base) => {
        const resposta = await pedir(base, 'GET', '/mercadopago/conta', USUARIOS.lojista);
        assert.deepEqual(resposta.body, { conectado: false });
    });
});

test('conectar devolve a URL de autorização com o state da loja do token', async () => {
    await comServidor('/mercadopago', rotas, async (base) => {
        const resposta = await pedir(base, 'POST', '/mercadopago/conta/conectar', USUARIOS.lojista);
        assert.equal(resposta.status, 200);

        const url = new URL(resposta.body.url);
        assert.equal(url.origin, 'https://auth.mercadopago.com');
        assert.equal(url.searchParams.get('client_id'), '123456');
        assert.equal(url.searchParams.get('redirect_uri'), process.env.MP_OAUTH_REDIRECT_URI);

        const state = servico.lerState(url.searchParams.get('state'));
        assert.equal(state.loja, 2);
        assert.equal(state.usuario, 20);
    });
});

test('conectar responde 503 quando as credenciais OAuth não estão configuradas', async (t) => {
    const original = process.env.MP_CLIENT_SECRET;
    t.after(() => { process.env.MP_CLIENT_SECRET = original; });
    delete process.env.MP_CLIENT_SECRET;

    await comServidor('/mercadopago', rotas, async (base) => {
        assert.equal((await pedir(base, 'POST', '/mercadopago/conta/conectar', USUARIOS.lojista)).status, 503);
    });
});

test('desconectar apaga só a conta da loja do token', async (t) => {
    const consultas = simularBanco(t, db, [[/DELETE FROM lojas_mercadopago/, { affectedRows: 1 }]]);

    await comServidor('/mercadopago', rotas, async (base) => {
        assert.equal((await pedir(base, 'DELETE', '/mercadopago/conta', USUARIOS.lojista)).status, 204);
    });

    assert.deepEqual(consultas[0].values, [2]);
});

// ---------------------------------------------------------------
// Retorno do OAuth
// ---------------------------------------------------------------

test('retorno válido troca o código e grava os tokens cifrados', async (t) => {
    silenciarLogs(t);
    const chamadasOAuth = [];
    t.mock.method(OAuth.prototype, 'create', async ({ body }) => {
        chamadasOAuth.push(body);
        return { access_token: 'APP_USR-acesso', refresh_token: 'TG-renovacao', user_id: 987, expires_in: 15552000 };
    });
    const consultas = simularBanco(t, db, [
        [/FROM lojas WHERE id = \? AND usuario_id = \?/, [{ id: 2 }]],
        [/INSERT INTO lojas_mercadopago/, { affectedRows: 1 }]
    ]);

    await comServidor('/mercadopago', rotas, async (base) => {
        const resposta = await semRedirecionar(`${base}/mercadopago/oauth/retorno?code=TG-codigo&state=${stateValido()}`);
        assert.equal(resposta.status, 302);
        assert.equal(resposta.location, 'https://app.exemplo.com/lojista/perfil?mercadopago=conectado');
    });

    assert.equal(chamadasOAuth[0].code, 'TG-codigo');
    assert.equal(chamadasOAuth[0].redirect_uri, process.env.MP_OAUTH_REDIRECT_URI);

    assert.deepEqual(consultas[0].values, [2, 20]);
    const [lojaId, mpUserId, acesso, renovacao] = consultas[1].values;
    assert.equal(lojaId, 2);
    assert.equal(mpUserId, '987');
    assert.ok(!acesso.includes('APP_USR'));
    assert.equal(decifrar(acesso), 'APP_USR-acesso');
    assert.equal(decifrar(renovacao), 'TG-renovacao');
});

test('retorno com state inválido não chama o Mercado Pago nem grava nada', async (t) => {
    silenciarLogs(t);
    const create = t.mock.method(OAuth.prototype, 'create', async () => ({}));
    const consultas = simularBanco(t, db, []);

    await comServidor('/mercadopago', rotas, async (base) => {
        const resposta = await semRedirecionar(`${base}/mercadopago/oauth/retorno?code=TG-codigo&state=forjado.x`);
        assert.equal(resposta.location, 'https://app.exemplo.com/lojista/perfil?mercadopago=erro');
    });

    assert.equal(create.mock.callCount(), 0);
    assert.equal(consultas.length, 0);
});

test('retorno recusa loja que não pertence mais ao usuário do state', async (t) => {
    silenciarLogs(t);
    const create = t.mock.method(OAuth.prototype, 'create', async () => ({}));
    simularBanco(t, db, [[/FROM lojas WHERE id = \? AND usuario_id = \?/, []]]);

    await comServidor('/mercadopago', rotas, async (base) => {
        const resposta = await semRedirecionar(`${base}/mercadopago/oauth/retorno?code=TG-codigo&state=${stateValido()}`);
        assert.equal(resposta.location, 'https://app.exemplo.com/lojista/perfil?mercadopago=erro');
    });

    assert.equal(create.mock.callCount(), 0);
});

test('retorno sem código (lojista recusou) volta com erro', async (t) => {
    silenciarLogs(t);
    simularBanco(t, db, []);

    await comServidor('/mercadopago', rotas, async (base) => {
        const resposta = await semRedirecionar(`${base}/mercadopago/oauth/retorno?error=access_denied&state=${stateValido()}`);
        assert.equal(resposta.location, 'https://app.exemplo.com/lojista/perfil?mercadopago=erro');
    });
});

test('falha do Mercado Pago na troca do código volta com erro e não grava', async (t) => {
    silenciarLogs(t);
    t.mock.method(OAuth.prototype, 'create', async () => { throw new Error('invalid_grant'); });
    const consultas = simularBanco(t, db, [[/FROM lojas WHERE id = \? AND usuario_id = \?/, [{ id: 2 }]]]);

    await comServidor('/mercadopago', rotas, async (base) => {
        const resposta = await semRedirecionar(`${base}/mercadopago/oauth/retorno?code=TG-codigo&state=${stateValido()}`);
        assert.equal(resposta.location, 'https://app.exemplo.com/lojista/perfil?mercadopago=erro');
    });

    assert.ok(!consultas.some(c => /INSERT/.test(c.sql)));
});
