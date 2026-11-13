import { API_URL } from "@/services/apiUrl";

/** Imagens usadas quando o produto, a loja ou o pet não têm foto (arquivos leves em public/images). */
export const IMAGEM_PADRAO_PRODUTO = "/images/produto-padrao.svg";
export const IMAGEM_PADRAO_LOJA = "/images/loja-padrao.svg";
export const IMAGEM_PADRAO_PET = "/images/pet-padrao.webp";

/** Resolves both legacy API paths (/uploads/...) and absolute object-storage URLs. */
export function getMediaUrl(value, fallback = "") {
  if (typeof value !== "string" || !value.trim()) return fallback;

  const mediaPath = value.trim();
  if (/^(?:https?:)?\/\//i.test(mediaPath) || /^(?:data:|blob:)/i.test(mediaPath)) {
    return mediaPath;
  }

  if (mediaPath.startsWith("/images/")) return mediaPath;

  return `${API_URL}/${mediaPath.replace(/^\/+/, "")}`;
}
