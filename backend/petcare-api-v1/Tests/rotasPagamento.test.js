const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');

// db.js exige estas variáveis ao ser carregado; nenhum teste abre conexão real.
for (const nome of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET']) {
    process.env[nome] = process.env[nome] || (nome === 'JWT_SECRET' ? 'segredo-de-teste-com-mais-de-32-caracteres' : 'test');
}

const PedidosModel = require('../Models/pedidosModel');
const pagamentosController = require('../Controllers/pagamentosController');
const pagamentosRoutes = require('../Routes/pagamentos');

async function comServidor(fn) {
    const app = express();
    app.use(express.json());
    app.use('/pagamentos', pagamentosRoutes);
    const server = app.listen(0);
    try {
        return await fn(`http://127.0.0.1:${server.address().port}`);
    } finally {
        server.close();
    }
}

const tokenCliente = () =>
    jwt.sign({ id: 10, tipo: 'cliente' }, process.env.JWT_SECRET, { expiresIn: '5m' });

test('POST /pagamentos/pedido/:id não existe mais (404)', async (t) => {
    t.mock.method(console, 'error', () => {});
    // Pedido pendente do próprio cliente: no código antigo isso levava ao trecho quebrado.
    t.mock.method(PedidosModel, 'getByIdSimples', (_id, cb) =>
        cb(null, { id: 1, usuario_id: 10, status: 'pendente' })
    );

    const status = await comServidor(async (base) => {
        const resposta = await fetch(`${base}/pagamentos/pedido/1`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenCliente()}` }
        });
        return resposta.status;
    });

    assert.equal(status, 404);
});

test('controller não expõe mais iniciarPagamentoPedido', () => {
    assert.equal('iniciarPagamentoPedido' in pagamentosController, false);
});

test('rotas que continuam: webhook e pagamento de agendamento seguem registradas', () => {
    const rotas = pagamentosRoutes.stack
        .filter((camada) => camada.route)
        .map((camada) => `${Object.keys(camada.route.methods)[0].toUpperCase()} ${camada.route.path}`);

    assert.deepEqual(rotas.sort(), [
        'GET /:id',
        'GET /referencia/:tipo/:referencia_id',
        'POST /agendamento/:agendamento_id',
        'POST /webhook'
    ]);
});
