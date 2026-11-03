const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { simularBanco } = require('./apoioAcesso');

const db = require('../db');
const { podeAcessar } = require('../utils/acessoRegistro');

const verificar = (usuario, registro) =>
    new Promise((resolve, reject) => podeAcessar(usuario, registro, (err, pode) => (err ? reject(err) : resolve(pode))));

test('lojista com duas lojas acessa registros de qualquer uma delas, e só delas', async (t) => {
    simularBanco(t, db, [[/FROM lojas WHERE usuario_id = \?/, [{ id: 2 }, { id: 5 }]]]);
    const lojista = { id: 20, tipo: 'lojista', loja_id: 2 };
    assert.equal(await verificar(lojista, { donoId: 10, lojaId: 5 }), true);
    assert.equal(await verificar(lojista, { donoId: 10, lojaId: '2' }), true, 'id como texto também confere');
    assert.equal(await verificar(lojista, { donoId: 10, lojaId: 3 }), false);
});

test('registro sem cliente (agendamento manual) não libera usuário sem relação', async (t) => {
    simularBanco(t, db, [[/FROM lojas WHERE usuario_id = \?/, []]]);
    assert.equal(await verificar({ id: 10, tipo: 'cliente' }, { donoId: null, lojaId: 2 }), false);
    assert.equal(await verificar(null, { donoId: 10, lojaId: 2 }), false);
});

test('versões dos Termos e da Privacidade são iguais no frontend e no backend', () => {
    const backend = require('../Config/documentosLegais');
    const frontend = fs.readFileSync(path.join(__dirname, '../../../frontend/src/constants/documentosLegais.js'), 'utf8');
    const ler = (nome) => frontend.match(new RegExp(`export const ${nome} = "([^"]+)"`))?.[1];
    assert.equal(ler('VERSAO_TERMOS'), backend.VERSAO_TERMOS);
    assert.equal(ler('VERSAO_PRIVACIDADE'), backend.VERSAO_PRIVACIDADE);
});
