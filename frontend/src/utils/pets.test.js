import test from "node:test";
import assert from "node:assert/strict";
import { especieDoCatalogo, imagemPadraoPet, racaDoCatalogo, rotuloFaseVida, valoresIniciaisPet } from "./pets.js";

test("imagemPadraoPet: gato ganha a ilustração do gato; o resto, a do cachorro", () => {
  for (const especie of ["Gato", "gata", "GATINHO", "Felino", "felina"]) assert.equal(imagemPadraoPet(especie), "/images/pet-padrao-gato.webp", especie);
  for (const especie of ["Cachorro", "cão", "Pássaro", "", undefined, null]) assert.equal(imagemPadraoPet(especie), "/images/pet-padrao.webp", String(especie));
});

const ESPECIES = [
  { nome: "Cachorro", racas: ["Sem raça definida (vira-lata)", "Pug"] },
  { nome: "Gato", racas: ["Sem raça definida (vira-lata)", "Siamês"] },
];

test("valoresIniciaisPet: aproveita o que bate com o catálogo e guarda a raça antiga que não bate", () => {
  assert.deepEqual(valoresIniciaisPet({ nome: "Mia", especie: "gato", raca: "siames", fase_vida: "filhote" }, ESPECIES), {
    nome: "Mia", especie: "Gato", raca: "Siamês", fase_vida: "filhote", racaAnterior: null,
  });
  assert.deepEqual(valoresIniciaisPet({ nome: "Felina", especie: "Gato", raca: "Goldin" }, ESPECIES), {
    nome: "Felina", especie: "Gato", raca: "", fase_vida: "", racaAnterior: "Goldin",
  });
  assert.deepEqual(valoresIniciaisPet(null, ESPECIES), { nome: "", especie: "", raca: "", fase_vida: "", racaAnterior: null });
  assert.equal(especieDoCatalogo(ESPECIES, "Dinossauro"), null);
  assert.equal(racaDoCatalogo(ESPECIES[1], "Pug"), null, "raça de outra espécie");
});

test("rotuloFaseVida", () => {
  const fases = [{ id: "adulto", rotulo: "Adulto" }];
  assert.equal(rotuloFaseVida(fases, "adulto"), "Adulto");
  assert.equal(rotuloFaseVida(fases, null), "");
  assert.equal(rotuloFaseVida(null, "adulto"), "");
});
