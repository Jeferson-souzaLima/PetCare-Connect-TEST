// Regras puras do carrinho (sem React), testadas em carrinho.test.js.

export const CARRINHO_VAZIO = Object.freeze({ loja_id: null, itens: [], total: 0 });

const mesmoId = (a, b) => a != null && b != null && String(a) === String(b);

export function calcularTotal(itens) {
  return itens.reduce((acc, item) => acc + Number(item.preco_unitario || 0) * item.quantidade, 0);
}

/**
 * Inclui um item no carrinho. O mesmo item soma a quantidade; item de outra loja é recusado.
 * Devolve { ok, motivo, carrinho } — com ok=false o carrinho volta exatamente como estava.
 */
export function incluirItem(carrinho, novoItem) {
  const quantidade = Number(novoItem?.quantidade);
  if (!novoItem?.item_id || !novoItem?.loja_id || !Number.isInteger(quantidade) || quantidade < 1) {
    return { ok: false, motivo: "invalido", carrinho };
  }
  if (carrinho.loja_id != null && !mesmoId(carrinho.loja_id, novoItem.loja_id)) {
    return { ok: false, motivo: "outra_loja", carrinho };
  }

  const existe = carrinho.itens.some((item) => mesmoId(item.item_id, novoItem.item_id));
  const itens = existe
    ? carrinho.itens.map((item) =>
        mesmoId(item.item_id, novoItem.item_id) ? { ...item, quantidade: item.quantidade + quantidade } : item
      )
    : [...carrinho.itens, { ...novoItem, quantidade }];

  return {
    ok: true,
    motivo: null,
    carrinho: { loja_id: carrinho.loja_id ?? novoItem.loja_id, itens, total: calcularTotal(itens) },
  };
}
