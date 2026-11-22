// Regras da visualização rápida do produto e do "Leve também!" (sem React), testadas em produtoRapido.test.js.

const QUANTIDADE_MAXIMA_SEM_ESTOQUE = 99;

/** Item no formato do carrinho (CarrinhoContext), igual em todos os pontos de compra. */
export function itemDoCarrinho(produto, quantidade = 1) {
  return {
    tipo: "produto",
    item_id: produto.id,
    nome_item: produto.nome,
    preco_unitario: produto.preco,
    quantidade,
    loja_id: produto.loja?.id ?? produto.loja_id,
    loja_nome: produto.loja?.nome,
    imagem: produto.imagens?.[0]?.caminho || null,
  };
}

/** Estoque numérico, ou null quando a loja não informou. */
function estoqueDe(produto) {
  const valor = produto?.estoque;
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(0, Math.floor(numero)) : null;
}

export function disponivel(produto) {
  return estoqueDe(produto) !== 0;
}

/** Maior quantidade que dá para escolher (o estoque, quando informado). */
export function quantidadeMaxima(produto) {
  return estoqueDe(produto) ?? QUANTIDADE_MAXIMA_SEM_ESTOQUE;
}

/** Texto de disponibilidade: "Esgotado", "Últimas 3 unidades" ou "Em estoque". */
export function textoEstoque(produto) {
  const estoque = estoqueDe(produto);
  if (estoque === 0) return "Esgotado";
  if (estoque !== null && estoque <= 5) return estoque === 1 ? "Última unidade" : `Últimas ${estoque} unidades`;
  return "Em estoque";
}

/**
 * Sugestões do "Leve também!": outros produtos da mesma loja (o carrinho aceita uma loja por vez),
 * disponíveis e que ainda não estão no carrinho. Os que têm foto vêm primeiro.
 */
export function sugestoesLeveTambem(produtos, { produtoAtualId, idsNoCarrinho = [], limite = 3 } = {}) {
  if (!Array.isArray(produtos)) return [];
  const fora = new Set([produtoAtualId, ...idsNoCarrinho].map(String));

  return produtos
    .filter((p) => p?.id != null && !fora.has(String(p.id)) && disponivel(p) && Number(p.preco) > 0)
    .map((p, ordem) => ({ p, ordem, temFoto: p.imagens?.length ? 0 : 1 }))
    .sort((a, b) => a.temFoto - b.temFoto || a.ordem - b.ordem)
    .slice(0, limite)
    .map(({ p }) => p);
}

/** Soma dos preços (1 unidade de cada). */
export function somaPrecos(produtos) {
  return produtos.reduce((total, p) => total + (Number(p.preco) || 0), 0);
}
