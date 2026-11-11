import { getMediaUrl, IMAGEM_PADRAO_PRODUTO } from "@/services/mediaUrl";
import {
  ArrowRight,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import { formatarMoeda } from "../../../utils/formatadores";

/** Prévia do carrinho aberta pelo long press em "Carrinho". */
export default function MiniCarrinho({
  carrinho,
  aumentarQuantidade,
  diminuirQuantidade,
  removerItem,
  onVerCarrinho,
}) {
  const carrinhoTemItens = carrinho.itens.length > 0;

  return (
    <div
      className="
        absolute
        bottom-full
        left-1/2
        -translate-x-1/2
        w-[285px]
        mb-3
        bg-white
        border
        border-gray-200
        rounded-2xl
        shadow-xl
        p-2.5
      "
    >
      {carrinhoTemItens ? (
        <>
          <div className="px-1 pb-2">
            <p className="text-sm font-bold text-gray-800">
              Seu carrinho
            </p>

            <p className="text-[10px] text-gray-400">
              {carrinho.itens.length}{" "}
              {carrinho.itens.length ===
              1
                ? "item"
                : "itens"}
            </p>
          </div>

          <div
            className="
              space-y-2
              max-h-[225px]
              overflow-y-auto
              pr-0.5
            "
          >
            {carrinho.itens.map(
              (item) => {
                const imagem = getMediaUrl(
                  item.imagem,
                  IMAGEM_PADRAO_PRODUTO
                );

                return (
                  <div
                    key={
                      item.item_id
                    }
                    className="
                      bg-gray-50
                      border
                      border-gray-100
                      rounded-xl
                      p-2
                    "
                  >
                    <div className="flex gap-2">
                      <div
                        className="
                          shrink-0
                          w-12
                          h-12
                          rounded-lg
                          overflow-hidden
                          bg-white
                          border
                          border-gray-100
                          flex
                          items-center
                          justify-center
                        "
                      >
                        {imagem ? (
                          <img
                            src={
                              imagem
                            }
                            alt={item.nome_item || "Produto"}
                            className="
                              w-full
                              h-full
                              object-cover
                            "
                          />
                        ) : (
                          <Package className="w-5 h-5 text-gray-300" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className="
                            text-xs
                            font-semibold
                            text-gray-700
                            truncate
                          "
                        >
                          {item.nome_item || "Produto"}
                        </p>

                        {item.loja_nome && (
                          <p className="text-[10px] text-gray-400 truncate">
                            {item.loja_nome}
                          </p>
                        )}

                        <p className="text-xs font-bold text-[#0E5617] mt-0.5">
                          {formatarMoeda(item.preco_unitario)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removerItem(
                            item.item_id
                          )
                        }
                        aria-label={`Remover ${item.nome || "produto"}`}
                        className="
                          shrink-0
                          w-7
                          h-7
                          flex
                          items-center
                          justify-center
                          rounded-full
                          text-gray-400
                          hover:bg-red-50
                          hover:text-red-600
                          transition-colors
                        "
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-gray-400">
                        Quantidade
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            diminuirQuantidade(
                              item.item_id
                            )
                          }
                          className="
                            w-6
                            h-6
                            flex
                            items-center
                            justify-center
                            rounded-full
                            border
                            border-gray-200
                            bg-white
                            text-gray-600
                            hover:bg-green-50
                            hover:text-[#0E5617]
                          "
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="w-6 text-center text-xs font-bold text-gray-700">
                          {
                            item.quantidade
                          }
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            aumentarQuantidade(
                              item.item_id
                            )
                          }
                          className="
                            w-6
                            h-6
                            flex
                            items-center
                            justify-center
                            rounded-full
                            border
                            border-gray-200
                            bg-white
                            text-gray-600
                            hover:bg-green-50
                            hover:text-[#0E5617]
                          "
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <button
            type="button"
            onClick={onVerCarrinho}
            className="
              mt-2
              w-full
              flex
              items-center
              justify-center
              gap-2
              bg-[#0E5617]
              text-white
              rounded-xl
              py-2.5
              text-xs
              font-semibold
              hover:bg-[#0a4211]
              transition-colors
            "
          >
            Ver carrinho
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      ) : (
        <div className="px-4 py-5 text-center">
          <ShoppingCart className="w-7 h-7 mx-auto text-gray-300 mb-2" />

          <p className="text-xs font-semibold text-gray-600">
            Seu carrinho está vazio
          </p>

          <p className="text-[10px] text-gray-400 mt-1">
            Adicione produtos para
            começar.
          </p>
        </div>
      )}
    </div>
  );
}
