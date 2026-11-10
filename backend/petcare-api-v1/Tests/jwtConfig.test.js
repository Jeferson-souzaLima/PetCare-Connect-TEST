const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const jwt = require('jsonwebtoken');
const { comServidor, pedir } = require('./apoioAcesso');

const { assinar, verificar } = require('../Config/jwt');
const usuariosRoutes = require('../Routes/usuarios');

// B2: algoritmo do JWT fixo (HS256) e segredo com tamanho mínimo.
const carregarConfigCom = (segredo) => spawnSync(process.execPath, ['-e', "require('./Config/jwt')"], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, JWT_SECRET: segredo },
    encoding: 'utf8'
});

test('JWT_SECRET com menos de 32 caracteres impede a API de iniciar', () => {
    const r = carregarConfigCom('curto-demais');
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /pelo menos 32 caracteres/);
});

test('JWT_SECRET com 32 caracteres ou mais é aceito', () => {
    assert.equal(carregarConfigCom('x'.repeat(32)).status, 0);
});

test('tokens são assinados com HS256 e verificados', () => {
    const token = assinar({ id: 1, tipo: 'cliente' });
    assert.equal(jwt.decode(token, { complete: true }).header.alg, 'HS256');
    assert.equal(verificar(token).id, 1);
});

test('token com outro algoritmo ou sem assinatura é recusado (401)', async () => {
    const segredo = process.env.JWT_SECRET;
    const hs512 = jwt.sign({ id: 1, tipo: 'admin' }, segredo, { algorithm: 'HS512' });
    const semAssinatura = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from('{"id":1,"tipo":"admin"}').toString('base64url')}.`;

    assert.throws(() => verificar(hs512));
    await comServidor('/usuarios', usuariosRoutes, async (base) => {
        for (const token of [hs512, semAssinatura]) {
            const r = await fetch(`${base}/usuarios/me`, { headers: { Authorization: `Bearer ${token}` } });
            assert.equal(r.status, 401);
        }
    });
});

test('rota protegida continua aceitando token válido', async (t) => {
    const db = require('../db');
    t.mock.method(db, 'query', (_sql, _v, cb) => cb(null, [{ id: 10, tipo: 'cliente', nome: 'Fulano' }]));
    const r = await comServidor('/usuarios', usuariosRoutes, (b) => pedir(b, 'GET', '/usuarios/me', { id: 10, tipo: 'cliente' }));
    assert.equal(r.status, 200);
});
