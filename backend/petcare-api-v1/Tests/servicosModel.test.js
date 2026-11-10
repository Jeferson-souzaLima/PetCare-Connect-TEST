const assert = require('node:assert/strict');
const test = require('node:test');

// db.js exige estas variáveis ao ser carregado; nenhum teste abre conexão real.
for (const nome of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET']) {
    process.env[nome] = process.env[nome] || 'test';
}

const db = require('../db');
const servicosModel = require('../Models/servicosModel');
const { RAIO_PADRAO_KM, LIMITE_RESULTADOS } = require('../Config/geolocalizacaoConfig');

test('buscarServicos usa o raio e o limite padrão da configuração de geolocalização', (t) => {
    let parametros;
    t.mock.method(db, 'query', (_sql, valores, cb) => {
        parametros = valores;
        cb(null, []);
    });

    servicosModel.buscarServicos(-23.6, -46.9, () => {});

    assert.deepEqual(parametros, [-23.6, -46.9, -23.6, RAIO_PADRAO_KM, LIMITE_RESULTADOS]);
});
