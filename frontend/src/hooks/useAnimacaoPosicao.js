import { useLayoutEffect, useRef } from "react";

const DURACAO_MS = 320;
const CURVA = "cubic-bezier(0.22, 1, 0.36, 1)";

function reduzirMovimento() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Posição (relativa ao container, imune à rolagem) e largura dos elementos com data-flip. */
function medir(container) {
  const base = container.getBoundingClientRect();
  const mapa = new Map();
  container.querySelectorAll("[data-flip]").forEach((el) => {
    const r = el.getBoundingClientRect();
    mapa.set(el.dataset.flip, { el, x: r.left - base.left, y: r.top - base.top, largura: r.width });
  });
  return mapa;
}

/**
 * Quando `chave` muda, cada elemento com data-flip="nome" desliza da posição anterior até a nova
 * (técnica FLIP), em vez de pular. Com data-flip-largura, o primeiro filho também acompanha a
 * largura (ex.: a busca estreitando enquanto anda). Sem animação com "reduzir movimento".
 */
export function useAnimacaoPosicao(containerRef, chave) {
  const anteriorRef = useRef(null);
  const chaveRef = useRef(chave);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const atual = medir(container);
    const anterior = anteriorRef.current;

    if (anterior && chaveRef.current !== chave && !reduzirMovimento()) {
      const opcoes = { duration: DURACAO_MS, easing: CURVA };
      atual.forEach(({ el, x, y, largura }, nome) => {
        const antes = anterior.get(nome);
        if (!antes) return;
        const dx = antes.x - x;
        const dy = antes.y - y;
        if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], opcoes);
        if (el.hasAttribute("data-flip-largura") && el.firstElementChild && antes.largura !== largura) {
          // Termina em 100% (e não na largura medida agora): os vizinhos ainda podem estar mudando de tamanho.
          el.firstElementChild.animate([{ width: `${antes.largura}px` }, { width: "100%" }], opcoes);
        }
      });
    }

    chaveRef.current = chave;
    anteriorRef.current = atual;
  });
}
