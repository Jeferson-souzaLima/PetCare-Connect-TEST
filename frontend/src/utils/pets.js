import { normalizarTexto } from "./formatadores.js";
// Ilustrações para pet sem foto (arquivos leves em public/images).
const IMAGEM_PADRAO_PET = "/images/pet-padrao.webp";
const IMAGEM_PADRAO_PET_GATO = "/images/pet-padrao-gato.webp";


/** Ilustração do pet sem foto: gato quando a espécie (texto livre) é gato/felino; senão, cachorro. */
export function imagemPadraoPet(especie) {
  const texto = typeof especie === "string" ? normalizarTexto(especie) : "";
  return /gat|felin/.test(texto) ? IMAGEM_PADRAO_PET_GATO : IMAGEM_PADRAO_PET;
}
