/*
 * A API aceita só JPG ou PNG de verdade, até 5 MB. Fotos de celular, do
 * WhatsApp ou de geradores de imagem costumam vir em WEBP (às vezes com nome
 * .jpg), HEIC ou maiores que isso. Antes de enviar, o navegador converte o que
 * conseguir abrir para JPG e reduz o tamanho.
 */

export const LIMITE_BYTES = 5 * 1024 * 1024;
const LADO_MAXIMO = 2000;
const QUALIDADE_JPG = 0.88;

/** "jpeg" | "png" | null, pelo conteúdo real do arquivo (e não pelo nome). */
export function formatoPeloConteudo(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  const png = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length >= 8 && png.every((valor, i) => bytes[i] === valor)) return "png";
  return null;
}

/** Arquivo que a API aceita sem conversão. */
export function aceitoSemConverter(formato, tamanho) {
  return formato !== null && tamanho <= LIMITE_BYTES;
}

/** Medidas que cabem em LADO_MAXIMO, mantendo a proporção. */
export function medidasReduzidas(largura, altura, ladoMaximo = LADO_MAXIMO) {
  const escala = Math.min(1, ladoMaximo / Math.max(largura, altura));
  return { largura: Math.round(largura * escala), altura: Math.round(altura * escala) };
}

async function abrirImagem(arquivo) {
  try {
    return await createImageBitmap(arquivo);
  } catch {
    throw new Error("Não foi possível abrir esta imagem. Use uma foto em JPG ou PNG.");
  }
}

/**
 * Devolve um arquivo pronto para envio: o próprio, se já for JPG/PNG de até
 * 5 MB; senão, uma cópia em JPG (fundo branco, no máximo 2000 px de lado).
 */
export async function prepararImagem(arquivo) {
  const cabecalho = new Uint8Array(await arquivo.slice(0, 8).arrayBuffer());
  const formato = formatoPeloConteudo(cabecalho);

  if (aceitoSemConverter(formato, arquivo.size)) {
    // Garante o tipo certo mesmo quando o nome engana (ex.: PNG salvo como .jpg).
    const tipo = formato === "png" ? "image/png" : "image/jpeg";
    return arquivo.type === tipo ? arquivo : new File([arquivo], trocarExtensao(arquivo.name, formato === "png" ? "png" : "jpg"), { type: tipo });
  }

  const imagem = await abrirImagem(arquivo);
  const { largura, altura } = medidasReduzidas(imagem.width, imagem.height);
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const contexto = canvas.getContext("2d");
  contexto.fillStyle = "#ffffff";
  contexto.fillRect(0, 0, largura, altura);
  contexto.drawImage(imagem, 0, 0, largura, altura);
  imagem.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALIDADE_JPG));
  if (!blob || blob.size > LIMITE_BYTES) {
    throw new Error("Não foi possível preparar esta imagem. Tente outra foto.");
  }
  return new File([blob], trocarExtensao(arquivo.name, "jpg"), { type: "image/jpeg" });
}

/** Prepara várias imagens (ex.: fotos de um produto). */
export function prepararImagens(arquivos) {
  return Promise.all(Array.from(arquivos).map(prepararImagem));
}

export function trocarExtensao(nome, extensao) {
  const base = String(nome || "imagem").replace(/\.[^./\\]+$/, "") || "imagem";
  return `${base}.${extensao}`;
}
