import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { CalendarDays, Home, Package, Search, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AvisoCarrinho } from "./AvisoCarrinho";
import { PainelExplorar } from "./PainelExplorar";

const PAINEL_ID = "painel-explorar";

// Páginas em que o "Explorar" aparece como ativo.
const ROTAS_EXPLORAR = /^\/(lojas|produtos|servicos|busca|agendar)(\/|$)/;

const ITEM =
  "flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 whitespace-nowrap rounded-pc-pill text-[10px] font-medium tracking-tight max-[359px]:text-[9.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700 focus-visible:ring-offset-2";

const corItem = (ativo) => (ativo ? "bg-pc-verde-100 text-pc-verde-900" : "text-pc-texto-suave");

function ItemLink({ rotulo, destino, icone: Icone, extraAtivo }) {
  return (
    <NavLink to={destino} className={({ isActive }) => `${ITEM} ${corItem(isActive || extraAtivo)}`}>
      <Icone size={22} aria-hidden="true" />
      {rotulo}
    </NavLink>
  );
}

/**
 * Barra inferior do cliente e do visitante (abaixo de 768 px), igual em todas as páginas:
 * Explorar | Agendamentos | Início (no centro, em destaque) | Pedidos | Conta.
 * O carrinho fica no cabeçalho. O lojista não vê esta barra.
 */
export function BarraInferiorCliente() {
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  const [painelAberto, setPainelAberto] = useState(false);
  const navRef = useRef(null);
  const explorarRef = useRef(null);

  // Fecha o painel ao trocar de página.
  useEffect(() => {
    setPainelAberto(false);
  }, [pathname]);

  useEffect(() => {
    if (!painelAberto) return undefined;
    function aoTeclar(evento) {
      if (evento.key === "Escape") {
        setPainelAberto(false);
        explorarRef.current?.focus();
      }
    }
    function aoTocarFora(evento) {
      if (!navRef.current?.contains(evento.target)) setPainelAberto(false);
    }
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("pointerdown", aoTocarFora);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("pointerdown", aoTocarFora);
    };
  }, [painelAberto]);

  if (usuario?.tipo === "lojista") return null;

  const explorarAtivo = ROTAS_EXPLORAR.test(pathname);

  return (
    <>
      <AvisoCarrinho />
      <nav
        ref={navRef}
        aria-label="Navegação principal"
        className="fixed inset-x-3 max-[359px]:inset-x-2 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-pc-pill border border-black/5 bg-white/95 p-1.5 shadow-[0_8px_24px_rgba(2,63,30,0.18)] backdrop-blur md:hidden"
      >
        {painelAberto && <PainelExplorar id={PAINEL_ID} aoFechar={() => setPainelAberto(false)} />}
        <ul className="grid grid-cols-[1fr_1fr_64px_1fr_1fr] items-center gap-0.5">
          <li>
            <button
              ref={explorarRef}
              type="button"
              aria-expanded={painelAberto}
              aria-controls={PAINEL_ID}
              onClick={() => setPainelAberto((aberto) => !aberto)}
              className={`${ITEM} ${corItem(explorarAtivo || painelAberto)}`}
            >
              <Search size={22} aria-hidden="true" />
              Explorar
            </button>
          </li>
          <li>
            <ItemLink rotulo="Agendamentos" destino="/meus-agendamentos" icone={CalendarDays} />
          </li>
          <li className="flex justify-center">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex h-[60px] w-[60px] flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-semibold tracking-tight shadow-md ring-4 ring-white focus-visible:outline-none focus-visible:ring-pc-lima ${
                  isActive ? "bg-pc-verde-900 text-white" : "bg-pc-verde-700 text-white"
                }`
              }
            >
              <Home size={22} aria-hidden="true" />
              Início
            </NavLink>
          </li>
          <li>
            <ItemLink rotulo="Pedidos" destino="/meus-pedidos" icone={Package} />
          </li>
          <li>
            <ItemLink rotulo="Conta" destino="/perfil" icone={User} extraAtivo={pathname === "/favoritos"} />
          </li>
        </ul>
      </nav>
    </>
  );
}
