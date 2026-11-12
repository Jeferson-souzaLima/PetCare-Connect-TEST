import assert from "node:assert/strict";
import test from "node:test";
import { CHAVE_LOCALIZACAO, lerLocalizacao, mensagemErroGeolocalizacao, rotuloLocalizacao, salvarLocalizacao } from "./localizacao.js";

function armazenamentoFalso(inicial = {}) {
  const dados = { ...inicial };
  return {
    getItem: (k) => (k in dados ? dados[k] : null),
    setItem: (k, v) => {
      dados[k] = String(v);
    },
    removeItem: (k) => {
      delete dados[k];
    },
    dados,
  };
}

test("salvar e ler a localização escolhida (continua ao recarregar)", () => {
  const armazenamento = armazenamentoFalso();
  salvarLocalizacao({ origem: "busca", cidade: "Cotia", uf: "SP", latitude: -23.6, longitude: -46.9 }, armazenamento);
  assert.deepEqual(lerLocalizacao(armazenamento), { origem: "busca", cidade: "Cotia", uf: "SP", latitude: -23.6, longitude: -46.9 });
});

test("lerLocalizacao ignora dado corrompido, coordenadas inválidas ou armazenamento indisponível", () => {
  assert.equal(lerLocalizacao(armazenamentoFalso({ [CHAVE_LOCALIZACAO]: "{quebrado" })), null);
  assert.equal(lerLocalizacao(armazenamentoFalso({ [CHAVE_LOCALIZACAO]: JSON.stringify({ origem: "gps", latitude: 200, longitude: 1 }) })), null);
  assert.equal(lerLocalizacao(armazenamentoFalso({ [CHAVE_LOCALIZACAO]: JSON.stringify({ origem: "gps" }) })), null);
  const bloqueado = { getItem: () => { throw new Error("SecurityError"); } };
  assert.equal(lerLocalizacao(bloqueado), null);
});

test("salvarLocalizacao(null) apaga; falha do armazenamento não quebra", () => {
  const armazenamento = armazenamentoFalso({ [CHAVE_LOCALIZACAO]: "{}" });
  salvarLocalizacao(null, armazenamento);
  assert.equal(CHAVE_LOCALIZACAO in armazenamento.dados, false);
  assert.doesNotThrow(() => salvarLocalizacao({ origem: "gps", latitude: 1, longitude: 1 }, { setItem: () => { throw new Error("cheio"); } }));
});

test("rotuloLocalizacao: escolhida > cidade do perfil > Definir localização", () => {
  assert.equal(rotuloLocalizacao({ localizacao: { origem: "busca", cidade: "Cotia", uf: "SP", latitude: 1, longitude: 1 } }), "Cotia - SP");
  assert.equal(rotuloLocalizacao({ localizacao: { origem: "gps", latitude: 1, longitude: 1 } }), "Perto de você");
  assert.equal(rotuloLocalizacao({ localizacao: null, usuario: { cidade: "Carapicuíba", uf: "SP" } }), "Carapicuíba - SP");
  assert.equal(rotuloLocalizacao({ localizacao: null, usuario: null }), "Definir localização");
});

test("mensagemErroGeolocalizacao cobre permissão negada, indisponível e demora", () => {
  assert.match(mensagemErroGeolocalizacao({ code: 1 }), /não permitiu/);
  assert.match(mensagemErroGeolocalizacao({ code: 2 }), /não conseguimos/i);
  assert.match(mensagemErroGeolocalizacao({ code: 3 }), /demorou/i);
  assert.match(mensagemErroGeolocalizacao(null), /não oferece/);
});
