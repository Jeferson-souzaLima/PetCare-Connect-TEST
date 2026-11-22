import { useCallback, useEffect, useRef, useState } from "react";

const DURACAO_MS = 450;
const TOLERANCIA_PX = 10;

/**
 * Toque rápido x toque prolongado (segurar o dedo) num mesmo botão ou link.
 * `aoSegurar(id)` roda depois de DURACAO_MS sem soltar nem arrastar; o clique que vem
 * em seguida é descartado, para o toque prolongado não navegar também.
 * Devolve `pressionando` (id em andamento, para o efeito visual) e `propsDe(id)`.
 */
export function useToqueProlongado(aoSegurar) {
  const timerRef = useRef(null);
  const inicioRef = useRef({ x: 0, y: 0 });
  const descartarCliqueRef = useRef(false);
  const aoSegurarRef = useRef(aoSegurar);
  const [pressionando, setPressionando] = useState(null);

  useEffect(() => {
    aoSegurarRef.current = aoSegurar;
  });

  const cancelar = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
    setPressionando(null);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const propsDe = useCallback(
    (id) => ({
      onPointerDown(evento) {
        if (evento.pointerType === "mouse" && evento.button !== 0) return;
        descartarCliqueRef.current = false;
        inicioRef.current = { x: evento.clientX, y: evento.clientY };
        clearTimeout(timerRef.current);
        setPressionando(id);
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          descartarCliqueRef.current = true;
          setPressionando(null);
          navigator.vibrate?.(15);
          aoSegurarRef.current(id);
        }, DURACAO_MS);
      },
      onPointerMove(evento) {
        if (!timerRef.current) return;
        const { x, y } = inicioRef.current;
        if (Math.abs(evento.clientX - x) > TOLERANCIA_PX || Math.abs(evento.clientY - y) > TOLERANCIA_PX) cancelar();
      },
      onPointerUp: cancelar,
      onPointerCancel: cancelar,
      onPointerLeave: cancelar,
      // Sem o menu do navegador ("abrir em nova aba", copiar link) ao segurar o dedo.
      onContextMenu(evento) {
        evento.preventDefault();
      },
      onClickCapture(evento) {
        if (!descartarCliqueRef.current) return;
        descartarCliqueRef.current = false;
        evento.preventDefault();
        evento.stopPropagation();
      },
    }),
    [cancelar]
  );

  return { pressionando, propsDe };
}
