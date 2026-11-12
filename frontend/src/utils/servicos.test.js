import test from "node:test";
import assert from "node:assert/strict";
import { PALAVRAS_POR_TIPO_SERVICO, imagemPadraoServico, tipoImagemServico } from "./servicos.js";

test("tipoImagemServico: banho, tosa e veterinário pelo nome, sem caixa nem acento", () => {
  assert.equal(tipoImagemServico("Banho e Tosa"), "banho");
  assert.equal(tipoImagemServico("BANHO BÁSICO"), "banho");
  assert.equal(tipoImagemServico("Tosa Higiênica"), "tosa");
  assert.equal(tipoImagemServico("Hidratação de pelos"), "tosa");
  assert.equal(tipoImagemServico("Vacinação contra raiva"), "veterinario");
  assert.equal(tipoImagemServico("Consulta Veterinária"), "veterinario");
  assert.equal(tipoImagemServico("Microchipagem"), "veterinario");
});

test("tipoImagemServico: nome que não se encaixa fica sem imagem padrão", () => {
  assert.equal(tipoImagemServico("Passeio"), null);
  assert.equal(tipoImagemServico("Microshipagem"), null);
  assert.equal(tipoImagemServico(""), null);
  assert.equal(tipoImagemServico(undefined), null);
});

test("imagemPadraoServico: monta celular/desktop no R2 e devolve null sem VITE_MEDIA_URL", () => {
  const banho = imagemPadraoServico("Banho Básico", "https://cdn.x/");
  assert.equal(banho.celular, "https://cdn.x/site/servicos/banho-celular.webp");
  assert.equal(banho.desktop, "https://cdn.x/site/servicos/banho-desktop.webp");
  assert.match(banho.alt, /poodle/);
  assert.equal(imagemPadraoServico("Banho Básico", undefined), null);
  assert.equal(imagemPadraoServico("Passeio", "https://cdn.x"), null);
});

test("as palavras de banho/tosa e saúde são as mesmas dos filtros", () => {
  assert.deepEqual(Object.keys(PALAVRAS_POR_TIPO_SERVICO), ["banho_tosa", "saude"]);
});
