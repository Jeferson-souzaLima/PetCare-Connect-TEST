const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

const db = require('../db');
const pedidosModel = require('../Models/pedidosModel');
const lojasRoutes = require('../Routes/lojas');
const pedidosRoutes = require('../Routes/pedidos');

test('POST /pedidos (legado, aceitava o total enviado pelo cliente) não existe mais', async (t) => {
    let criou = false;
    if (typeof pedidosModel.createPedidoComItens === 'function') {
        t.mock.method(pedidosModel, 'createPedidoComItens', (_p, cb) => { criou = true; cb(null, 1); });
    }
    simularBanco(t, db, []);
    const corpo = { loja_id: 2, total: 0.01, itens: [{ produto_id: 1, quantidade: 100, preco_unitario: 0.0001 }] };
    const r = await comServidor('/pedidos', pedidosRoutes, (b) => pedir(b, 'POST', '/pedidos', USUARIOS.cliente, corpo));
    assert.equal(r.status, 404);
    assert.equal(criou, false);
});

test('o checkout novo continua registrado em /pedidos/checkout', () => {
    const rotas = pedidosRoutes.stack.filter((c) => c.route).map((c) => `${Object.keys(c.route.methods)[0]} ${c.route.path}`);
    assert.ok(rotas.includes('post /checkout'));
    assert.ok(rotas.includes('post /calcular-frete'));
    assert.equal(rotas.includes('post /'), false);
});

test('POST /lojas/:id/imagem (legado, gravava /uploads/undefined) não existe mais', async (t) => {
    const consultas = simularBanco(t, db, [[/./, { affectedRows: 1 }]]);
    const r = await comServidor('/lojas', lojasRoutes, (b) => pedir(b, 'POST', '/lojas/2/imagem', USUARIOS.lojista));
    assert.equal(r.status, 404);
    assert.equal(consultas.some((c) => /UPDATE lojas SET imagem/.test(c.sql)), false);
});

test('rotas /itenspedido (sem uso e sem checagem de preço) não são mais montadas', () => {
    const raiz = path.join(__dirname, '..');
    const app = fs.readFileSync(path.join(raiz, 'app.js'), 'utf8');
    assert.equal(/itenspedido|itensPedido/i.test(app), false);
    assert.equal(fs.existsSync(path.join(raiz, 'Routes', 'itensPedido.js')), false);
    assert.equal(fs.existsSync(path.join(raiz, 'Controllers', 'itensPedidoController.js')), false);
});
