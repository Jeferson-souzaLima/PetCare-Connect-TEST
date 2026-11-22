import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FaixaAdmin } from "@/components/navigation/FaixaAdmin";
import { LogoPetCare } from "@/components/ui/LogoPetCare";
import { useAnimacaoPosicao } from "@/hooks/useAnimacaoPosicao";
import { useAuth } from "@/hooks/useAuth";
import { useHeaderRecolhivel } from "@/hooks/useHeaderRecolhivel";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { AcoesCabecalho } from "./AcoesCabecalho";
import { BuscaHome } from "./BuscaHome";
import { CidadeAtual } from "./CidadeAtual";

/*
 * Cabeçalho recolhível (só a home, só no celular): a caixa mantém sempre a altura do cabeçalho
 * completo, então o conteúdo da página nunca pula. Ela gruda no topo deslocada para cima
 * (top negativo), deixando à mostra só a faixa de baixo, onde fica a linha compacta; recolhido,
 * ela sobe mais um pouco e sobra só a aba. --altura-conteudo-header vem da medição do completo.
 * overflow-anchor: none impede o navegador de "corrigir" a rolagem quando os itens mudam de
 * lugar dentro da caixa (isso devolvia a página ao topo e desfazia o compacto).
 */
const RECOLHIVEL =
  "[overflow-anchor:none] max-md:top-[calc(1.5rem-var(--altura-conteudo-header,108px))] max-md:flex max-md:min-h-[calc(var(--altura-conteudo-header,108px)+2.5rem+env(safe-area-inset-top))] max-md:flex-col max-md:justify-end transition-[transform,border-radius] duration-300 ease-out";

const VISIVEL = "visible opacity-100";
const OCULTO = "pointer-events-none invisible opacity-0";

/**
 * Cabeçalho único do site (cliente, visitante e admin), fixo no topo durante a rolagem.
 * - `busca={false}`: sem a busca geral, que fica na home e em /busca (Lojas, Produtos e Serviços têm a sua).
 * - `recolhivel`: só na home; no celular fica compacto ao rolar (busca entre a localização e os
 *   ícones), depois vira uma aba; tocar na aba reabre no compacto; no topo volta ao completo.
 * - Com o mini carrinho aberto o cabeçalho sobe acima da barra inferior (toque nela só fecha a janela).
 */
export function HomeHeader({ busca = true, recolhivel = false }) {
  const { usuario, logout } = useAuth();
  const celular = useMediaQuery("(max-width: 767px)");
  const ativo = recolhivel && busca && celular;
  const headerRef = useRef(null);
  const conteudoRef = useRef(null);
  const { estado, abrir, recolher } = useHeaderRecolhivel(ativo, headerRef);
  const compacto = estado !== "completo";
  const recolhido = estado === "recolhido";

  useAnimacaoPosicao(headerRef, compacto);

  // Altura do conteúdo do cabeçalho completo: mantém a caixa do mesmo tamanho nos três estados.
  // O observador ainda pode disparar logo depois da troca para o compacto (antes de ser desligado):
  // por isso confere no próprio DOM que o cabeçalho está completo antes de medir.
  useEffect(() => {
    const conteudo = conteudoRef.current;
    if (!ativo || compacto || !conteudo || typeof ResizeObserver !== "function") return undefined;
    const observador = new ResizeObserver(() => {
      const header = headerRef.current;
      if (header?.dataset.estado !== "completo") return;
      header.style.setProperty("--altura-conteudo-header", `${conteudo.offsetHeight}px`);
    });
    observador.observe(conteudo);
    return () => observador.disconnect();
  }, [ativo, compacto]);

  const classeHeader = [
    "sticky top-0 z-40 has-[[data-janela-aberta]]:z-50 bg-gradient-to-b from-pc-verde-900 to-pc-verde-700 px-4 pb-5 pt-[calc(1.25rem+env(safe-area-inset-top))] shadow-[0_2px_12px_rgba(2,63,30,0.18)] md:px-6 md:pb-3 md:pt-3",
    ativo && RECOLHIVEL,
    compacto && "max-md:pb-3",
    recolhido && "max-md:-translate-y-8 max-md:rounded-b-3xl",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <FaixaAdmin />
      {/* No celular o verde vai de ponta a ponta, inclusive sob a barra de status (safe-area). */}
      <header ref={headerRef} data-estado={estado} className={classeHeader}>
        <div
          ref={conteudoRef}
          className={`mx-auto flex w-full max-w-pc-pagina items-center gap-x-3 transition-[opacity,visibility] duration-200 ${
            compacto ? "flex-nowrap max-md:gap-x-2" : "flex-wrap gap-y-4 md:gap-y-3"
          } ${recolhido ? OCULTO : VISIVEL}`}
        >
          <Link
            to="/"
            data-flip="logo"
            className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60"
            aria-label="PetCare Connect, página inicial"
          >
            <LogoPetCare alt="" className={`transition-[height] duration-300 ${compacto ? "h-8" : "h-10"} md:h-12`} />
          </Link>
          <div data-flip="cidade" className={compacto ? "shrink-0" : undefined}>
            <CidadeAtual usuario={usuario} compacto={compacto} />
          </div>
          {busca ? (
            <div
              data-flip="busca"
              data-flip-largura=""
              className={compacto ? "min-w-0 flex-1" : "order-last w-full md:order-none md:w-auto md:flex-1 md:px-4"}
            >
              <BuscaHome compacto={compacto} />
            </div>
          ) : (
            <div className="hidden md:block md:flex-1" />
          )}
          <div data-flip="acoes" className={compacto ? "shrink-0" : "ml-auto md:ml-0"}>
            <AcoesCabecalho usuario={usuario} logout={logout} compacto={compacto} />
          </div>
        </div>

        {ativo && (
          <>
            {/* Recolhido: a aba que sobra no topo; o toque reabre no compacto. */}
            <button
              type="button"
              onClick={abrir}
              aria-label="Mostrar o cabeçalho"
              className={`absolute inset-x-0 bottom-0 flex h-8 items-center justify-center text-white transition-[opacity,visibility] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-pc-lima/60 ${
                recolhido ? VISIVEL : OCULTO
              }`}
            >
              <ChevronDown size={26} strokeWidth={2.5} aria-hidden="true" />
            </button>
            {/* Compacto: lingueta abaixo do cabeçalho para recolher de novo. */}
            <button
              type="button"
              onClick={recolher}
              aria-label="Recolher o cabeçalho"
              className={`absolute left-1/2 top-full flex h-5 w-14 -translate-x-1/2 items-center justify-center rounded-b-xl bg-pc-verde-700 text-white shadow-[0_2px_6px_rgba(2,63,30,0.25)] transition-[opacity,visibility] duration-200 before:absolute before:-inset-x-3 before:-bottom-3 before:top-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60 ${
                estado === "compacto" ? VISIVEL : OCULTO
              }`}
            >
              <ChevronUp size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </>
        )}
      </header>
    </>
  );
}
