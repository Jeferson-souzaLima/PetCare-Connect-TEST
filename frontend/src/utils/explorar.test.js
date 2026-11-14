import assert from "node:assert/strict";
import test from "node:test";
import { FILTROS_EXPLORAR, TIPOS_EXPLORAR, filtrosDaUrl, fonteDaLista, juntarPagina, parametrosDaLista } from "./explorar.js";

test("fonteDaLista: busca ou filtro (na API) > localização escolhida > lista geral", () => {
  const perto = { latitude: -23.6, longitude: -46.9 };
  assert.equal(fonteDaLista({ termo: "ração", filtros: {}, localizacao: perto }), "filtrada");
  assert.equal(fonteDaLista({ termo: "", filtros: { ordem: "preco_asc" }, localizacao: perto }), "filtrada");
  assert.equal(fonteDaLista({ termo: " r ", filtros: {}, localizacao: perto }), "proximidade");
  assert.equal(fonteDaLista({ termo: "", filtros: {}, localizacao: null }), "geral");
});

test("filtrosDaUrl: só aceita os filtros e valores daquele tipo", () => {
  const url = (s) => new URLSearchParams(s);
  assert.deepEqual(filtrosDaUrl("produtos", url("ordem=preco_desc&entrega=1&tipo=saude")), { ordem: "preco_desc" });
  assert.deepEqual(filtrosDaUrl("lojas", url("entrega=1")), { entrega: "1" });
  assert.deepEqual(filtrosDaUrl("servicos", url("tipo=banho_tosa")), { tipo: "banho_tosa" });
  assert.deepEqual(filtrosDaUrl("servicos", url("tipo=hospedagem")), {});
  assert.deepEqual(filtrosDaUrl("produtos", url("ordem=")), {});
});

test("parametrosDaLista: texto (2+ letras) e filtros vão para a API", () => {
  assert.deepEqual(parametrosDaLista({ termo: " ração ", filtros: { ordem: "preco_asc" } }), { q: "ração", ordem: "preco_asc" });
  assert.deepEqual(parametrosDaLista({ termo: "r", filtros: {} }), {});
});

test("juntarPagina: a página 1 substitui, as seguintes somam sem repetir itens", () => {
  const p1 = juntarPagina([], [{ id: 1 }, { id: 2 }], 1);
  assert.deepEqual(p1.map((i) => i.id), [1, 2]);
  const p2 = juntarPagina(p1, [{ id: 2 }, { id: 3 }], 2);
  assert.deepEqual(p2.map((i) => i.id), [1, 2, 3]);
  assert.deepEqual(juntarPagina(p2, [{ id: 9 }], 1).map((i) => i.id), [9]);
  assert.deepEqual(juntarPagina(p2, undefined, 2).map((i) => i.id), [1, 2, 3]);
});

test("TIPOS_EXPLORAR e FILTROS_EXPLORAR: as três páginas, cada uma com o seu filtro", () => {
  assert.deepEqual(Object.keys(TIPOS_EXPLORAR), ["lojas", "produtos", "servicos"]);
  assert.equal(TIPOS_EXPLORAR.servicos.rota, "/servicos");
  assert.deepEqual(Object.keys(FILTROS_EXPLORAR), ["lojas", "produtos", "servicos"]);
  assert.equal(FILTROS_EXPLORAR.servicos.parametro, "tipo");
});
