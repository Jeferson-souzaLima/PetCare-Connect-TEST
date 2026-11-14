import { urlMidiaSite } from "./home.js";

/**
 * Palavras que definem o tipo do serviço pelo nome. São as mesmas do filtro por tipo da API
 * (backend utils/filtrosCatalogo.js); um teste do backend garante que as duas listas não se separem.
 */
export const PALAVRAS_POR_TIPO_SERVICO = {
  banho_tosa: ["banho", "tosa", "hidrata", "escova"],
  saude: ["vacin", "veterin", "consulta", "microchip", "exame", "castra", "vermif"],
};

/** Passeio não é tipo do filtro (cai em "outros"), mas tem foto própria. */
const PALAVRAS_PASSEIO = ["passeio", "passear", "caminhada", "dog walker"];

/** Imagens padrão dos serviços no R2 (site/servicos), com o enquadramento que mantém o rosto do animal. */
const IMAGENS_PADRAO = {
  banho: { alt: "Profissional secando um poodle branco depois do banho", foco: "object-[center_45%]" },
  tosa: { alt: "Profissional aparando o pelo da pata de um shih-tzu", foco: "object-[center_40%]" },
  vacina: { alt: "Veterinária vacinando um cachorro enquanto a tutora faz carinho", foco: "object-[center_60%]" },
  veterinario: { alt: "Veterinária examinando um filhote de labrador com o tutor ao lado", foco: "object-[center_60%]" },
  passeio: { alt: "Passeador caminhando no parque com três cachorros", foco: "object-[center_70%]" },
};

// Sem acento e em minúsculas, como a comparação do MySQL (collation *_ai_ci) no filtro da API.
const normalizar = (texto) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const contemAlguma = (nome, palavras) => palavras.some((palavra) => nome.includes(palavra));

/** "banho" | "tosa" | "vacina" | "veterinario" | "passeio" pelo nome do serviço, ou null quando o nome não se encaixa. */
export function tipoImagemServico(nome) {
  if (typeof nome !== "string" || !nome.trim()) return null;
  const texto = normalizar(nome);
  if (contemAlguma(texto, PALAVRAS_POR_TIPO_SERVICO.banho_tosa)) return texto.includes("banho") ? "banho" : "tosa";
  if (contemAlguma(texto, PALAVRAS_POR_TIPO_SERVICO.saude)) return texto.includes("vacin") ? "vacina" : "veterinario";
  if (contemAlguma(texto, PALAVRAS_PASSEIO)) return "passeio";
  return null;
}

/**
 * Imagem padrão do serviço (o serviço não tem foto própria): { celular, desktop, alt, foco },
 * ou null quando o nome não se encaixa ou sem VITE_MEDIA_URL.
 */
export function imagemPadraoServico(nome, base = import.meta.env?.VITE_MEDIA_URL) {
  const tipo = tipoImagemServico(nome);
  const celular = tipo && urlMidiaSite(`site/servicos/${tipo}-celular.webp`, base);
  if (!celular) return null;
  return { celular, desktop: urlMidiaSite(`site/servicos/${tipo}-desktop.webp`, base), ...IMAGENS_PADRAO[tipo] };
}
