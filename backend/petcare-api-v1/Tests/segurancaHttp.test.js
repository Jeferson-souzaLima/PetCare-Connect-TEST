const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');

const { aplicarSegurancaHttp } = require('../middlewares/segurancaHttp');

// M3 (helmet e X-Powered-By) e B4 (CORS sem credenciais).
async function comApp(fn) {
    process.env.CORS_ORIGIN = 'https://site.petcare.test';
    const app = express();
    aplicarSegurancaHttp(app);
    app.get('/teste', (_req, res) => res.json({ ok: true }));
    const server = app.listen(0);
    try {
        return await fn(`http://127.0.0.1:${server.address().port}`);
    } finally {
        server.close();
    }
}

test('respostas não revelam o Express e trazem cabeçalhos de segurança', async () => {
    await comApp(async (base) => {
        const r = await fetch(`${base}/teste`);
        assert.equal(r.headers.get('x-powered-by'), null);
        assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
        assert.ok(r.headers.get('content-security-policy'));
        assert.ok(r.headers.get('strict-transport-security'));
        assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
    });
});

test('imagens da API podem ser exibidas pelo site em outro domínio', async () => {
    await comApp(async (base) => {
        const r = await fetch(`${base}/teste`);
        assert.equal(r.headers.get('cross-origin-resource-policy'), 'cross-origin');
    });
});

test('CORS libera só as origens configuradas e não libera credenciais', async () => {
    await comApp(async (base) => {
        const permitida = await fetch(`${base}/teste`, { headers: { Origin: 'https://site.petcare.test' } });
        assert.equal(permitida.headers.get('access-control-allow-origin'), 'https://site.petcare.test');
        assert.equal(permitida.headers.get('access-control-allow-credentials'), null);

        const outra = await fetch(`${base}/teste`, { headers: { Origin: 'https://site-malicioso.test' } });
        assert.equal(outra.headers.get('access-control-allow-origin'), null);
    });
});
