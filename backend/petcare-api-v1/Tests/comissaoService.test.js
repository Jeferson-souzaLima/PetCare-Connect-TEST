const assert = require('node:assert/strict');
const test = require('node:test');

const { calcularComissao } = require('../Services/comissaoService');

test('pedido usa 8% sobre o subtotal dos produtos', () => {
    assert.deepEqual(calcularComissao('pedido', 100), { percentual: 8, valor: 8 });
});

test('agendamento usa 10% sobre o valor do serviço', () => {
    assert.deepEqual(calcularComissao('agendamento', 80), { percentual: 10, valor: 8 });
});

test('arredonda para o centavo mais próximo', () => {
    assert.equal(calcularComissao('pedido', 19.99).valor, 1.6);
    assert.equal(calcularComissao('agendamento', 0.15).valor, 0.02);
    assert.equal(calcularComissao('pedido', 0.1 + 0.2).valor, 0.02);
});

test('aceita valor em texto vindo do banco (DECIMAL)', () => {
    assert.equal(calcularComissao('pedido', '59.90').valor, 4.79);
});

test('venda de valor zero não gera comissão', () => {
    assert.equal(calcularComissao('agendamento', 0).valor, 0);
});

test('recusa tipo sem comissão definida', () => {
    assert.throws(() => calcularComissao('frete', 10), /sem comissão definida/);
});

test('recusa valor base inválido', () => {
    assert.throws(() => calcularComissao('pedido', -1), /inválido/);
    assert.throws(() => calcularComissao('pedido', 'abc'), /inválido/);
});
