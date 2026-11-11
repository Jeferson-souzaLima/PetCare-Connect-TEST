import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Package, ShoppingCart } from "lucide-react";
import { useCarrinho } from "@/context/CarrinhoContext";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { getMediaUrl } from "@/services/mediaUrl";
import { formatarMoeda } from "@/utils/formatadores";

/** Card de produto da vitrine. Favorito só para quem está logado (evita 401 de visitante). */
export function ProdutoCardHome({ produto, logado }) {
  const { adicionarItem } = useCarrinho();
  const [adicionado, setAdicionado] = useState(false);
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const imagem = getMediaUrl(produto.imagens?.[0]?.caminho);
  const podeComprar = Boolean(produto?.id && produto?.loja?.id);

  useEffect(() => {
    if (!adicionado) return undefined;
    const id = setTimeout(() => setAdicionado(false), 2500);
    return () => clearTimeout(id);
  }, [adicionado]);

  function adicionar() {
    if (!podeComprar) return;
    // Mesmo formato de item usado pelo ProductCard.
    const entrou = adicionarItem({
      tipo: "produto",
      item_id: produto.id,
      nome_item: produto.nome,
      preco_unitario: produto.preco,
      quantidade: 1,
      loja_id: produto.loja.id,
      loja_nome: produto.loja.nome,
      imagem: produto.imagens?.[0]?.caminho || null,
    });
    if (entrou) setAdicionado(true);
  }

  return (
    <article className="relative flex h-full flex-col rounded-pc-card bg-white p-3 shadow-pc-card">
      {logado && <FavoriteButton tipo="produto" referenciaId={produto.id} className="absolute right-2 top-2 z-10" />}
      <Link to={`/produtos/${produto.id}`} className="flex flex-1 flex-col rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-verde-700/40">
        <span className="flex h-28 items-center justify-center">
          {imagem && !imagemFalhou ? (
            <img src={imagem} alt="" loading="lazy" className="h-full w-full object-contain" onError={() => setImagemFalhou(true)} />
          ) : (
            <Package size={40} aria-hidden="true" className="text-pc-verde-700/40" />
          )}
        </span>
        <span className="mt-2 line-clamp-2 text-sm font-semibold text-pc-texto">{produto.nome}</span>
        {produto.loja?.nome && <span className="mt-0.5 truncate text-xs text-pc-texto-suave">{produto.loja.nome}</span>}
      </Link>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-base font-bold text-pc-verde-900">{formatarMoeda(produto.preco)}</span>
        <button
          type="button"
          onClick={adicionar}
          disabled={!podeComprar}
          aria-label={adicionado ? `${produto.nome} adicionado ao carrinho` : `Adicionar ${produto.nome} ao carrinho`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pc-verde-700 text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-900 focus-visible:ring-offset-2"
        >
          {adicionado ? <Check size={20} aria-hidden="true" /> : <ShoppingCart size={20} aria-hidden="true" />}
        </button>
      </div>
      <span className="sr-only" aria-live="polite">{adicionado ? "Produto adicionado ao carrinho." : ""}</span>
    </article>
  );
}
