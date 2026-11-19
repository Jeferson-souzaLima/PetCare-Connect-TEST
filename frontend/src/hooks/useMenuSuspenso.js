import { useEffect, useRef, useState } from "react";

/**
 * Estado de um menu suspenso: fecha ao clicar fora ou com Esc (devolvendo o
 * foco ao botão). Use refContainer no elemento que envolve botão e menu.
 */
export function useMenuSuspenso() {
  const [aberto, setAberto] = useState(false);
  const refContainer = useRef(null);
  const refBotao = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    const fechar = (evento) => {
      if (evento.type === "keydown") {
        if (evento.key !== "Escape") return;
        setAberto(false);
        refBotao.current?.focus();
      } else if (!refContainer.current?.contains(evento.target)) {
        setAberto(false);
      }
    };
    document.addEventListener("mousedown", fechar);
    document.addEventListener("keydown", fechar);
    return () => {
      document.removeEventListener("mousedown", fechar);
      document.removeEventListener("keydown", fechar);
    };
  }, [aberto]);

  return {
    aberto,
    alternar: () => setAberto((valor) => !valor),
    fechar: () => setAberto(false),
    refContainer,
    refBotao,
  };
}
