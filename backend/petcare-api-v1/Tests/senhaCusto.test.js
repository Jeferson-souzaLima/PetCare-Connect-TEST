const assert = require('node:assert/strict');
const test = require('node:test');
const bcrypt = require('bcrypt');

const { CUSTO_BCRYPT } = require('../Config/senha');

// B3: novas senhas com custo 12; hashes antigos (custo 10) continuam válidos.
test('novas senhas usam bcrypt com custo 12', async () => {
    assert.equal(CUSTO_BCRYPT, 12);
    const hash = await bcrypt.hash('senha12345', CUSTO_BCRYPT);
    assert.match(hash, /^\$2[aby]\$12\$/);
});

test('senha gravada com o custo antigo (10) continua entrando', async () => {
    const hashAntigo = await bcrypt.hash('senha12345', 10);
    assert.equal(await bcrypt.compare('senha12345', hashAntigo), true);
});

test('login com senha de custo antigo refaz o hash com custo 12, sem trocar a senha', async (t) => {
    const { simularBanco } = require('./apoioAcesso');
    const db = require('../db');
    const authController = require('../Controllers/authController');
    const hashAntigo = await bcrypt.hash('senha12345', 10);
    const usuario = { id: 3, nome: 'A', email: 'a@exemplo.com', senha_hash: hashAntigo, tipo: 'cliente', email_verificado: 1 };

    let atualizou;
    const gravado = new Promise((resolve) => { atualizou = resolve; });
    simularBanco(t, db, [
        [/FROM usuarios WHERE email = \?/, [usuario]],
        [/UPDATE usuarios SET senha_hash/, (v) => { atualizou(v); return { affectedRows: 1 }; }]
    ]);

    const resposta = await new Promise((resolve) => authController.login({ body: { email: 'a@exemplo.com', senha: 'senha12345' } }, {
        statusCode: 200,
        status(c) { this.statusCode = c; return this; },
        json(b) { resolve({ status: this.statusCode, body: b }); return this; }
    }));
    assert.equal(resposta.status, 200);

    const [novoHash, id, hashEsperado] = await gravado;
    assert.equal(id, 3);
    assert.equal(hashEsperado, hashAntigo, 'só atualiza se a senha não mudou no meio tempo');
    assert.equal(bcrypt.getRounds(novoHash), 12);
    assert.equal(await bcrypt.compare('senha12345', novoHash), true);
});
