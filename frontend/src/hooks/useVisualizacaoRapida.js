import { useState } from "react";
import { useMediaQuery } from "./useMediaQuery";

/**
 * No desktop (a partir de 1024 px), o clique num produto abre a visualização rápida sobre a
 * página. No celular, Ctrl/Cmd+clique ou botão do meio, o link segue para a página do produto.
 * `aoClicarProduto` devolve true quando abriu a janela (útil em botões, que navegam por conta própria).
 */
export function useVisualizacaoRapida() {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [produtoId, setProdutoId] = useState(null);

  function aoClicarProduto(evento, id) {
    const cliqueSimples = evento.button === 0 && !evento.metaKey && !evento.ctrlKey && !evento.shiftKey && !evento.altKey;
    if (!desktop || !cliqueSimples || evento.defaultPrevented || id == null) return false;
    evento.preventDefault();
    setProdutoId(id);
    return true;
  }

  return { produtoId, aoClicarProduto, fechar: () => setProdutoId(null) };
}
