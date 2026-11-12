import assert from "node:assert/strict";
import test from "node:test";
import { TIPOS_EXPLORAR, fonteDaLista, juntarPagina } from "./explorar.js";

test("fonteDaLista: busca digitada > localização escolhida > lista geral", () => {
  const perto = { latitude: -23.6, longitude: -46.9 };
  assert.equal(fonteDaLista({ termo: "ração", localizacao: perto }), "busca");
  assert.equal(fonteDaLista({ termo: " r ", localizacao: perto }), "proximidade");
  assert.equal(fonteDaLista({ termo: "", localizacao: perto }), "proximidade");
  assert.equal(fonteDaLista({ termo: "", localizacao: null }), "geral");
});

test("juntarPagina: a página 1 substitui, as seguintes somam sem repetir itens", () => {
  const p1 = juntarPagina([], [{ id: 1 }, { id: 2 }], 1);
  assert.deepEqual(p1.map((i) => i.id), [1, 2]);
  const p2 = juntarPagina(p1, [{ id: 2 }, { id: 3 }], 2);
  assert.deepEqual(p2.map((i) => i.id), [1, 2, 3]);
  assert.deepEqual(juntarPagina(p2, [{ id: 9 }], 1).map((i) => i.id), [9]);
  assert.deepEqual(juntarPagina(p2, undefined, 2).map((i) => i.id), [1, 2, 3]);
});

test("TIPOS_EXPLORAR: as três páginas com rota e rótulo", () => {
  assert.deepEqual(Object.keys(TIPOS_EXPLORAR), ["lojas", "produtos", "servicos"]);
  assert.equal(TIPOS_EXPLORAR.servicos.rota, "/servicos");
  assert.equal(TIPOS_EXPLORAR.produtos.titulo, "Produtos");
});
