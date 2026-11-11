import assert from "node:assert/strict";
import test from "node:test";
import { CARRINHO_VAZIO, incluirItem } from "./carrinho.js";

const RACAO = { tipo: "produto", item_id: 5, nome_item: "Ração", preco_unitario: 10, quantidade: 1, loja_id: 2, loja_nome: "Pet Feliz" };

test("incluirItem: o mesmo produto soma a quantidade em vez de duplicar a linha", () => {
  const um = incluirItem(CARRINHO_VAZIO, RACAO);
  const dois = incluirItem(um.carrinho, { ...RACAO, quantidade: 2 });
  assert.equal(dois.ok, true);
  assert.equal(dois.carrinho.itens.length, 1);
  assert.equal(dois.carrinho.itens[0].quantidade, 3);
  assert.equal(dois.carrinho.total, 30);
});

test("incluirItem: id e quantidade como texto são tratados como o mesmo item", () => {
  const um = incluirItem(CARRINHO_VAZIO, RACAO);
  const dois = incluirItem(um.carrinho, { ...RACAO, item_id: "5", loja_id: "2", quantidade: "2" });
  assert.equal(dois.ok, true);
  assert.equal(dois.carrinho.itens.length, 1);
  assert.equal(dois.carrinho.itens[0].quantidade, 3);
});

test("incluirItem: produto de outra loja é recusado e o carrinho não muda", () => {
  const um = incluirItem(CARRINHO_VAZIO, RACAO);
  const outra = incluirItem(um.carrinho, { ...RACAO, item_id: 6, loja_id: 3 });
  assert.equal(outra.ok, false);
  assert.equal(outra.motivo, "outra_loja");
  assert.equal(outra.carrinho, um.carrinho);
});

test("incluirItem: item sem id, sem loja ou com quantidade inválida é recusado", () => {
  for (const ruim of [{ ...RACAO, item_id: null }, { ...RACAO, loja_id: undefined }, { ...RACAO, quantidade: 0 }, { ...RACAO, quantidade: "abc" }, null]) {
    const r = incluirItem(CARRINHO_VAZIO, ruim);
    assert.equal(r.ok, false);
    assert.equal(r.motivo, "invalido");
    assert.equal(r.carrinho, CARRINHO_VAZIO);
  }
});

test("incluirItem: inclusões em sequência sobre o resultado anterior não misturam lojas", () => {
  // Simula dois cliques antes de a tela atualizar: a segunda inclusão parte do estado já atualizado.
  const a = incluirItem(CARRINHO_VAZIO, RACAO);
  const b = incluirItem(a.carrinho, { ...RACAO, item_id: 6, loja_id: 3 });
  assert.equal(b.ok, false);
  assert.deepEqual(b.carrinho.itens.map((i) => i.item_id), [5]);
});
