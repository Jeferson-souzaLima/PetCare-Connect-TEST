import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, CircleCheck, Package, Plus, ShoppingCart, Tag } from "lucide-react";
import { useCarrinho } from "@/context/CarrinhoContext";
import { buscarProdutosDaLoja } from "@/services/produtoService";
import { getMediaUrl } from "@/services/mediaUrl";
import { formatarMoeda } from "@/utils/formatadores";
import { itemDoCarrinho, somaPrecos, sugestoesLeveTambem } from "@/utils/produtoRapido";

function Sugestao({ produto, adicionado, aoAdicionar, aoVer }) {
  const imagem = getMediaUrl(produto.imagens?.[0]?.caminho);
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-pc-card">
      <button
        type="button"
        onClick={() => aoVer(produto.id)}
        aria-label={`Ver ${produto.nome}`}
        className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-pc-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
      >
        {imagem ? <img src={imagem} alt="" className="h-full w-full object-contain p-1" /> : <Package size={24} aria-hidden="true" className="text-pc-verde-700/40" />}
      </button>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => aoVer(produto.id)} className="line-clamp-2 text-left text-sm font-semibold leading-tight text-pc-texto hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700">
          {produto.nome}
        </button>
        <p className="mt-1 text-base font-bold text-pc-verde-900">{formatarMoeda(produto.preco)}</p>
      </div>
      <button
        type="button"
        onClick={() => aoAdicionar(produto)}
        disabled={adicionado}
        aria-label={adicionado ? `${produto.nome} adicionado` : `Adicionar ${produto.nome} ao carrinho`}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-900 focus-visible:ring-offset-2 ${
          adicionado ? "bg-pc-verde-900" : "bg-pc-verde-700 hover:bg-pc-verde-900"
        }`}
      >
        {adicionado ? <Check size={20} aria-hidden="true" /> : <Plus size={22} aria-hidden="true" />}
      </button>
    </li>
  );
}

/**
 * Aparece ao lado do produto depois de adicioná-lo: confirmação e sugestões da mesma loja
 * (o carrinho aceita uma loja por vez). Sem sugestões, fica só a confirmação.
 */
export function LeveTambem({ produto, aoVerProduto, aoFechar }) {
  const { carrinho, adicionarItem } = useCarrinho();
  const [sugestoes, setSugestoes] = useState(null);
  const [adicionados, setAdicionados] = useState(() => new Set());

  // As sugestões são escolhidas uma vez, ao abrir: o que for adicionado aqui fica marcado, sem sumir da lista.
  const [idsNoCarrinho] = useState(() => carrinho.itens.map((item) => item.item_id));
  const lojaId = produto.loja?.id;

  useEffect(() => {
    let ativo = true;
    buscarProdutosDaLoja(lojaId)
      .then((lista) => ativo && setSugestoes(sugestoesLeveTambem(lista, { produtoAtualId: produto.id, idsNoCarrinho })))
      .catch((erro) => {
        // Sem sugestões o painel continua útil (confirmação e atalhos); o erro fica só no console.
        console.error("Não foi possível carregar as sugestões do Leve também:", erro);
        if (ativo) setSugestoes([]);
      });
    return () => {
      ativo = false;
    };
  }, [lojaId, produto.id, idsNoCarrinho]);

  function adicionar(lista) {
    const entraram = lista.filter((p) => adicionarItem(itemDoCarrinho(p, 1))).map((p) => p.id);
    if (entraram.length) setAdicionados((atuais) => new Set([...atuais, ...entraram]));
  }

  const pendentes = (sugestoes ?? []).filter((p) => !adicionados.has(p.id));

  return (
    <aside aria-label="Leve também" className="flex flex-col lg:col-span-2 xl:col-span-1 rounded-[24px] bg-gradient-to-b from-pc-verde-100 to-pc-verde-100/40 p-5 motion-safe:animate-pc-painel-lateral">
      <p className="flex items-center gap-2 text-sm font-semibold text-pc-verde-900" role="status">
        <CircleCheck size={18} aria-hidden="true" />
        Adicionado ao carrinho!
      </p>

      {sugestoes === null && (
        <div aria-busy="true" aria-label="Carregando sugestões" className="mt-5 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[5.25rem] animate-pulse rounded-2xl bg-white/70 motion-reduce:animate-none" />
          ))}
        </div>
      )}

      {sugestoes?.length > 0 && (
        <>
          <div className="mt-4 flex items-start gap-2.5">
            <Tag size={26} aria-hidden="true" className="mt-0.5 shrink-0 -scale-x-100 text-pc-verde-700" />
            <div>
              <h3 className="text-2xl font-bold leading-tight text-pc-verde-900">Leve também!</h3>
              <p className="mt-0.5 text-sm text-pc-texto">Complete o cuidado do seu pet com estes itens</p>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {sugestoes.map((p) => (
              <Sugestao key={p.id} produto={p} adicionado={adicionados.has(p.id)} aoAdicionar={(item) => adicionar([item])} aoVer={aoVerProduto} />
            ))}
          </ul>
          {pendentes.length > 1 && (
            <button
              type="button"
              onClick={() => adicionar(pendentes)}
              className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-pc-verde-900 px-4 text-center text-sm font-bold leading-tight text-white shadow-md hover:bg-pc-verde-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-verde-700/40"
            >
              <ShoppingCart size={22} aria-hidden="true" className="shrink-0" />
              <span>
                Adicionar os {pendentes.length} ao carrinho
                <br />
                por {formatarMoeda(somaPrecos(pendentes))}
              </span>
            </button>
          )}
        </>
      )}

      <div className="mt-auto grid gap-2 pt-5">
        <Link
          to="/carrinho"
          onClick={aoFechar}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-pc-pill bg-pc-verde-700 text-sm font-bold text-white hover:bg-pc-verde-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-900 focus-visible:ring-offset-2"
        >
          Ir para o carrinho · {formatarMoeda(carrinho.total)}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={aoFechar}
          className="min-h-[44px] rounded-pc-pill text-sm font-semibold text-pc-verde-900 hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
        >
          Continuar comprando
        </button>
      </div>
    </aside>
  );
}
