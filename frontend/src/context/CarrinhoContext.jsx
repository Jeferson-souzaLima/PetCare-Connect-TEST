import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CARRINHO_VAZIO, calcularTotal, incluirItem } from "@/utils/carrinho";

const CarrinhoContext = createContext();

export function CarrinhoProvider({ children }) {
  const [carrinho, setCarrinhoEstado] = useState(CARRINHO_VAZIO);
  // Cópia síncrona do carrinho: dois cliques antes de a tela atualizar partem do estado
  // mais recente, e não do que estava desenhado.
  const carrinhoRef = useRef(CARRINHO_VAZIO);

  const [ultimoItemAdicionado, setUltimoItemAdicionado] = useState(null);

  const setCarrinho = useCallback((atualizar) => {
    const novo = typeof atualizar === "function" ? atualizar(carrinhoRef.current) : atualizar;
    carrinhoRef.current = novo;
    setCarrinhoEstado(novo);
  }, []);

  /** Devolve true só quando o item entrou no carrinho; quem chama mostra o aviso a partir disso. */
  function adicionarItem(novoItem) {
    const resultado = incluirItem(carrinhoRef.current, novoItem);

    if (!resultado.ok) {
      if (resultado.motivo === "outra_loja") {
        alert("Você só pode comprar de uma loja por vez");
      }
      return false;
    }

    setCarrinho(resultado.carrinho);
    setUltimoItemAdicionado({
      id: novoItem.item_id,
      nome: novoItem.nome_item,
      timestamp: Date.now(),
    });
    return true;
  }

  function aumentarQuantidade(item_id) {
    setCarrinho((prev) => {
      const itens = prev.itens.map((item) =>
        item.item_id === item_id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      );

      return {
        ...prev,
        itens,
        total: calcularTotal(itens),
      };
    });
  }

  function diminuirQuantidade(item_id) {
    setCarrinho((prev) => {
      const itens = prev.itens
        .map((item) =>
          item.item_id === item_id
            ? {
                ...item,
                quantidade: item.quantidade - 1,
              }
            : item
        )
        .filter((item) => item.quantidade > 0);

      return {
        ...prev,
        loja_id: itens.length ? prev.loja_id : null,
        itens,
        total: calcularTotal(itens),
      };
    });
  }

  function removerItem(item_id) {
    setCarrinho((prev) => {
      const itens = prev.itens.filter(
        (item) => item.item_id !== item_id
      );

      return {
        loja_id: itens.length ? prev.loja_id : null,
        itens,
        total: calcularTotal(itens),
      };
    });
  }

  function limparCarrinho() {
    setCarrinho(CARRINHO_VAZIO);
  }

  return (
    <CarrinhoContext.Provider
      value={{
        carrinho,
        adicionarItem,
        aumentarQuantidade,
        diminuirQuantidade,
        removerItem,
        limparCarrinho,
        ultimoItemAdicionado,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  return useContext(CarrinhoContext);
}