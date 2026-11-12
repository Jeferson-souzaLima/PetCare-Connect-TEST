import { useEffect, useRef, useState } from "react";
import { useCarrinho } from "@/context/CarrinhoContext";
import ToastCarrinho from "./mobile/ToastCarrinho";

const DURACAO_AVISO_MS = 2500;

/**
 * Mostra "Produto adicionado ao carrinho!" quando um item entra no carrinho.
 * Começa com o último item já existente: ao montar (por exemplo, ao trocar de página),
 * o aviso de um item antigo não reaparece.
 */
export function AvisoCarrinho() {
  const { ultimoItemAdicionado } = useCarrinho();
  const ultimoMostradoRef = useRef(ultimoItemAdicionado?.timestamp ?? null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const timestamp = ultimoItemAdicionado?.timestamp;
    if (!timestamp || ultimoMostradoRef.current === timestamp) return undefined;

    ultimoMostradoRef.current = timestamp;
    setVisivel(true);
    const id = setTimeout(() => setVisivel(false), DURACAO_AVISO_MS);
    return () => clearTimeout(id);
  }, [ultimoItemAdicionado]);

  return visivel ? <ToastCarrinho /> : null;
}
