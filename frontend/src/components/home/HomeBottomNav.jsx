import { Link, NavLink } from "react-router-dom";
import { CalendarDays, Home, Package, Search, User } from "lucide-react";

const ITENS = [
  { rotulo: "Início", destino: "/", icone: Home, fim: true },
  // Leva ao catálogo da própria home; sem estado ativo (o caminho também é "/").
  { rotulo: "Explorar", destino: "/?categoria=produtos#explorar", icone: Search, semAtivo: true },
  { rotulo: "Agendamentos", destino: "/meus-agendamentos", icone: CalendarDays },
  { rotulo: "Pedidos", destino: "/meus-pedidos", icone: Package },
  { rotulo: "Conta", destino: "/perfil", icone: User },
];

const ITEM =
  "my-1.5 flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-pc-card text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700 focus-visible:ring-offset-2";

/** Barra inferior exclusiva da home (abaixo de 768 px). O carrinho fica no cabeçalho. */
export function HomeBottomNav() {
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {ITENS.map(({ rotulo, destino, icone: Icone, fim, semAtivo }) => (
          <li key={rotulo} className="flex-1">
            {semAtivo ? (
              <Link to={destino} className={`${ITEM} text-pc-texto-suave`}>
                <Icone size={22} aria-hidden="true" />
                {rotulo}
              </Link>
            ) : (
              <NavLink
                to={destino}
                end={fim}
                className={({ isActive }) => `${ITEM} ${isActive ? "bg-pc-verde-700 text-white" : "text-pc-texto-suave"}`}
              >
                <Icone size={22} aria-hidden="true" />
                {rotulo}
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
