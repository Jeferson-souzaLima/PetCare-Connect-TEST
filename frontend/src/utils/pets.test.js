import test from "node:test";
import assert from "node:assert/strict";
import { imagemPadraoPet } from "./pets.js";

test("imagemPadraoPet: gato ganha a ilustração do gato; o resto, a do cachorro", () => {
  for (const especie of ["Gato", "gata", "GATINHO", "Felino", "felina"]) assert.equal(imagemPadraoPet(especie), "/images/pet-padrao-gato.webp", especie);
  for (const especie of ["Cachorro", "cão", "Pássaro", "", undefined, null]) assert.equal(imagemPadraoPet(especie), "/images/pet-padrao.webp", String(especie));
});
