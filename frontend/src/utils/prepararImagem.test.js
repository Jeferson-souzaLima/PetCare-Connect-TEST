import assert from "node:assert/strict";
import test from "node:test";
import { LIMITE_BYTES, aceitoSemConverter, formatoPeloConteudo, medidasReduzidas, trocarExtensao } from "./prepararImagem.js";

test("formatoPeloConteudo: reconhece JPG e PNG pelo conteúdo, não pelo nome", () => {
  assert.equal(formatoPeloConteudo(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "jpeg");
  assert.equal(formatoPeloConteudo(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])), "png");
  // WEBP ("RIFF....WEBP"), como as imagens do WhatsApp salvas com nome .jpg
  assert.equal(formatoPeloConteudo(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0])), null);
  assert.equal(formatoPeloConteudo(new Uint8Array([])), null);
});

test("aceitoSemConverter: só JPG/PNG de até 5 MB passam direto", () => {
  assert.equal(aceitoSemConverter("jpeg", 1000), true);
  assert.equal(aceitoSemConverter("png", LIMITE_BYTES), true);
  assert.equal(aceitoSemConverter("jpeg", LIMITE_BYTES + 1), false);
  assert.equal(aceitoSemConverter(null, 1000), false);
});

test("medidasReduzidas: limita o maior lado e mantém a proporção; não aumenta imagem pequena", () => {
  assert.deepEqual(medidasReduzidas(4000, 3000), { largura: 2000, altura: 1500 });
  assert.deepEqual(medidasReduzidas(1500, 3000), { largura: 1000, altura: 2000 });
  assert.deepEqual(medidasReduzidas(800, 600), { largura: 800, altura: 600 });
});

test("trocarExtensao", () => {
  assert.equal(trocarExtensao("foto.webp", "jpg"), "foto.jpg");
  assert.equal(trocarExtensao("IMG_1234.HEIC", "jpg"), "IMG_1234.jpg");
  assert.equal(trocarExtensao("semextensao", "jpg"), "semextensao.jpg");
  assert.equal(trocarExtensao("", "png"), "imagem.png");
});
