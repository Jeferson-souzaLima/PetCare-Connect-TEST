import assert from "node:assert/strict";
import test from "node:test";
import { contadoresPerfil, iniciaisNome, numeroCard, primeiroNome, rotuloQuantidade } from "./perfil.js";
import { descricaoPet, idadePet } from "./pets.js";

test("iniciaisNome e primeiroNome", () => {
  assert.equal(iniciaisNome("Jeferson Souza Lima"), "JL");
  assert.equal(iniciaisNome("ana"), "A");
  assert.equal(iniciaisNome(""), "?");
  assert.equal(primeiroNome("  Jeferson Lima "), "Jeferson");
  assert.equal(primeiroNome(undefined), "");
});

test("contadoresPerfil: só agendamentos futuros e não encerrados; falha vira null", () => {
  const agora = new Date("2026-11-26T12:00:00Z");
  const agendamentos = [
    { status: "confirmado", data_inicio: "2026-12-01T10:00:00Z" },
    { status: "pendente", data_inicio: "2026-11-30T10:00:00Z" },
    { status: "cancelado_loja", data_inicio: "2026-12-02T10:00:00Z" },
    { status: "confirmado", data_inicio: "2026-11-01T10:00:00Z" },
    { status: "confirmado", data_inicio: "2026-12-03T10:00:00Z" },
    { status: "confirmado", data_inicio: "2026-12-04T10:00:00Z" },
  ];
  assert.deepEqual(contadoresPerfil({ favoritos: [1, 2], agendamentos, pedidos: [1, 2, 3], pets: [1] }, agora), {
    favoritos: 2, agendamentos: 4, pedidos: 3, pets: 1,
  });
  assert.deepEqual(contadoresPerfil({ favoritos: null, agendamentos: null, pedidos: undefined, pets: [] }, agora), {
    favoritos: null, agendamentos: null, pedidos: null, pets: 0,
  });
});

test("numeroCard e rotuloQuantidade", () => {
  assert.equal(numeroCard(3), "03");
  assert.equal(numeroCard(12), "12");
  assert.equal(numeroCard(0), "00");
  assert.equal(numeroCard(null), "–");
  assert.equal(rotuloQuantidade(1, "Pet cadastrado", "Pets cadastrados"), "Pet cadastrado");
  assert.equal(rotuloQuantidade(0, "Pet cadastrado", "Pets cadastrados"), "Pets cadastrados");
});

test("descricaoPet e idadePet", () => {
  assert.equal(descricaoPet({ especie: "gato", raca: "Goldin" }), "Gato · Goldin");
  assert.equal(descricaoPet({ especie: "Cachorro", raca: "" }), "Cachorro");
  assert.equal(descricaoPet({}), "");
  assert.equal(idadePet(10), "10 anos");
  assert.equal(idadePet("1"), "1 ano");
  assert.equal(idadePet("3 meses"), "3 meses");
  assert.equal(idadePet(null), "Não informada");
});
