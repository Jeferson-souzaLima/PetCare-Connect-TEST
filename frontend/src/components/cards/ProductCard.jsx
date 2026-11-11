import { getMediaUrl, IMAGEM_PADRAO_LOJA, IMAGEM_PADRAO_PRODUTO } from "@/services/mediaUrl";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Check } from "lucide-react";
import { FavoriteButton } from "../ui/FavoriteButton";
import { useCarrinho } from "../../context/CarrinhoContext";

export function ProductCard({
  produto,
  className = "",
}) {
  const { adicionarItem } = useCarrinho();

  const [adicionado, setAdicionado] = useState(false);

  const imagemProduto = getMediaUrl(
    produto.imagens?.[0]?.caminho,
    IMAGEM_PADRAO_PRODUTO
  );

  const logoLoja = getMediaUrl(produto.loja?.logo, IMAGEM_PADRAO_LOJA);

  const precoFormatado = Number(produto.preco || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );

  function handleAdicionarAoCarrinho() {
    if (!produto?.loja?.id || !produto?.id) {
      return;
    }

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

    if (!entrou) return;

    setAdicionado(true);

    setTimeout(() => {
      setAdicionado(false);
    }, 2500);
  }

  return (
    <>
      <article
        className={`
          bg-white
          rounded-xl
          shadow-sm
          hover:shadow-md
          transition
          overflow-hidden
          flex
          flex-col
          relative
          h-full
          ${className}
        `}
      >
        {/* Favorito */}
        <FavoriteButton
          tipo="produto"
          referenciaId={produto.id}
          className="absolute top-3 right-3 z-20"
        />

        {/* Produto */}
        <Link
          to={`/produtos/${produto.id}`}
          className="flex flex-col flex-1"
        >
          {/* Imagem */}
          <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
            <img
              src={imagemProduto}
              alt={produto.nome}
              className="w-full h-full object-contain p-3"
            />
          </div>

          {/* Conteúdo */}
          <div className="p-3 flex flex-col flex-1">
            {/* Nome */}
            <p className="font-semibold text-sm text-gray-800 line-clamp-2 min-h-[40px]">
              {produto.nome}
            </p>

            {/* Loja */}
            <div className="flex items-center gap-2 mt-2 min-w-0">
              <img
                src={logoLoja}
                className="w-6 h-6 rounded-full object-cover shrink-0"
                alt={`Logo da ${produto.loja?.nome || "Loja"}`}
              />

              <span className="text-xs text-gray-600 truncate">
                {produto.loja?.nome}
              </span>
            </div>
          </div>
        </Link>

        {/* Preço + Carrinho */}
        <div className="px-3 pb-3 pt-0 flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-[#0E5617]">
            {precoFormatado}
          </span>

          <button
            type="button"
            onClick={handleAdicionarAoCarrinho}
            aria-label="Adicionar ao carrinho"
            title="Adicionar ao carrinho"
            className={`
              shrink-0
              w-10
              h-10
              rounded-xl
              flex
              items-center
              justify-center
              text-white
              shadow-sm
              active:scale-95
              transition-all
              ${
                adicionado
                  ? "bg-[#0E5617]"
                  : "bg-[#22A447] hover:bg-[#1D913D] hover:shadow-md"
              }
            `}
          >
            {adicionado ? (
              <Check className="w-5 h-5" />
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
          </button>
        </div>
      </article>

      {/* Feedback */}
      {adicionado && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[60]">
          <div className="flex items-center gap-3 bg-[#0E5617] text-white px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold whitespace-nowrap">
            <ShoppingCart className="w-5 h-5" />
            Produto adicionado ao carrinho
          </div>
        </div>
      )}
    </>
  );
}
