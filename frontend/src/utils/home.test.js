import assert from "node:assert/strict";
import test from "node:test";
import { pedidosRecentes, proximosAgendamentos, rotuloLocalizacao, urlBanner } from "./home.js";

const AGORA = new Date("2026-11-11T12:00:00");

test("proximosAgendamentos: só futuros e ativos, em ordem de data, até 3", () => {
  const lista = [
    { id: 1, status: "confirmado", data_inicio: "2026-11-15T10:00:00" },
    { id: 2, status: "confirmado", data_inicio: "2026-11-10T10:00:00" }, // passado
    { id: 3, status: "cancelado", data_inicio: "2026-11-12T10:00:00" },
    { id: 4, status: "concluido", data_inicio: "2026-11-13T10:00:00" },
    { id: 5, status: "aguardando_pagamento", data_inicio: "2026-11-12T09:00:00" },
    { id: 6, status: "confirmado", data_inicio: null },
    { id: 7, status: "confirmado", data_inicio: "data-invalida" },
    { id: 8, status: "confirmado", data_inicio: "2026-11-20T10:00:00" },
    { id: 9, status: "confirmado", data_inicio: "2026-11-30T10:00:00" },
  ];
  assert.deepEqual(proximosAgendamentos(lista, AGORA).map((a) => a.id), [5, 1, 8]);
  assert.deepEqual(proximosAgendamentos(lista, AGORA, 10).map((a) => a.id), [5, 1, 8, 9]);
});

test("proximosAgendamentos: lista ausente ou que não é array vira lista vazia", () => {
  assert.deepEqual(proximosAgendamentos(undefined, AGORA), []);
  assert.deepEqual(proximosAgendamentos({ erro: true }, AGORA), []);
});

test("pedidosRecentes: mais recentes primeiro, até 3", () => {
  const lista = [
    { id: 1, data_pedido: "2026-11-01T10:00:00" },
    { id: 2, data_pedido: "2026-11-09T10:00:00" },
    { id: 3, data_pedido: "2026-11-05T10:00:00" },
    { id: 4, data_pedido: "2026-11-07T10:00:00" },
  ];
  assert.deepEqual(pedidosRecentes(lista).map((p) => p.id), [2, 4, 3]);
  assert.deepEqual(pedidosRecentes(null), []);
});

test("rotuloLocalizacao: cidade do perfil, perto de você ou definir localização", () => {
  assert.deepEqual(rotuloLocalizacao({ usuario: { tipo: "cliente", cidade: "Cotia", uf: "SP" }, coords: null }), {
    texto: "Cotia - SP",
    destino: null,
  });
  assert.deepEqual(rotuloLocalizacao({ usuario: null, coords: { latitude: -23.6, longitude: -46.9 } }), {
    texto: "Perto de você",
    destino: null,
  });
  assert.deepEqual(rotuloLocalizacao({ usuario: { tipo: "cliente" }, coords: null }), {
    texto: "Definir localização",
    destino: "/perfil",
  });
  assert.deepEqual(rotuloLocalizacao({ usuario: null, coords: null }), {
    texto: "Definir localização",
    destino: "/login",
  });
});

test("urlBanner: monta a URL do R2 e devolve null sem VITE_MEDIA_URL", () => {
  assert.equal(urlBanner("hero-pets-mobile.webp", "https://cdn.x/"), "https://cdn.x/banners/home/hero-pets-mobile.webp");
  assert.equal(urlBanner("promo-1-desktop.webp", "https://cdn.x"), "https://cdn.x/banners/home/promo-1-desktop.webp");
  assert.equal(urlBanner("hero-pets-mobile.webp", undefined), null);
  assert.equal(urlBanner("hero-pets-mobile.webp", "   "), null);
  assert.equal(urlBanner("", "https://cdn.x"), null);
});
