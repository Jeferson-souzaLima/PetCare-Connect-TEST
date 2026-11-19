import { Link } from "react-router-dom";
import { CalendarDays, Package, PackageCheck, Scissors } from "lucide-react";

const ATALHOS = [
  { rotulo: "Produtos", icone: Package, destino: "/lojista/produtos" },
  { rotulo: "Serviços", icone: Scissors, destino: "/lojista/servicos" },
  { rotulo: "Agenda", icone: CalendarDays, destino: "/lojista/agenda" },
  { rotulo: "Pedidos", icone: PackageCheck, destino: "/lojista/pedidos" },
];

/** Atalhos do celular (no computador, o menu lateral faz esse papel). */
export function AtalhosLojista() {
  return (
    <nav aria-label="Atalhos" className="lg:hidden">
      <ul className="grid grid-cols-4 gap-2 sm:gap-3">
        {ATALHOS.map(({ rotulo, icone: Icone, destino }) => (
          <li key={rotulo}>
            <Link
              to={destino}
              className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-pc-card bg-white px-1 text-sm font-medium text-pc-texto shadow-pc-card hover:bg-pc-verde-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60"
            >
              <Icone aria-hidden="true" className="h-7 w-7 text-pc-verde-700" />
              {rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
