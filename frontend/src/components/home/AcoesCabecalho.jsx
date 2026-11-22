import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Heart, LayoutDashboard, ShoppingCart, User } from "lucide-react";
import { useCarrinho } from "@/context/CarrinhoContext";
import { rotuloContador, unidadesNoCarrinho } from "@/utils/navegacaoInferior";

// Ícones do cabeçalho. Para ativar notificações, adicione um item aqui.
const ACOES = [
  { id: "favoritos", rotulo: "Favoritos", icone: Heart, destino: "/favoritos" },
  { id: "carrinho", rotulo: "Carrinho", icone: ShoppingCart, destino: "/carrinho", contador: "carrinho" },
];
// O lojista não compra pelo site: no lugar dos ícones, o atalho para o painel da loja.
const ACOES_LOJISTA = [{ id: "painel", rotulo: "Painel da loja", icone: LayoutDashboard, destino: "/perfil-lojista" }];

const LINKS_MENU = {
  lojista: [{ rotulo: "Painel da loja", destino: "/perfil-lojista" }],
  admin: [
    { rotulo: "Administração", destino: "/admin" },
    { rotulo: "Meu perfil", destino: "/perfil" },
    { rotulo: "Meus pedidos", destino: "/meus-pedidos" },
  ],
  cliente: [
    { rotulo: "Meu perfil", destino: "/perfil" },
    { rotulo: "Meus pedidos", destino: "/meus-pedidos" },
  ],
};

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
          {(LINKS_MENU[usuario.tipo] || LINKS_MENU.cliente).map(({ rotulo, destino }) => (
            <li key={destino}><Link to={destino} className="block px-4 py-2.5 hover:bg-pc-fundo focus-visible:bg-pc-fundo focus-visible:outline-none">{rotulo}</Link></li>
          ))}
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
  const contadores = { carrinho: unidadesNoCarrinho(carrinho) };

  return (
    <div className="flex items-center gap-1">
      {(usuario?.tipo === "lojista" ? ACOES_LOJISTA : ACOES).map(({ id, rotulo, icone: Icone, destino, contador }) => {
        const valor = contador ? contadores[contador] : 0;
        return (
          <Link key={id} to={destino} className={BOTAO_ICONE} aria-label={valor ? `${rotulo} (${valor} ${valor === 1 ? "item" : "itens"})` : rotulo}>
            <Icone size={22} aria-hidden="true" />
            {valor > 0 && (
              <span aria-hidden="true" className="absolute right-0.5 top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pc-lima px-1 text-xs font-bold text-pc-verde-900">
                {rotuloContador(valor)}
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
