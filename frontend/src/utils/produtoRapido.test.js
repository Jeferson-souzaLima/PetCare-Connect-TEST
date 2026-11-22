import assert from "node:assert/strict";
import test from "node:test";
import { disponivel, itemDoCarrinho, quantidadeMaxima, somaPrecos, sugestoesLeveTambem, textoEstoque } from "./produtoRapido.js";

const PRODUTO = { id: 5, nome: "Ração", preco: "52.08", estoque: 10, loja: { id: 9, nome: "PetVida" }, imagens: [{ caminho: "a.jpg" }] };

test("itemDoCarrinho: mesmo formato usado pelo carrinho", () => {
  assert.deepEqual(itemDoCarrinho(PRODUTO, 2), {
    tipo: "produto", item_id: 5, nome_item: "Ração", preco_unitario: "52.08", quantidade: 2, loja_id: 9, loja_nome: "PetVida", imagem: "a.jpg",
  });
  assert.equal(itemDoCarrinho({ ...PRODUTO, imagens: [] }).imagem, null);
  assert.equal(itemDoCarrinho({ ...PRODUTO, loja: undefined, loja_id: 4 }).loja_id, 4);
});

test("estoque: limite de quantidade e texto", () => {
  assert.equal(quantidadeMaxima(PRODUTO), 10);
  assert.equal(quantidadeMaxima({ estoque: null }), 99);
  assert.equal(textoEstoque({ estoque: 0 }), "Esgotado");
  assert.equal(textoEstoque({ estoque: "1" }), "Última unidade");
  assert.equal(textoEstoque({ estoque: 3 }), "Últimas 3 unidades");
  assert.equal(textoEstoque({ estoque: 40 }), "Em estoque");
  assert.equal(textoEstoque({}), "Em estoque");
  assert.equal(disponivel({ estoque: 0 }), false);
  assert.equal(disponivel({ estoque: null }), true);
});

test("sugestoesLeveTambem: sem o produto atual, sem o que já está no carrinho e sem esgotados", () => {
  const lista = [
    { id: 5, preco: 10, estoque: 3, imagens: [{}] },
    { id: 6, preco: 10, estoque: 0, imagens: [{}] },
    { id: 7, preco: 10, estoque: 3, imagens: [] },
    { id: 8, preco: 10, estoque: 3, imagens: [{}] },
    { id: 9, preco: 10, estoque: null, imagens: [{}] },
    { id: 10, preco: 0, estoque: 3, imagens: [{}] },
    { id: 11, preco: 10, estoque: 3, imagens: [{}] },
  ];
  const ids = (l) => l.map((p) => p.id);

  assert.deepEqual(ids(sugestoesLeveTambem(lista, { produtoAtualId: 5, idsNoCarrinho: ["8"] })), [9, 11, 7]);
  assert.deepEqual(ids(sugestoesLeveTambem(lista, { produtoAtualId: 5, limite: 2 })), [8, 9]);
  assert.deepEqual(sugestoesLeveTambem(null), []);
});

test("somaPrecos", () => {
  assert.equal(somaPrecos([{ preco: "14.90" }, { preco: 19.9 }, { preco: null }]), 34.8);
});
