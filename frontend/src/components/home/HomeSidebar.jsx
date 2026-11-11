import { Link, NavLink } from "react-router-dom";
import { CalendarDays, Heart, Home, Package, PawPrint, Scissors, ShoppingBag, Store } from "lucide-react";

const LINKS = [
  { rotulo: "Início", destino: "/", icone: Home, fim: true },
  { rotulo: "Produtos", destino: "/?categoria=produtos#explorar", icone: ShoppingBag },
  { rotulo: "Serviços", destino: "/?categoria=servicos#explorar", icone: Scissors },
  { rotulo: "Lojas e Parceiros", destino: "/?categoria=lojas#explorar", icone: Store },
  { rotulo: "Meus Pets", destino: "/perfil", icone: PawPrint },
  { rotulo: "Meus Pedidos", destino: "/meus-pedidos", icone: Package },
  { rotulo: "Meus Agendamentos", destino: "/meus-agendamentos", icone: CalendarDays },
  { rotulo: "Favoritos", destino: "/favoritos", icone: Heart },
];

const ITEM = "flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-verde-700/40";

/** Menu lateral da home no desktop (a partir de 1024 px). */
export function HomeSidebar() {
  return (
    <div className="hidden w-60 shrink-0 lg:block">
      <nav aria-label="Menu da home" className="sticky top-4 rounded-pc-card bg-white p-3 shadow-pc-card">
        <ul className="space-y-1">
          {LINKS.map(({ rotulo, destino, icone: Icone, fim }) => (
            <li key={rotulo}>
              {fim ? (
                <NavLink to={destino} end className={({ isActive }) => `${ITEM} ${isActive ? "bg-pc-verde-700 text-white" : "text-pc-texto hover:bg-pc-fundo"}`}>
                  <Icone size={20} aria-hidden="true" />
                  {rotulo}
                </NavLink>
              ) : (
                <Link to={destino} className={`${ITEM} text-pc-texto hover:bg-pc-fundo`}>
                  <Icone size={20} aria-hidden="true" />
                  {rotulo}
                </Link>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl bg-pc-verde-100 p-3">
          <p className="flex items-center gap-2 text-sm font-bold text-pc-verde-900">
            <Store size={18} aria-hidden="true" /> Para Lojistas
          </p>
          <ul className="mt-2 space-y-1">
            <li><Link to="/register-lojista" className={`${ITEM} min-h-[40px] text-pc-verde-900 hover:bg-white/60`}>Cadastre sua loja</Link></li>
            <li><Link to="/login" className={`${ITEM} min-h-[40px] text-pc-verde-900 hover:bg-white/60`}>Área do lojista</Link></li>
          </ul>
        </div>
      </nav>
    </div>
  );
}
