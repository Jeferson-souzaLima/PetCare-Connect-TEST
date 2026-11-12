import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Package, Scissors, Store } from "lucide-react";

const OPCOES_EXPLORAR = [
  { rotulo: "Lojas", descricao: "Pet shops e clínicas", destino: "/lojas?buscar=1", icone: Store },
  { rotulo: "Produtos", descricao: "Rações, petiscos e acessórios", destino: "/produtos?buscar=1", icone: Package },
  { rotulo: "Serviços", descricao: "Banho, tosa, vacinas e mais", destino: "/servicos?buscar=1", icone: Scissors },
];

/** Painel do "Explorar" da barra inferior: leva a Lojas, Produtos ou Serviços com a busca aberta. */
export function PainelExplorar({ id, aoFechar }) {
  const primeiroRef = useRef(null);

  useEffect(() => {
    primeiroRef.current?.focus();
  }, []);

  return (
    <div
      id={id}
      role="dialog"
      aria-label="Explorar"
      className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] rounded-[24px] border border-black/5 bg-white p-2 shadow-[0_8px_24px_rgba(2,63,30,0.18)]"
    >
      <ul className="grid gap-1">
        {OPCOES_EXPLORAR.map(({ rotulo, descricao, destino, icone: Icone }, i) => (
          <li key={rotulo}>
            <Link
              ref={i === 0 ? primeiroRef : undefined}
              to={destino}
              onClick={aoFechar}
              className="flex min-h-[56px] items-center gap-3 rounded-2xl px-3 text-left hover:bg-pc-verde-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pc-verde-100 text-pc-verde-700">
                <Icone size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-pc-texto">{rotulo}</span>
                <span className="block text-xs text-pc-texto-suave">{descricao}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
