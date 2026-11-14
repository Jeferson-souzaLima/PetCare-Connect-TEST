const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { errosAmbienteTeste, exigirAmbienteTeste } = require('../scripts/ambienteTeste');

const LOCAL = { PETCARE_AMBIENTE: 'teste', DB_HOST: '127.0.0.1', DB_NAME: 'petcare_teste', R2_BUCKET_NAME: 'petcare-media-teste' };

test('ambiente de teste local passa na trava', () => {
    assert.deepEqual(errosAmbienteTeste(LOCAL), []);
    assert.deepEqual(errosAmbienteTeste({ ...LOCAL, DB_HOST: 'localhost', R2_BUCKET_NAME: '' }), []);
    assert.doesNotThrow(() => exigirAmbienteTeste(LOCAL));
});

test('trava bloqueia banco remoto, bucket de produção e ambiente sem marcação', () => {
    assert.equal(errosAmbienteTeste({ ...LOCAL, DB_HOST: 'mysql-xyz.aivencloud.com' }).length, 1);
    assert.equal(errosAmbienteTeste({ ...LOCAL, DB_NAME: 'defaultdb' }).length, 1);
    assert.equal(errosAmbienteTeste({ ...LOCAL, R2_BUCKET_NAME: 'petcare-media' }).length, 1);
    assert.equal(errosAmbienteTeste({ ...LOCAL, PETCARE_AMBIENTE: undefined }).length, 1);
    assert.equal(errosAmbienteTeste({ ...LOCAL, NODE_ENV: 'production' }).length, 1);
    assert.equal(errosAmbienteTeste({}).length, 3);
    assert.throws(() => exigirAmbienteTeste({ ...LOCAL, DB_HOST: 'mysql-xyz.aivencloud.com' }), { code: 'AMBIENTE_NAO_E_TESTE' });
});

test('.env.teste.example aponta para o banco local e o bucket de teste e cobre o .env.example', () => {
    const RAIZ = path.join(__dirname, '..');
    const ler = (nome) => Object.fromEntries([...fs.readFileSync(path.join(RAIZ, nome), 'utf8').matchAll(/^#?\s*([A-Z0-9_]+)=(.*)$/gm)].map((m) => [m[1], m[2].trim()]));
    const teste = ler('.env.teste.example');
    assert.deepEqual(errosAmbienteTeste(teste), []);
    const faltando = Object.keys(ler('.env.example')).filter((nome) => !(nome in teste));
    assert.deepEqual(faltando, [], 'o .env de teste precisa ter todas as variáveis para nada vir do .env de produção');
    assert.doesNotMatch(fs.readFileSync(path.join(RAIZ, '.env.teste.example'), 'utf8'), /APP_USR-|AKIA[0-9A-Z]{12,}|-----BEGIN|aivencloud\.com/);
});
