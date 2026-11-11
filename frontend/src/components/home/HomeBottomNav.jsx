import { NavLink } from "react-router-dom";
import { CalendarDays, Home, Package, Search, User } from "lucide-react";

const ITENS = [
  { rotulo: "Início", destino: "/", icone: Home, fim: true },
  { rotulo: "Explorar", destino: "/busca", icone: Search },
  { rotulo: "Agendamentos", destino: "/meus-agendamentos", icone: CalendarDays },
  { rotulo: "Pedidos", destino: "/meus-pedidos", icone: Package },
  { rotulo: "Conta", destino: "/perfil", icone: User },
];

/** Barra inferior exclusiva da home (abaixo de 768 px). O carrinho fica no cabeçalho. */
export function HomeBottomNav() {
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {ITENS.map(({ rotulo, destino, icone: Icone, fim }) => (
          <li key={destino} className="flex-1">
            <NavLink
              to={destino}
              end={fim}
              className={({ isActive }) =>
                `my-1.5 flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-pc-card text-[11px] font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60 ${
                  isActive ? "bg-pc-verde-700 text-white" : "text-pc-texto-suave"
                }`
              }
            >
              <Icone size={22} aria-hidden="true" />
              {rotulo}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
