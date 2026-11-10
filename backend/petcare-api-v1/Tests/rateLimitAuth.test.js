const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');

// db.js exige estas variáveis ao ser carregado; nenhum teste abre conexão real.
for (const nome of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET']) {
    process.env[nome] = process.env[nome] || 'test';
}

// Os controllers são substituídos por stubs ANTES de carregar as rotas,
// para testar apenas o limite de tentativas (nada toca o banco).
const authController = require('../Controllers/authController');
const emailConfirmationController = require('../Controllers/emailConfirmationController');
let loginDeveFalhar = true;
emailConfirmationController.validarEmailConfirmado = (_req, _res, next) => next();
authController.login = (_req, res) =>
    loginDeveFalhar ? res.status(401).json({ mensagem: 'Email ou senha inválidos.' }) : res.json({ ok: true });
emailConfirmationController.register = (_req, res) => res.status(201).json({ ok: true });
authController.registerLojista = (_req, res) => res.status(201).json({ ok: true });
emailConfirmationController.reenviarConfirmacao = (_req, res) => res.json({ ok: true });
emailConfirmationController.confirmarEmail = (_req, res) => res.json({ ok: true });

function novoApp() {
    // Cada teste usa uma cópia nova das rotas (contadores zerados).
    delete require.cache[require.resolve('../Routes/auth')];
    for (const id of Object.keys(require.cache)) {
        if (id.includes('rateLimitAuth')) delete require.cache[id];
    }
    const app = express();
    app.use(express.json());
    app.use('/auth', require('../Routes/auth'));
    return app;
}

async function comServidor(app, fn) {
    const server = app.listen(0);
    try {
        return await fn(`http://127.0.0.1:${server.address().port}`);
    } finally {
        server.close();
    }
}

const post = (base, rota, headers = {}) =>
    fetch(`${base}${rota}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ email: 'a@b.com', senha: 'x' })
    });

test('login: a 11ª tentativa falha do mesmo IP recebe 429 com mensagem em português', async () => {
    loginDeveFalhar = true;
    await comServidor(novoApp(), async (base) => {
        const ip = { 'CF-Connecting-IP': '203.0.113.10' };
        for (let i = 1; i <= 10; i++) {
            assert.equal((await post(base, '/auth/login', ip)).status, 401, `tentativa ${i}`);
        }
        const bloqueada = await post(base, '/auth/login', ip);
        assert.equal(bloqueada.status, 429);
        const corpo = await bloqueada.json();
        assert.match(corpo.mensagem, /Muitas tentativas/);
        assert.ok(bloqueada.headers.get('retry-after'), 'deve informar Retry-After');
    });
});

test('login: tentativas com sucesso não consomem o limite', async () => {
    loginDeveFalhar = false;
    await comServidor(novoApp(), async (base) => {
        const ip = { 'CF-Connecting-IP': '203.0.113.11' };
        for (let i = 1; i <= 15; i++) {
            assert.equal((await post(base, '/auth/login', ip)).status, 200, `login ${i}`);
        }
    });
});

test('login: IPs reais diferentes têm limites separados', async () => {
    loginDeveFalhar = true;
    await comServidor(novoApp(), async (base) => {
        for (let i = 0; i < 10; i++) await post(base, '/auth/login', { 'CF-Connecting-IP': '203.0.113.20' });
        assert.equal((await post(base, '/auth/login', { 'CF-Connecting-IP': '203.0.113.20' })).status, 429);
        assert.equal((await post(base, '/auth/login', { 'CF-Connecting-IP': '203.0.113.21' })).status, 401);
    });
});

test('login: X-Forwarded-For forjado não burla o limite', async () => {
    loginDeveFalhar = true;
    await comServidor(novoApp(), async (base) => {
        const statuses = [];
        for (let i = 0; i < 12; i++) {
            const r = await post(base, '/auth/login', {
                'CF-Connecting-IP': '203.0.113.30',
                'X-Forwarded-For': `10.0.0.${i}`
            });
            statuses.push(r.status);
        }
        assert.deepEqual(statuses.slice(10), [429, 429]);
    });
});

test('cadastro: a 11ª tentativa na mesma hora recebe 429', async () => {
    await comServidor(novoApp(), async (base) => {
        const ip = { 'CF-Connecting-IP': '203.0.113.40' };
        for (let i = 1; i <= 10; i++) assert.equal((await post(base, '/auth/register', ip)).status, 201);
        const r = await post(base, '/auth/register', ip);
        assert.equal(r.status, 429);
        assert.match((await r.json()).mensagem, /Muitas tentativas de cadastro/);
    });
});

test('cadastro de lojista: a 11ª tentativa na mesma hora recebe 429 (A4)', async () => {
    await comServidor(novoApp(), async (base) => {
        const ip = { 'CF-Connecting-IP': '203.0.113.45' };
        for (let i = 1; i <= 10; i++) assert.equal((await post(base, '/auth/register-lojista', ip)).status, 201);
        const r = await post(base, '/auth/register-lojista', ip);
        assert.equal(r.status, 429);
        assert.match((await r.json()).mensagem, /Muitas tentativas de cadastro/);
    });
});

test('reenvio de confirmação: a 6ª tentativa na mesma hora recebe 429', async () => {
    await comServidor(novoApp(), async (base) => {
        const ip = { 'CF-Connecting-IP': '203.0.113.50' };
        for (let i = 1; i <= 5; i++) assert.equal((await post(base, '/auth/reenviar-confirmacao', ip)).status, 200);
        const r = await post(base, '/auth/reenviar-confirmacao', ip);
        assert.equal(r.status, 429);
        assert.match((await r.json()).mensagem, /reenvios/);
    });
});

test('login: CF-Connecting-IP inválido não cria contadores novos (usa o IP da conexão)', async () => {
    loginDeveFalhar = true;
    await comServidor(novoApp(), async (base) => {
        for (let i = 0; i < 10; i++) await post(base, '/auth/login', { 'CF-Connecting-IP': `invalido-${i}` });
        assert.equal((await post(base, '/auth/login', { 'CF-Connecting-IP': 'outro-invalido' })).status, 429);
    });
});

test('login: endereços IPv6 da mesma sub-rede /56 compartilham o limite', async () => {
    loginDeveFalhar = true;
    await comServidor(novoApp(), async (base) => {
        for (let i = 1; i <= 10; i++) await post(base, '/auth/login', { 'CF-Connecting-IP': `2001:db8:0:1::${i}` });
        assert.equal((await post(base, '/auth/login', { 'CF-Connecting-IP': '2001:db8:0:1::ff' })).status, 429);
        assert.equal((await post(base, '/auth/login', { 'CF-Connecting-IP': '2001:db8:1:100::1' })).status, 401);
    });
});
