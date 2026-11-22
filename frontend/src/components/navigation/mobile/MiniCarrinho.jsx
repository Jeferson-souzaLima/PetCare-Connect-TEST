import { Link } from "react-router-dom";
import { ArrowRight, Minus, Package, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCarrinho } from "@/context/CarrinhoContext";
import { getMediaUrl } from "@/services/mediaUrl";
import { formatarMoeda } from "@/utils/formatadores";
import { unidadesNoCarrinho } from "@/utils/navegacaoInferior";

const BOTAO_QTD =
  "flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-pc-texto hover:bg-pc-verde-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700";

function ItemMiniCarrinho({ item, aumentar, diminuir, remover }) {
  const imagem = getMediaUrl(item.imagem);
  const nome = item.nome_item || "Produto";

  return (
    <li className="flex gap-3 rounded-2xl bg-pc-fundo p-2.5">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
        {imagem ? <img src={imagem} alt="" className="h-full w-full object-contain" /> : <Package size={22} aria-hidden="true" className="text-pc-verde-700/40" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="line-clamp-2 flex-1 text-sm font-semibold leading-tight text-pc-texto">{nome}</p>
          <button
            type="button"
            onClick={() => remover(item.item_id)}
            aria-label={`Remover ${nome} do carrinho`}
            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-pc-texto-suave hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => diminuir(item.item_id)} aria-label={`Diminuir quantidade de ${nome}`} className={BOTAO_QTD}>
              <Minus size={14} aria-hidden="true" />
            </button>
            <span className="w-6 text-center text-sm font-bold" aria-label={`Quantidade: ${item.quantidade}`}>
              {item.quantidade}
            </span>
            <button type="button" onClick={() => aumentar(item.item_id)} aria-label={`Aumentar quantidade de ${nome}`} className={BOTAO_QTD}>
              <Plus size={14} aria-hidden="true" />
            </button>
          </div>
          <span className="text-sm font-bold text-pc-verde-900">{formatarMoeda(Number(item.preco_unitario || 0) * item.quantidade)}</span>
        </div>
      </div>
    </li>
  );
}

/** Mini carrinho da barra inferior: edita o carrinho sem sair da página; "Finalizar compra" leva ao carrinho completo. */
export function MiniCarrinho({ aoFechar }) {
  const { carrinho, aumentarQuantidade, diminuirQuantidade, removerItem } = useCarrinho();
  const unidades = unidadesNoCarrinho(carrinho);

  if (!carrinho.itens.length) {
    return (
      <div className="px-4 py-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pc-verde-100 text-pc-verde-700">
          <ShoppingCart size={24} aria-hidden="true" />
        </span>
        <p className="mt-3 text-sm font-bold text-pc-texto">Seu carrinho ainda está vazio</p>
        <p className="mt-1 text-xs text-pc-texto-suave">Que tal escolher um mimo para o seu pet?</p>
        <Link
          to="/produtos"
          onClick={aoFechar}
          className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-pc-pill bg-pc-verde-700 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-900 focus-visible:ring-offset-2"
        >
          Ver produtos
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const nomeLoja = carrinho.itens[0]?.loja_nome;

  return (
    <div className="flex max-h-[inherit] flex-col">
      <div className="flex items-baseline justify-between gap-2 px-2 pb-2 pt-1">
        <p className="text-base font-bold text-pc-texto">Seu carrinho</p>
        <p className="text-xs text-pc-texto-suave">
          {unidades} {unidades === 1 ? "item" : "itens"}
          {nomeLoja ? ` · ${nomeLoja}` : ""}
        </p>
      </div>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-1">
        {carrinho.itens.map((item) => (
          <ItemMiniCarrinho key={item.item_id} item={item} aumentar={aumentarQuantidade} diminuir={diminuirQuantidade} remover={removerItem} />
        ))}
      </ul>
      <div className="mt-2 border-t border-black/5 px-2 pt-3">
        <p className="flex items-center justify-between text-sm">
          <span className="text-pc-texto-suave">Subtotal</span>
          <span className="text-lg font-bold text-pc-verde-900">{formatarMoeda(carrinho.total)}</span>
        </p>
        <Link
          to="/carrinho"
          onClick={aoFechar}
          className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-pc-pill bg-pc-verde-700 text-sm font-bold text-white hover:bg-pc-verde-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-900 focus-visible:ring-offset-2"
        >
          Finalizar compra
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
