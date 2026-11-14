const assert = require('node:assert/strict');
const test = require('node:test');
const { mock } = require('node:test');
const axios = require('axios');
const { comServidor, pedir } = require('./apoioAcesso');

const cepService = require('../Services/cepService');
const geocoding = require('../Services/geocodingService');
const geolocalizacaoRoutes = require('../Routes/geolocalizacao');

/*
 * Localização escolhida na home: coordenadas → cidade (reverso) e CEP ou cidade → coordenadas.
 * O Nominatim (OpenStreetMap) e o ViaCEP nunca são chamados de verdade aqui.
 */
const REVERSO_COTIA = { address: { town: 'Cotia', state: 'São Paulo', 'ISO3166-2-lvl4': 'BR-SP' } };
const BUSCA_COTIA = [{ lat: '-23.6038', lon: '-46.9190', address: { town: 'Cotia', 'ISO3166-2-lvl4': 'BR-SP' } }];

function simularNominatim(t, respostas) {
    const chamadas = [];
    t.mock.method(axios, 'get', async (url, opcoes) => {
        chamadas.push({ url, params: opcoes?.params, headers: opcoes?.headers });
        if (url.includes('/reverse')) return { data: respostas.reverso ?? {} };
        return { data: respostas.busca ?? [] };
    });
    return chamadas;
}

test.beforeEach(() => geocoding.limparMemoria());

test('GET /geolocalizacao/reverso devolve cidade e UF das coordenadas', async (t) => {
    const chamadas = simularNominatim(t, { reverso: REVERSO_COTIA });
    const r = await comServidor('/geolocalizacao', geolocalizacaoRoutes, (b) =>
        pedir(b, 'GET', '/geolocalizacao/reverso?latitude=-23.6&longitude=-46.9'));
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { cidade: 'Cotia', uf: 'SP' });
    assert.match(chamadas[0].url, /nominatim\.openstreetmap\.org\/reverse/);
});

test('GET /geolocalizacao/reverso recusa coordenadas inválidas com 400, sem consultar o Nominatim', async (t) => {
    const chamadas = simularNominatim(t, {});
    for (const q of ['latitude=abc&longitude=1', 'latitude=95&longitude=1', 'longitude=1', '']) {
        const r = await comServidor('/geolocalizacao', geolocalizacaoRoutes, (b) => pedir(b, 'GET', `/geolocalizacao/reverso?${q}`));
        assert.equal(r.status, 400, q);
    }
    assert.equal(chamadas.length, 0);
});

test('GET /geolocalizacao/local com CEP usa o ViaCEP para a cidade', async (t) => {
    t.mock.method(cepService, 'buscarPorCep', async () => ({ cep: '06700-000', logradouro: 'Rua A', cidade: 'Cotia', uf: 'SP' }));
    simularNominatim(t, { busca: BUSCA_COTIA });
    const r = await comServidor('/geolocalizacao', geolocalizacaoRoutes, (b) => pedir(b, 'GET', '/geolocalizacao/local?q=06700-000'));
    assert.equal(r.status, 200);
    assert.equal(r.body.cidade, 'Cotia');
    assert.equal(r.body.uf, 'SP');
    assert.equal(r.body.cep, '06700-000');
    assert.equal(typeof r.body.latitude, 'number');
    assert.equal(typeof r.body.longitude, 'number');
});

test('GET /geolocalizacao/local com nome de cidade usa o Nominatim', async (t) => {
    const chamadas = simularNominatim(t, { busca: BUSCA_COTIA });
    const r = await comServidor('/geolocalizacao', geolocalizacaoRoutes, (b) => pedir(b, 'GET', '/geolocalizacao/local?q=Cotia%20SP'));
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { cidade: 'Cotia', uf: 'SP', latitude: -23.6038, longitude: -46.919 });
    assert.equal(chamadas[0].params.countrycodes, 'br');
});

test('GET /geolocalizacao/local: vazio ou longo demais = 400; não encontrado = 404; falha externa = 502', async (t) => {
    simularNominatim(t, { busca: [] });
    const vazio = await comServidor('/geolocalizacao', geolocalizacaoRoutes, (b) => pedir(b, 'GET', '/geolocalizacao/local?q=%20'));
    assert.equal(vazio.status, 400);
    const longo = await comServidor('/geolocalizacao', geolocalizacaoRoutes, (b) => pedir(b, 'GET', `/geolocalizacao/local?q=${'a'.repeat(81)}`));
    assert.equal(longo.status, 400);
    const nada = await comServidor('/geolocalizacao', geolocalizacaoRoutes, (b) => pedir(b, 'GET', '/geolocalizacao/local?q=Xyzwq'));
    assert.equal(nada.status, 404);

    t.mock.method(axios, 'get', async () => { throw new Error('timeout'); });
    geocoding.limparMemoria();
    const falha = await comServidor('/geolocalizacao', geolocalizacaoRoutes, (b) => pedir(b, 'GET', '/geolocalizacao/local?q=Cotia'));
    assert.equal(falha.status, 502);
});

test('Nominatim: identifica o PetCare Connect e guarda resultados recentes (mesma consulta = 1 chamada)', async (t) => {
    const chamadas = simularNominatim(t, { reverso: REVERSO_COTIA });
    await geocoding.buscarCidadePorCoordenadas(-23.6, -46.9);
    await geocoding.buscarCidadePorCoordenadas(-23.6, -46.9);
    assert.equal(chamadas.length, 1);
    assert.match(chamadas[0].headers['User-Agent'], /PetCare Connect/);
});

test('Nominatim: no máximo 1 consulta por segundo', async (t) => {
    const horarios = [];
    t.mock.method(axios, 'get', async () => {
        horarios.push(Date.now());
        return { data: REVERSO_COTIA };
    });
    await Promise.all([
        geocoding.buscarCidadePorCoordenadas(-23.1, -46.1),
        geocoding.buscarCidadePorCoordenadas(-23.2, -46.2),
        geocoding.buscarCidadePorCoordenadas(-23.3, -46.3)
    ]);
    assert.equal(horarios.length, 3);
    assert.ok(horarios[1] - horarios[0] >= 1000, `intervalo ${horarios[1] - horarios[0]} ms`);
    assert.ok(horarios[2] - horarios[1] >= 1000, `intervalo ${horarios[2] - horarios[1]} ms`);
});

test('GET /geolocalizacao/local e /reverso: a 31ª consulta do mesmo IP em 15 minutos recebe 429', async (t) => {
    mock.method(geocoding, 'buscarCidade', async () => ({ cidade: 'Cotia', uf: 'SP', latitude: -23.6, longitude: -46.9 }));
    t.after(() => geocoding.buscarCidade.mock.restore());
    await comServidor('/geolocalizacao', geolocalizacaoRoutes, async (base) => {
        const headers = { 'CF-Connecting-IP': '203.0.113.90' };
        for (let i = 1; i <= 30; i++) {
            assert.equal((await fetch(`${base}/geolocalizacao/local?q=Cotia`, { headers })).status, 200, `consulta ${i}`);
        }
        const bloqueada = await fetch(`${base}/geolocalizacao/local?q=Cotia`, { headers });
        assert.equal(bloqueada.status, 429);
        assert.match((await bloqueada.json()).mensagem, /Muitas consultas de localização/);
    });
});
