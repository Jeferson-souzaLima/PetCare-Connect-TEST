import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { buscarProduto } from "@/services/produtoService";
import { CompraProduto } from "./CompraProduto";
import { GaleriaProduto } from "./GaleriaProduto";
import { LeveTambem } from "./LeveTambem";

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Esc fecha, Tab circula dentro da janela, a página atrás não rola e o foco volta ao card. */
function useJanelaModal(ref, aoFechar) {
  const aoFecharRef = useRef(aoFechar);
  useEffect(() => {
    aoFecharRef.current = aoFechar;
  });

  useEffect(() => {
    const focoAnterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();

    function aoTeclar(evento) {
      if (evento.key === "Escape") {
        aoFecharRef.current();
        return;
      }
      if (evento.key !== "Tab" || !ref.current) return;
      const focaveis = [...ref.current.querySelectorAll(FOCAVEIS)];
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && (document.activeElement === primeiro || document.activeElement === ref.current)) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
      focoAnterior?.focus?.();
    };
  }, [ref]);
}

function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando produto" className="grid gap-8 lg:grid-cols-2">
      <div className="aspect-square animate-pulse rounded-[20px] bg-pc-fundo motion-reduce:animate-none" />
      <div className="space-y-4 pt-2">
        <div className="h-8 w-3/4 animate-pulse rounded-lg bg-pc-fundo motion-reduce:animate-none" />
        <div className="h-4 w-full animate-pulse rounded bg-pc-fundo motion-reduce:animate-none" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-pc-fundo motion-reduce:animate-none" />
        <div className="h-10 w-1/3 animate-pulse rounded-lg bg-pc-fundo motion-reduce:animate-none" />
        <div className="h-14 w-full animate-pulse rounded-pc-pill bg-pc-fundo motion-reduce:animate-none" />
      </div>
    </div>
  );
}

/**
 * Visualização rápida do produto (desktop): abre sobre a página, sem sair dela.
 * Depois de adicionar ao carrinho, o painel "Leve também!" aparece ao lado.
 */
export function VisualizacaoRapidaProduto({ produtoId: idInicial, aoFechar }) {
  const ref = useRef(null);
  const tituloId = useId();
  const [produtoId, setProdutoId] = useState(idInicial);
  const [estado, setEstado] = useState({ produto: null, erro: false });
  const [adicionado, setAdicionado] = useState(false);
  useJanelaModal(ref, aoFechar);

  useEffect(() => {
    let ativo = true;
    setEstado({ produto: null, erro: false });
    setAdicionado(false);
    buscarProduto(produtoId)
      .then((produto) => ativo && setEstado({ produto, erro: false }))
      .catch((erro) => {
        console.error("Não foi possível carregar o produto na visualização rápida:", erro);
        if (ativo) setEstado({ produto: null, erro: true });
      });
    return () => {
      ativo = false;
    };
  }, [produtoId]);

  const { produto, erro } = estado;
  const comPainel = adicionado && produto;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px] md:p-6"
      onPointerDown={(evento) => evento.target === evento.currentTarget && aoFechar()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={produto ? tituloId : undefined}
        aria-label={produto ? undefined : "Visualização rápida do produto"}
        tabIndex={-1}
        className={`relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto overscroll-contain rounded-[28px] bg-white p-6 shadow-2xl transition-[max-width] duration-300 focus:outline-none motion-safe:animate-pc-janela md:max-h-[calc(100dvh-3rem)] xl:p-8 ${
          comPainel ? "max-w-[1320px]" : "max-w-[1000px]"
        }`}
      >
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-pc-texto shadow-sm hover:bg-pc-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
        >
          <X size={22} aria-hidden="true" />
        </button>

        {!produto && !erro && <Carregando />}

        {erro && (
          <div className="py-10 text-center">
            <p className="text-base font-semibold text-pc-texto">Não foi possível carregar este produto agora.</p>
            <Link to={`/produtos/${produtoId}`} onClick={aoFechar} className="mt-4 inline-flex min-h-[44px] items-center rounded-pc-pill bg-pc-verde-700 px-5 text-sm font-semibold text-white">
              Abrir a página do produto
            </Link>
          </div>
        )}

        {produto && (
          <div className={`grid gap-6 xl:gap-8 lg:grid-cols-2 ${comPainel ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px]" : ""}`}>
            <GaleriaProduto key={`g-${produto.id}`} produto={produto} />
            <CompraProduto key={`c-${produto.id}`} produto={produto} tituloId={tituloId} adicionado={adicionado} aoAdicionar={() => setAdicionado(true)} aoFechar={aoFechar} />
            {comPainel && <LeveTambem key={`l-${produto.id}`} produto={produto} aoVerProduto={setProdutoId} aoFechar={aoFechar} />}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
