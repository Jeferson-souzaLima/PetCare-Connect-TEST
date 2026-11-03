import { useEffect, useRef, useState } from "react";
import { Home, Search, ShoppingCart, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { useCarrinho } from "../../context/CarrinhoContext";
import ToastCarrinho from "./mobile/ToastCarrinho";
import MenuInicio from "./mobile/MenuInicio";
import MenuHistoricoBusca from "./mobile/MenuHistoricoBusca";
import MenuConta from "./mobile/MenuConta";
import MiniCarrinho from "./mobile/MiniCarrinho";

const CHAVE_HISTORICO_BUSCA = "petcare_historico_busca";

/*
 * Cada item navega no clique e abre um menu no "long press".
 * `areaPressao` é o identificador usado pelo long press ("busca" abre o menu "explorar").
 */
const ITENS = [
  { id: "inicio", label: "Início", icon: Home, rota: "/", areaPressao: "inicio" },
  { id: "explorar", label: "Explorar", icon: Search, rota: "/busca", areaPressao: "busca" },
  { id: "carrinho", label: "Carrinho", icon: ShoppingCart, rota: "/carrinho", areaPressao: "carrinho" },
  { id: "conta", label: "Conta", icon: User, rota: "/perfil", areaPressao: "conta" },
];

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();

  const {
    carrinho,
    aumentarQuantidade,
    diminuirQuantidade,
    removerItem,
    ultimoItemAdicionado,
  } = useCarrinho();

  const timerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const longPressRef = useRef(false);
  const ignorarProximoClickRef = useRef(false);
  const startPositionRef = useRef({ x: 0, y: 0 });
  const ultimoToastTimestampRef = useRef(null);

  const [menuAberto, setMenuAberto] = useState(null);
  const [pressionando, setPressionando] = useState(null);
  const [historicoBusca, setHistoricoBusca] = useState([]);
  const [toastVisivel, setToastVisivel] = useState(false);

  // Esta navegação é exclusiva do cliente.
  if (usuario?.tipo === "lojista") {
    return null;
  }

  const carrinhoTemItens = carrinho.itens.length > 0;

  function estaAtivo(area) {
    const path = location.pathname;

    switch (area) {
      case "inicio":
        return path === "/";

      case "explorar":
        return (
          path === "/busca" ||
          path.startsWith("/produtos/") ||
          path.startsWith("/lojas/") ||
          path.startsWith("/agendar/")
        );

      case "carrinho":
        return path === "/carrinho";

      case "conta":
        return (
          path === "/perfil" ||
          path === "/meus-pedidos" ||
          path === "/meus-agendamentos" ||
          path === "/favoritos"
        );

      default:
        return false;
    }
  }

  function limparLongPress() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function iniciarPressao(event, area) {
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    longPressRef.current = false;

    startPositionRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    limparLongPress();

    setPressionando(area);

    timerRef.current = setTimeout(() => {
      longPressRef.current = true;
      ignorarProximoClickRef.current = true;
      setPressionando(null);

      if (area === "busca") {
        const historico = JSON.parse(
          localStorage.getItem("petcare_historico_busca") || "[]"
        );

        setHistoricoBusca(historico);
      }

      setMenuAberto(
        area === "busca" ? "explorar" : area
      );
    }, 400);
  }

  function verificarMovimento(event) {
    const inicio = startPositionRef.current;

    const distanciaX = Math.abs(
      event.clientX - inicio.x
    );

    const distanciaY = Math.abs(
      event.clientY - inicio.y
    );

    if (distanciaX > 10 || distanciaY > 10) {
      limparLongPress();
      setPressionando(null);
    }
  }

  function finalizarPressao() {
    limparLongPress();
    setPressionando(null);
  }

  function handleItemClick(item) {
    if (ignorarProximoClickRef.current) {
      ignorarProximoClickRef.current = false;
      longPressRef.current = false;
      return;
    }

    if (menuAberto === item.id) {
      setMenuAberto(null);
      return;
    }

    navigate(item.rota);
  }

  function fecharMenuENavegar(rota) {
    setMenuAberto(null);
    navigate(rota);
  }

  function removerTermoHistorico(termo) {
    const novoHistorico = historicoBusca.filter((item) => item !== termo);

    setHistoricoBusca(novoHistorico);

    localStorage.setItem(
      CHAVE_HISTORICO_BUSCA,
      JSON.stringify(novoHistorico)
    );
  }

  function mostrarToast() {
    setToastVisivel(true);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToastVisivel(false);
    }, 2500);
  }

  useEffect(() => {
    if (!ultimoItemAdicionado?.timestamp) {
      return;
    }

    if (
      ultimoToastTimestampRef.current ===
      ultimoItemAdicionado.timestamp
    ) {
      return;
    }

    ultimoToastTimestampRef.current =
      ultimoItemAdicionado.timestamp;

    mostrarToast();
  }, [ultimoItemAdicionado]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        !event.target.closest("[data-mobile-nav]")
      ) {
        setMenuAberto(null);
      }
    }

    document.addEventListener(
      "pointerdown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      limparLongPress();

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {toastVisivel && <ToastCarrinho />}

      <nav
        data-mobile-nav
        className="
          fixed
          bottom-4
          left-1/2
          -translate-x-1/2
          z-50
          md:hidden
          bg-white
          border
          border-gray-200
          shadow-xl
          rounded-full
          px-2
          py-1.5
        "
        aria-label="Navegação principal"
      >
        <div className="flex items-center gap-1">
          {ITENS.map((item) => {
            const Icon = item.icon;
            const ativo = estaAtivo(item.id);
            const menuDesteItem = menuAberto === item.id;

            return (
              <div
                key={item.id}
                className="relative"
              >
                {menuDesteItem && item.id === "inicio" && (
                  <MenuInicio
                    onSelecionar={(categoria) =>
                      fecharMenuENavegar(`/?categoria=${categoria}`)
                    }
                  />
                )}

                {menuDesteItem && item.id === "explorar" && (
                  <MenuHistoricoBusca
                    historicoBusca={historicoBusca}
                    onAbrirTermo={(termo) =>
                      fecharMenuENavegar(
                        `/busca?q=${encodeURIComponent(termo)}`
                      )
                    }
                    onRemoverTermo={removerTermoHistorico}
                  />
                )}

                {menuDesteItem && item.id === "conta" && (
                  <MenuConta onSelecionar={fecharMenuENavegar} />
                )}

                {menuDesteItem && item.id === "carrinho" && (
                  <MiniCarrinho
                    carrinho={carrinho}
                    aumentarQuantidade={aumentarQuantidade}
                    diminuirQuantidade={diminuirQuantidade}
                    removerItem={removerItem}
                    onVerCarrinho={() => fecharMenuENavegar("/carrinho")}
                  />
                )}

                <button
                  type="button"
                  onClick={() => handleItemClick(item)}
                  onPointerDown={(event) =>
                    iniciarPressao(event, item.areaPressao)
                  }
                  onPointerMove={verificarMovimento}
                  onPointerUp={finalizarPressao}
                  onPointerCancel={finalizarPressao}
                  onContextMenu={(event) => event.preventDefault()}
                  aria-label={item.label}
                  aria-current={
                    ativo ? "page" : undefined
                  }
                    className={`
                      relative
                      overflow-visible
                      flex
                      flex-col
                      items-center
                      justify-center
                      min-w-[72px]
                      px-3
                      py-1.5
                      rounded-full
                      transition-all
                      duration-200
                      select-none
                      ${
                        ativo
                          ? "bg-[#0E5617] text-white shadow-md scale-[1.03]"
                          : "text-gray-500 hover:bg-green-50 hover:text-[#0E5617]"
                      }
                    `}
                  >
                  {/* RIPPLE DO CARRINHO */}
                  {item.id === "carrinho" &&
                    carrinhoTemItens &&
                    !ativo && (
                      <span
                        className="
                          absolute
                          inset-0
                          rounded-full
                          border-2
                          border-yellow-400
                          pointer-events-none
                          animate-ping
                          opacity-60
                        "
                      />
                    )}

                  {/* PROGRESSO DO LONG PRESS */}
                  <span
                    className="
                      absolute
                      inset-0
                      bg-white/30
                      origin-left
                      pointer-events-none
                      transition-transform
                      duration-[400ms]
                      ease-linear
                      rounded-full
                    "
                    style={{
                      transform: `scaleX(${
                        pressionando ===
                        item.id
                          ? 1
                          : 0
                      })`,
                    }}
                  />

                  <Icon className="w-5 h-5 relative z-10" />

                  <span className="text-[11px] font-semibold mt-0.5 whitespace-nowrap relative z-10">
                    {item.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
