import test from "node:test";
import assert from "node:assert/strict";
import { SLIDES_HOME } from "./slidesHome.js";

// Rotas que existem no router (o destino do banner precisa abrir uma página de verdade).
const ROTAS = ["/produtos", "/servicos", "/lojas", "/register-lojista"];

test("slides de imagem: arquivos celular/desktop, alt e destino para uma página que existe", () => {
  const imagens = SLIDES_HOME.filter((s) => s.tipo === "imagem");
  assert.ok(imagens.length >= 4);
  for (const slide of imagens) {
    assert.match(slide.arquivo.mobile, /-mobile\.webp$/, slide.id);
    assert.match(slide.arquivo.desktop, /-desktop\.webp$/, slide.id);
    assert.ok(slide.alt.length > 20, `${slide.id}: alt descreve o banner`);
    assert.ok(slide.destino, `${slide.id}: o botão desenhado no banner precisa levar a algum lugar`);
    assert.ok(ROTAS.includes(new URL(slide.destino, "http://x").pathname), `${slide.id}: ${slide.destino}`);
  }
});

test("ids únicos e o slide principal (com os botões de verdade) continua primeiro", () => {
  assert.equal(new Set(SLIDES_HOME.map((s) => s.id)).size, SLIDES_HOME.length);
  assert.equal(SLIDES_HOME[0].tipo, "html");
});
