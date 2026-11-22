import { useEffect, useRef } from "react";

const ACIMA_DA_BARRA = "inset-x-0 bottom-[calc(100%+0.5rem)] max-h-[min(70vh,30rem)]";

/**
 * Janela compacta: por padrão abre acima da barra inferior (toque prolongado); `posicao` troca o lugar
 * (ex.: abaixo do carrinho do cabeçalho). Recebe o foco ao abrir; fechar fica com quem a abriu.
 */
export function JanelaRapida({ id, rotulo, posicao = ACIMA_DA_BARRA, children }) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      role="dialog"
      aria-label={rotulo}
      tabIndex={-1}
      className={`absolute ${posicao} flex flex-col overflow-y-auto overscroll-contain rounded-[24px] border border-black/5 bg-white p-2 shadow-[0_8px_24px_rgba(2,63,30,0.18)] focus:outline-none motion-safe:animate-pc-janela`}
    >
      {children}
    </div>
  );
}
