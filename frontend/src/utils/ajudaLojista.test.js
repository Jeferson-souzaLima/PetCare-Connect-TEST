import assert from "node:assert/strict";
import test from "node:test";
import { ARTIGOS_AJUDA, TOPICOS_AJUDA, filtrarArtigos } from "./ajudaLojista.js";

const ids = (artigos) => artigos.map((artigo) => artigo.id);

test("filtrarArtigos: busca sem acento e sem diferenciar maiúsculas, na pergunta e na resposta", () => {
  assert.ok(ids(filtrarArtigos(ARTIGOS_AJUDA, { termo: "COMISSAO" })).includes("comissao"));
  assert.ok(ids(filtrarArtigos(ARTIGOS_AJUDA, { termo: "saldo insuficiente" })).length === 0);
  assert.ok(ids(filtrarArtigos(ARTIGOS_AJUDA, { termo: "falta saldo" })).includes("estorno-recusado"));
});

test("filtrarArtigos: todas as palavras precisam aparecer; palavras de 1 letra são ignoradas", () => {
  const resultado = filtrarArtigos(ARTIGOS_AJUDA, { termo: "frete raio" });
  assert.deepEqual(ids(resultado), ["frete"]);
  assert.equal(filtrarArtigos(ARTIGOS_AJUDA, { termo: " a " }).length, ARTIGOS_AJUDA.length);
});

test("filtrarArtigos: tema limita os artigos, com ou sem busca", () => {
  const agenda = filtrarArtigos(ARTIGOS_AJUDA, { topico: "agenda" });
  assert.ok(agenda.length > 0 && agenda.every((artigo) => artigo.topico === "agenda"));
  assert.deepEqual(filtrarArtigos(ARTIGOS_AJUDA, { termo: "comissão", topico: "conta" }), []);
});

test("conteúdo: ids únicos, tema existente e links para a área do lojista", () => {
  const temas = new Set(TOPICOS_AJUDA.map((t) => t.id));
  assert.equal(new Set(ids(ARTIGOS_AJUDA)).size, ARTIGOS_AJUDA.length);
  for (const artigo of ARTIGOS_AJUDA) {
    assert.ok(temas.has(artigo.topico), artigo.id);
    assert.ok(artigo.resposta.length > 0, artigo.id);
    if (artigo.link) assert.match(artigo.link.destino, /^\/lojista\//, artigo.id);
  }
  for (const tema of temas) assert.ok(ARTIGOS_AJUDA.some((artigo) => artigo.topico === tema), tema);
});
