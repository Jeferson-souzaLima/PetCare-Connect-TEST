import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Minus, Plus, ShoppingCart, Store, Truck } from "lucide-react";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { useCarrinho } from "@/context/CarrinhoContext";
import { useAuth } from "@/hooks/useAuth";
import { getMediaUrl, IMAGEM_PADRAO_LOJA } from "@/services/mediaUrl";
import { formatarMoeda } from "@/utils/formatadores";
import { disponivel, itemDoCarrinho, quantidadeMaxima, textoEstoque } from "@/utils/produtoRapido";

const BOTAO_QTD =
  "flex h-11 w-11 items-center justify-center text-pc-texto transition hover:bg-pc-verde-100 disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pc-verde-700";

function OpcaoRecebimento({ selecionada, indisponivel, icone: Icone, titulo, descricao, aoEscolher }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selecionada}
      disabled={indisponivel}
      onClick={aoEscolher}
      className={`relative flex min-h-[64px] items-center gap-3 rounded-2xl border-2 px-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        selecionada ? "border-pc-verde-700 bg-pc-verde-100/60" : "border-black/10 bg-white hover:border-pc-verde-700/40"
      }`}
    >
      <Icone size={24} aria-hidden="true" className="shrink-0 text-pc-verde-700" />
      <span className="min-w-0">
        <span className="block text-sm font-bold text-pc-texto">{titulo}</span>
        <span className="block text-xs text-pc-texto-suave">{descricao}</span>
      </span>
      {selecionada && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-pc-verde-700 text-white">
          <Check size={13} aria-hidden="true" />
        </span>
      )}
    </button>
  );
}

/** Nome, preço, quantidade, forma de receber, subtotal e "Adicionar ao carrinho". */
export function CompraProduto({ produto, tituloId, aoAdicionar, adicionado, aoFechar }) {
  const { usuario } = useAuth();
  const { adicionarItem, modalidadeEntrega, setModalidadeEntrega } = useCarrinho();
  const [quantidade, setQuantidade] = useState(1);
  const maximo = quantidadeMaxima(produto);
  const temEstoque = disponivel(produto);
  const fazEntrega = produto.loja?.entrega_ativa === true;
  const modalidade = fazEntrega ? modalidadeEntrega : "retirada";
  const preco = Number(produto.preco) || 0;

  function adicionar() {
    if (!temEstoque) return;
    if (modalidade !== modalidadeEntrega) setModalidadeEntrega(modalidade);
    if (adicionarItem(itemDoCarrinho(produto, quantidade))) aoAdicionar();
  }

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-start gap-3">
        <h2 id={tituloId} className="flex-1 text-2xl font-bold leading-tight text-pc-texto xl:text-[1.75rem]">
          {produto.nome}
        </h2>
        {usuario?.tipo === "cliente" && <FavoriteButton tipo="produto" referenciaId={produto.id} className="shrink-0" />}
      </div>

      <p className={`mt-2 inline-flex w-fit items-center rounded-pc-pill px-2.5 py-0.5 text-xs font-semibold ${temEstoque ? "bg-pc-verde-100 text-pc-verde-900" : "bg-red-50 text-red-700"}`}>
        {textoEstoque(produto)}
      </p>

      {produto.descricao && <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-pc-texto-suave">{produto.descricao}</p>}

      <p className="mt-4 text-[2rem] font-bold leading-none text-pc-verde-900">{formatarMoeda(preco)}</p>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <span className="text-sm font-semibold text-pc-texto" id={`${tituloId}-qtd`}>
          Quantidade
        </span>
        <div role="group" aria-labelledby={`${tituloId}-qtd`} className="inline-flex items-center overflow-hidden rounded-pc-pill border border-black/15 bg-white">
          <button type="button" onClick={() => setQuantidade((q) => Math.max(1, q - 1))} disabled={quantidade <= 1} aria-label="Diminuir quantidade" className={BOTAO_QTD}>
            <Minus size={16} aria-hidden="true" />
          </button>
          <span className="w-10 text-center text-base font-bold" aria-live="polite">
            {quantidade}
          </span>
          <button type="button" onClick={() => setQuantidade((q) => Math.min(maximo, q + 1))} disabled={!temEstoque || quantidade >= maximo} aria-label="Aumentar quantidade" className={BOTAO_QTD}>
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
        <p className="ml-auto text-sm text-pc-texto-suave">
          Subtotal <span className="text-lg font-bold text-pc-texto">{formatarMoeda(preco * quantidade)}</span>
        </p>
      </div>

      <div role="radiogroup" aria-label="Como você quer receber?" className="mt-5 grid grid-cols-2 gap-3">
        <OpcaoRecebimento
          selecionada={modalidade === "entrega"}
          indisponivel={!fazEntrega}
          icone={Truck}
          titulo="Entrega em casa"
          descricao={fazEntrega ? "Frete calculado no carrinho" : "Esta loja não entrega"}
          aoEscolher={() => setModalidadeEntrega("entrega")}
        />
        <OpcaoRecebimento
          selecionada={modalidade === "retirada"}
          icone={Store}
          titulo="Retirada na loja"
          descricao="Sem custo de entrega"
          aoEscolher={() => setModalidadeEntrega("retirada")}
        />
      </div>

      <button
        type="button"
        onClick={adicionar}
        disabled={!temEstoque}
        className={`mt-5 flex min-h-[56px] w-full items-center justify-center gap-3 rounded-pc-pill text-lg font-bold text-white shadow-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-verde-700/40 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none ${
          adicionado ? "bg-pc-verde-900" : "bg-pc-verde-700 hover:bg-pc-verde-900"
        }`}
      >
        {adicionado ? <Check size={22} aria-hidden="true" /> : <ShoppingCart size={22} aria-hidden="true" />}
        {!temEstoque ? "Produto esgotado" : adicionado ? "Adicionar mais ao carrinho" : "Adicionar ao carrinho"}
      </button>

      {produto.loja?.id && (
        <div className="mt-5 flex items-center gap-3 border-t border-black/5 pt-4">
          <img src={getMediaUrl(produto.loja.logo, IMAGEM_PADRAO_LOJA)} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-black/5 bg-white object-contain p-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-pc-texto-suave">Vendido por</p>
            <p className="truncate text-base font-bold text-pc-texto">{produto.loja.nome}</p>
          </div>
          <Link
            to={`/lojas/${produto.loja.id}`}
            onClick={aoFechar}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pc-pill border border-black/10 px-4 text-sm font-bold text-pc-verde-900 hover:bg-pc-verde-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
          >
            Ver loja
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}

      <Link to={`/produtos/${produto.id}`} onClick={aoFechar} className="mt-3 w-fit text-sm font-semibold text-pc-verde-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700">
        Ver página completa do produto
      </Link>
    </div>
  );
}
