import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { JanelaRapida } from "@/components/navigation/mobile/JanelaRapida";
import { MiniCarrinho } from "@/components/navigation/mobile/MiniCarrinho";
import { useCarrinho } from "@/context/CarrinhoContext";
import { rotuloContador, unidadesNoCarrinho } from "@/utils/navegacaoInferior";

const JANELA_ID = "mini-carrinho-cabecalho";

/**
 * Ícone do carrinho no cabeçalho: abre o mini carrinho sem sair da página.
 * Fecha com outro toque no ícone, toque fora, Esc ou ao trocar de página.
 * O atributo data-janela-aberta sobe o cabeçalho (HomeHeader) acima da barra inferior.
 */
export function CarrinhoCabecalho({ classeBotao }) {
  const { carrinho } = useCarrinho();
  const { pathname } = useLocation();
  const [aberto, setAberto] = useState(false);
  const botaoRef = useRef(null);
  const unidades = unidadesNoCarrinho(carrinho);

  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  useEffect(() => {
    if (!aberto) return undefined;
    function aoTeclar(evento) {
      if (evento.key !== "Escape") return;
      setAberto(false);
      botaoRef.current?.focus();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  const fechar = () => setAberto(false);

  return (
    <div className="relative" data-janela-aberta={aberto || undefined}>
      {/* Toque fora só fecha: a camada recebe o toque, que não chega ao que está atrás. */}
      {aberto && <div aria-hidden="true" onClick={fechar} className="fixed inset-0 z-[5]" />}
      <button
        ref={botaoRef}
        type="button"
        aria-label={unidades ? `Carrinho (${unidades} ${unidades === 1 ? "item" : "itens"})` : "Carrinho"}
        aria-expanded={aberto}
        aria-controls={JANELA_ID}
        onClick={() => setAberto((atual) => !atual)}
        className={`${classeBotao} z-10 ${aberto ? "bg-white/15" : ""}`}
      >
        <ShoppingCart size={22} aria-hidden="true" />
        {unidades > 0 && (
          <span aria-hidden="true" className="absolute right-0.5 top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pc-lima px-1 text-xs font-bold text-pc-verde-900">
            {rotuloContador(unidades)}
          </span>
        )}
      </button>
      {aberto && (
        <JanelaRapida
          id={JANELA_ID}
          rotulo="Carrinho"
          posicao="right-0 top-[calc(100%+0.5rem)] z-10 w-[min(24rem,calc(100vw-2rem))] max-h-[min(32rem,calc(100dvh-9rem))] text-left"
        >
          <MiniCarrinho aoFechar={fechar} />
        </JanelaRapida>
      )}
    </div>
  );
}
