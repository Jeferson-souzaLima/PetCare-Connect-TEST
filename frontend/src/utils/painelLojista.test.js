import assert from "node:assert/strict";
import test from "node:test";
import { descreverVariacao, escalaDoGrafico, moedaDoEixo, rotuloAgendamento, rotuloDia } from "./painelLojista.js";

test("descreverVariacao: sinal, vírgula decimal e tendência", () => {
  assert.deepEqual(descreverVariacao(18.4), { tendencia: "alta", texto: "+18,4%" });
  assert.deepEqual(descreverVariacao(-5), { tendencia: "baixa", texto: "−5,0%" });
  assert.deepEqual(descreverVariacao(0), { tendencia: "estavel", texto: "0,0%" });
  assert.equal(descreverVariacao(null), null, "sem período anterior, não mostra variação");
});

test("escalaDoGrafico: marcas redondas que cobrem o maior valor", () => {
  assert.deepEqual(escalaDoGrafico([120, 1130, 640]), { topo: 1200, marcas: [0, 200, 400, 600, 800, 1000, 1200] });
  assert.deepEqual(escalaDoGrafico([0, 0]).topo, 100, "sem vendas, o eixo continua desenhado");
  const pequena = escalaDoGrafico([7.5]);
  assert.ok(pequena.topo >= 7.5 && pequena.marcas.length <= 7);
});

test("rótulos de datas no formato do painel", () => {
  assert.equal(rotuloDia("2026-10-14"), "14 Out");
  assert.equal(rotuloAgendamento("2026-11-05T09:00:00"), "05 Nov • 09:00");
  assert.equal(rotuloAgendamento(null), "");
});

test("moedaDoEixo: reais sem centavos", () => {
  assert.equal(moedaDoEixo(1200), "R$ 1.200");
  assert.equal(moedaDoEixo(0), "R$ 0");
});
