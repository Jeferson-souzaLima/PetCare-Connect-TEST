import { Link } from "react-router-dom";
import { Scissors, ShoppingBag, Stethoscope, Store } from "lucide-react";

// Atalhos enquanto produtos não têm categoria no banco (ver spec, seção 9).
const ATALHOS = [
  { rotulo: "Produtos", destino: "/produtos", icone: ShoppingBag },
  { rotulo: "Serviços", destino: "/servicos", icone: Scissors },
  { rotulo: "Lojas", destino: "/lojas", icone: Store },
  { rotulo: "Clínicas", destino: "/busca?q=veterin%C3%A1ria", icone: Stethoscope },
];

export function AtalhosCategorias() {
  return (
    <nav aria-label="Categorias">
      <ul className="grid grid-cols-4 gap-2 sm:gap-3">
        {ATALHOS.map(({ rotulo, destino, icone: Icone }) => (
          <li key={rotulo}>
            <Link
              to={destino}
              className="flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-pc-card bg-white p-2 text-center text-xs font-medium text-pc-texto shadow-pc-card transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-verde-700/40 sm:text-sm"
            >
              <Icone size={26} aria-hidden="true" className="text-pc-verde-700" />
              {rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
