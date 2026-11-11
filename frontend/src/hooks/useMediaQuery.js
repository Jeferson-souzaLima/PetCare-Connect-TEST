import { useEffect, useState } from "react";

function corresponde(consulta) {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(consulta).matches
    : false;
}

/** true enquanto a media query CSS corresponder (ex.: "(min-width: 768px)"). */
export function useMediaQuery(consulta) {
  const [ativa, setAtiva] = useState(() => corresponde(consulta));

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const lista = window.matchMedia(consulta);
    const atualizar = () => setAtiva(lista.matches);
    atualizar();
    lista.addEventListener("change", atualizar);
    return () => lista.removeEventListener("change", atualizar);
  }, [consulta]);

  return ativa;
}
