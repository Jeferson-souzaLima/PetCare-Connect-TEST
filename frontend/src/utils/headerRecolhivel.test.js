import assert from "node:assert/strict";
import test from "node:test";
import { LIMITES_HEADER, proximoEstadoHeader } from "./headerRecolhivel.js";

const passo = (atual, y, descendo = true, fixado = null) => proximoEstadoHeader({ atual, y, descendo, fixado });

test("rolando para baixo: completo → compacto → recolhido", () => {
  assert.equal(passo("completo", 20), "completo");
  assert.equal(passo("completo", LIMITES_HEADER.compacto), "compacto");
  assert.equal(passo("compacto", 200), "compacto");
  assert.equal(passo("compacto", LIMITES_HEADER.recolher), "recolhido");
});

test("subindo no meio da página não recolhe; o recolhido só reabre abaixo do limite", () => {
  assert.equal(passo("compacto", 500, false), "compacto");
  assert.equal(passo("recolhido", 250, false), "recolhido");
  assert.equal(passo("recolhido", LIMITES_HEADER.reabrir - 1, false), "compacto");
});

test("oscilações perto dos limites não alternam o estado", () => {
  assert.equal(passo("compacto", 20, false), "compacto");
  assert.equal(passo("completo", 40, true), "completo");
  assert.equal(passo("recolhido", 300, true), "recolhido");
});

test("no topo volta ao completo, inclusive com escolha do usuário", () => {
  for (const atual of ["completo", "compacto", "recolhido"]) {
    assert.equal(passo(atual, 0), "completo");
    assert.equal(passo(atual, LIMITES_HEADER.topo, false, "compacto"), "completo");
  }
});

test("toque na aba: a escolha vale enquanto não voltar ao topo", () => {
  assert.equal(passo("recolhido", 2000, true, "compacto"), "compacto");
  assert.equal(passo("compacto", 60, false, "recolhido"), "recolhido");
});
