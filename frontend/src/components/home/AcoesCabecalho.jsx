import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Heart, ShoppingCart, User } from "lucide-react";
import { useCarrinho } from "@/context/CarrinhoContext";

// Ícones do cabeçalho da home. Para ativar notificações, adicione um item aqui.
const ACOES = [
  { id: "favoritos", rotulo: "Favoritos", icone: Heart, destino: "/favoritos" },
  { id: "carrinho", rotulo: "Carrinho", icone: ShoppingCart, destino: "/carrinho", contador: "carrinho" },
];

const BOTAO_ICONE =
  "relative flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60";

function MenuUsuario({ usuario, aoSair }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  const botaoRef = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    const fechar = (e) => {
      if (e.type === "keydown") {
        if (e.key !== "Escape") return;
        setAberto(false);
        botaoRef.current?.focus();
      } else if (!ref.current?.contains(e.target)) {
        setAberto(false);
      }
    };
    document.addEventListener("mousedown", fechar);
    document.addEventListener("keydown", fechar);
    return () => {
      document.removeEventListener("mousedown", fechar);
      document.removeEventListener("keydown", fechar);
    };
  }, [aberto]);

  const primeiroNome = (usuario.nome || "").split(" ")[0] || "Minha conta";

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        ref={botaoRef}
        type="button"
        aria-expanded={aberto}
        aria-controls="menu-usuario-home"
        onClick={() => setAberto((a) => !a)}
        className="flex min-h-[44px] items-center gap-2 rounded-pc-pill px-3 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pc-lima text-pc-verde-900">
          <User size={18} aria-hidden="true" />
        </span>
        <span>Olá, {primeiroNome}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {aberto && (
        <ul id="menu-usuario-home" className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-pc-card bg-white py-1 text-sm text-pc-texto shadow-pc-card">
          {usuario.tipo === "admin" && (
            <li><Link to="/admin" className="block px-4 py-2.5 hover:bg-pc-fundo focus-visible:bg-pc-fundo focus-visible:outline-none">Administração</Link></li>
          )}
          <li><Link to="/perfil" className="block px-4 py-2.5 hover:bg-pc-fundo focus-visible:bg-pc-fundo focus-visible:outline-none">Meu perfil</Link></li>
          <li><Link to="/meus-pedidos" className="block px-4 py-2.5 hover:bg-pc-fundo focus-visible:bg-pc-fundo focus-visible:outline-none">Meus pedidos</Link></li>
          <li>
            <button type="button" onClick={aoSair} className="block w-full px-4 py-2.5 text-left hover:bg-pc-fundo focus-visible:bg-pc-fundo focus-visible:outline-none">
              Sair
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

export function AcoesCabecalho({ usuario, logout }) {
  const navigate = useNavigate();
  const { carrinho } = useCarrinho();
  const itensCarrinho = (carrinho?.itens ?? []).reduce((total, item) => total + (Number(item.quantidade) || 0), 0);
  const contadores = { carrinho: itensCarrinho };

  return (
    <div className="flex items-center gap-1">
      {ACOES.map(({ id, rotulo, icone: Icone, destino, contador }) => {
        const valor = contador ? contadores[contador] : 0;
        return (
          <Link key={id} to={destino} className={BOTAO_ICONE} aria-label={valor ? `${rotulo} (${valor} ${valor === 1 ? "item" : "itens"})` : rotulo}>
            <Icone size={22} aria-hidden="true" />
            {valor > 0 && (
              <span aria-hidden="true" className="absolute right-0.5 top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pc-lima px-1 text-xs font-bold text-pc-verde-900">
                {valor > 99 ? "99+" : valor}
              </span>
            )}
          </Link>
        );
      })}
      {usuario ? (
        <MenuUsuario
          usuario={usuario}
          aoSair={() => {
            logout();
            navigate("/");
          }}
        />
      ) : (
        <Link to="/login" className="ml-1 hidden min-h-[44px] items-center rounded-pc-pill bg-pc-lima px-4 text-sm font-semibold text-pc-verde-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white md:inline-flex">
          Entrar
        </Link>
      )}
    </div>
  );
}
