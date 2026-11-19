import assert from "node:assert/strict";
import test from "node:test";
import { esperaAteConferirToken, tokenExpirado } from "./sessao.js";

const DIA = 24 * 60 * 60 * 1000;
const AGORA = Date.UTC(2026, 10, 19);

/** Token com o exp informado (só o payload importa aqui). */
const tokenQueVenceEm = (ms) => {
  const payload = btoa(JSON.stringify({ exp: Math.floor((AGORA + ms) / 1000) }));
  return `cabecalho.${payload}.assinatura`;
};

test("esperaAteConferirToken: sessão de 1 dia espera até o vencimento", () => {
  assert.equal(esperaAteConferirToken(tokenQueVenceEm(DIA), AGORA), DIA);
});

test("esperaAteConferirToken: 30 dias não passa do limite do setTimeout", () => {
  const espera = esperaAteConferirToken(tokenQueVenceEm(30 * DIA), AGORA);
  assert.equal(espera, 2 ** 31 - 1, "acima do limite, o setTimeout dispararia na hora e deslogaria a pessoa");
  assert.equal(tokenExpirado(tokenQueVenceEm(30 * DIA), AGORA + espera), false, "ao conferir, a sessão continua");
});

test("esperaAteConferirToken: token vencido ou ilegível", () => {
  assert.equal(esperaAteConferirToken(tokenQueVenceEm(-1000), AGORA), 0);
  assert.equal(esperaAteConferirToken("token-quebrado", AGORA), null);
});
