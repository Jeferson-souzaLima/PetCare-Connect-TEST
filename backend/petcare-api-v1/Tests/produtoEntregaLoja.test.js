const assert = require('node:assert/strict');
const test = require('node:test');

const { simularBanco } = require('./apoioAcesso');
const db = require('../db');
const produtosModel = require('../Models/produtosModel');

/*
 * A visualização rápida do produto mostra "Entrega em casa" só quando a loja entrega.
 * A informação vem junto com o produto (GET /produtos/:id).
 */
const LINHA = {
    produto_id: 5, produto_nome: 'Ração', descricao: '', preco: '10.00', estoque: 3, ativo: 1, loja_id: 9,
    loja_nome: 'Pet Shop Central', loja_logo: null, imagem_id: null, imagem_caminho: null, imagem_principal: null,
};

function buscar(id) {
    return new Promise((resolve, reject) => produtosModel.getById(id, (erro, produto) => (erro ? reject(erro) : resolve(produto))));
}

test('produto traz se a loja faz entrega', async (t) => {
    const consultas = simularBanco(t, db, [[/WHERE p\.id = \?/, (v) => [{ ...LINHA, loja_entrega_ativa: Number(v[0]) === 5 ? 1 : 0 }]]]);

    assert.equal((await buscar(5)).loja.entrega_ativa, true);
    assert.equal((await buscar(6)).loja.entrega_ativa, false);
    assert.match(consultas[0].sql, /l\.entrega_ativa AS loja_entrega_ativa/);
});

test('listas de produtos continuam sem o campo (a consulta não o traz)', async (t) => {
    simularBanco(t, db, [[/WHERE p\.loja_id = \?/, [LINHA]]]);

    const produtos = await new Promise((resolve, reject) =>
        produtosModel.getAtivosByLojaId(9, (erro, lista) => (erro ? reject(erro) : resolve(lista))));
    assert.equal('entrega_ativa' in produtos[0].loja, false);
});
