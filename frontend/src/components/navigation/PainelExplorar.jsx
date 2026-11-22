import { Link } from "react-router-dom";
import { Package, Scissors, Store } from "lucide-react";

const OPCOES_EXPLORAR = [
  { rotulo: "Lojas", descricao: "Pet shops e clínicas", destino: "/lojas?buscar=1", icone: Store },
  { rotulo: "Produtos", descricao: "Rações, petiscos e acessórios", destino: "/produtos?buscar=1", icone: Package },
  { rotulo: "Serviços", descricao: "Banho, tosa, vacinas e mais", destino: "/servicos?buscar=1", icone: Scissors },
];

/** Atalhos do "Explorar" da barra inferior: Lojas, Produtos ou Serviços com a busca aberta. */
export function PainelExplorar({ aoFechar }) {
  return (
    <ul className="grid gap-1">
      {OPCOES_EXPLORAR.map(({ rotulo, descricao, destino, icone: Icone }) => (
        <li key={rotulo}>
          <Link
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
  );
}
