import { useCallback, useEffect, useRef, useState } from "react";
import { LIMITES_HEADER, proximoEstadoHeader } from "@/utils/headerRecolhivel";

// Movimentos menores que isso não trocam o sentido da rolagem (tremidas do dedo).
const TOLERANCIA_SENTIDO_PX = 4;

/**
 * Estado do cabeçalho recolhível ("completo", "compacto", "recolhido") conforme a rolagem.
 * Desligado (`ativo` false) fica sempre completo. Não recolhe com o foco dentro do cabeçalho
 * (digitando na busca, mini carrinho aberto). `abrir` e `recolher` atendem o toque na aba.
 */
export function useHeaderRecolhivel(ativo, headerRef) {
  const [estado, setEstado] = useState("completo");
  const estadoRef = useRef("completo");
  const fixadoRef = useRef(null);
  const ultimoYRef = useRef(0);
  const descendoRef = useRef(false);

  const aplicar = useCallback((novo) => {
    estadoRef.current = novo;
    setEstado(novo);
  }, []);

  useEffect(() => {
    if (!ativo) {
      fixadoRef.current = null;
      aplicar("completo");
      return undefined;
    }

    let quadro = 0;
    function avaliar() {
      quadro = 0;
      const y = Math.max(0, window.scrollY);
      const dy = y - ultimoYRef.current;
      if (Math.abs(dy) >= TOLERANCIA_SENTIDO_PX) {
        descendoRef.current = dy > 0;
        ultimoYRef.current = y;
      }
      if (y <= LIMITES_HEADER.topo) fixadoRef.current = null;

      const novo = proximoEstadoHeader({ atual: estadoRef.current, y, descendo: descendoRef.current, fixado: fixadoRef.current });
      const focoDentro = headerRef.current?.contains(document.activeElement);
      if (novo === "recolhido" && focoDentro) return;
      if (novo !== estadoRef.current) aplicar(novo);
    }
    function aoRolar() {
      if (!quadro) quadro = requestAnimationFrame(avaliar);
    }

    ultimoYRef.current = window.scrollY;
    avaliar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      window.removeEventListener("scroll", aoRolar);
      cancelAnimationFrame(quadro);
    };
  }, [ativo, aplicar, headerRef]);

  const abrir = useCallback(() => {
    fixadoRef.current = "compacto";
    aplicar("compacto");
  }, [aplicar]);

  const recolher = useCallback(() => {
    fixadoRef.current = "recolhido";
    aplicar("recolhido");
  }, [aplicar]);

  return { estado: ativo ? estado : "completo", abrir, recolher };
}
