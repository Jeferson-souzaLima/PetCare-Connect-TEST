const assert = require('node:assert/strict');
const test = require('node:test');
const { mock } = require('node:test');
const { comServidor } = require('./apoioAcesso');

// O ViaCEP não é chamado: o serviço é substituído antes de carregar a rota.
const cepService = require('../Services/cepService');
mock.method(cepService, 'buscarPorCep', async () => ({ cep: '01001-000', cidade: 'São Paulo', uf: 'SP' }));
const cepRoutes = require('../Routes/cep');

// M6: /cep é público; sem limite, servia de proxy gratuito para o ViaCEP.
test('GET /cep: a 61ª consulta do mesmo IP em 15 minutos recebe 429', async () => {
    await comServidor('/cep', cepRoutes, async (base) => {
        const headers = { 'CF-Connecting-IP': '203.0.113.60' };
        for (let i = 1; i <= 60; i++) {
            assert.equal((await fetch(`${base}/cep/01001000`, { headers })).status, 200, `consulta ${i}`);
        }
        const bloqueada = await fetch(`${base}/cep/01001000`, { headers });
        assert.equal(bloqueada.status, 429);
        assert.match((await bloqueada.json()).mensagem, /Muitas consultas de CEP/);

        const outroIp = await fetch(`${base}/cep/01001000`, { headers: { 'CF-Connecting-IP': '203.0.113.61' } });
        assert.equal(outroIp.status, 200);
    });
});
