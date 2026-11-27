import { normalizarTexto } from "./formatadores.js";
// Ilustrações para pet sem foto (arquivos leves em public/images).
const IMAGEM_PADRAO_PET = "/images/pet-padrao.webp";
const IMAGEM_PADRAO_PET_GATO = "/images/pet-padrao-gato.webp";


/** Ilustração do pet sem foto: gato quando a espécie (texto livre) é gato/felino; senão, cachorro. */
export function imagemPadraoPet(especie) {
  const texto = typeof especie === "string" ? normalizarTexto(especie) : "";
  return /gat|felin/.test(texto) ? IMAGEM_PADRAO_PET_GATO : IMAGEM_PADRAO_PET;
}

function capitalizar(texto) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
}

/** Linha "Espécie · Raça" do cartão do pet (o que estiver preenchido). */
export function descricaoPet(pet) {
  return [pet?.especie, pet?.raca]
    .map((valor) => capitalizar(String(valor ?? "").trim()))
    .filter(Boolean)
    .join(" · ");
}

/** Idade do pet para exibir: número vira "1 ano"/"10 anos"; texto livre fica como veio. */
export function idadePet(idade) {
  const texto = String(idade ?? "").trim();
  if (!texto) return "Não informada";
  if (!/^\d+$/.test(texto)) return texto;
  return Number(texto) === 1 ? "1 ano" : `${Number(texto)} anos`;
}
