import { normalizarTexto } from "./formatadores.js";
// Ilustrações para pet sem foto (arquivos leves em public/images).
const IMAGEM_PADRAO_PET = "/images/pet-padrao.webp";
const IMAGEM_PADRAO_PET_GATO = "/images/pet-padrao-gato.webp";


/** Ilustração do pet sem foto: gato quando a espécie (texto livre) é gato/felino; senão, cachorro. */
export function imagemPadraoPet(especie) {
  const texto = typeof especie === "string" ? normalizarTexto(especie) : "";
  return /gat|felin/.test(texto) ? IMAGEM_PADRAO_PET_GATO : IMAGEM_PADRAO_PET;
}

// Compara com o catálogo sem diferenciar maiúsculas, acentos e espaços (como a API).
function chaveCatalogo(texto) {
  return normalizarTexto(String(texto ?? "")).trim().replace(/s+/g, " ");
}

/** Espécie do catálogo (GET /pets/opcoes) correspondente ao texto salvo, ou null. */
export function especieDoCatalogo(especies, texto) {
  const alvo = chaveCatalogo(texto);
  return (especies || []).find((especie) => chaveCatalogo(especie.nome) === alvo) || null;
}

/** Raça como está no catálogo, se pertence à espécie, ou null. */
export function racaDoCatalogo(especie, texto) {
  const alvo = chaveCatalogo(texto);
  return especie?.racas.find((raca) => chaveCatalogo(raca) === alvo) || null;
}

/**
 * Valores iniciais do formulário do pet. Espécie e raça salvas antes do catálogo (texto livre)
 * são aproveitadas quando batem com ele; senão ficam em branco para o usuário escolher,
 * e `racaAnterior` guarda o texto antigo para mostrar como referência.
 */
export function valoresIniciaisPet(pet, especies) {
  const especie = especieDoCatalogo(especies, pet?.especie);
  const raca = racaDoCatalogo(especie, pet?.raca);
  const racaSalva = String(pet?.raca ?? "").trim();
  return {
    nome: pet?.nome ?? "",
    especie: especie?.nome ?? "",
    raca: raca ?? "",
    fase_vida: pet?.fase_vida ?? "",
    racaAnterior: !raca && racaSalva ? racaSalva : null,
  };
}

/** Nome da fase de vida ("Adulto") pelo id salvo; vazio sem fase ou sem catálogo. */
export function rotuloFaseVida(fases, id) {
  return (fases || []).find((fase) => fase.id === id)?.rotulo ?? "";
}
