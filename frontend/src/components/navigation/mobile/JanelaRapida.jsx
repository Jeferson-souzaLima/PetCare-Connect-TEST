import { useEffect, useRef } from "react";

/**
 * Janela compacta que abre acima da barra inferior (toque prolongado ou carrinho).
 * Recebe o foco ao abrir; fechar (Esc, toque fora, trocar de página) fica com a barra.
 */
export function JanelaRapida({ id, rotulo, children }) {
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
      className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] flex max-h-[min(70vh,30rem)] flex-col overflow-y-auto overscroll-contain rounded-[24px] border border-black/5 bg-white p-2 shadow-[0_8px_24px_rgba(2,63,30,0.18)] focus:outline-none motion-safe:animate-pc-janela"
    >
      {children}
    </div>
  );
}
