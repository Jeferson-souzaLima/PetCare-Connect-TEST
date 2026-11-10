import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  X,
  ClipboardList,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { useBusca } from "../../hooks/useBusca";
import { SearchDropdown } from "../search/SearchDropdown";

export function Header() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const {
    busca,
    setBusca,
    resultados,
    loading,
    dropdownAberto,
    fecharBusca,
    limparBusca,
  } = useBusca();

  const buscaRef = useRef(null);

  const [buscaAtiva, setBuscaAtiva] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(-1);

  const itensNavegacao = useMemo(() => {
    if (!resultados) return [];

    return [
      ...resultados.produtos.map((produto) => ({
        tipo: "produto",
        dados: produto,
      })),

      ...resultados.lojas.map((loja) => ({
        tipo: "loja",
        dados: loja,
      })),

      ...resultados.servicos.map((servico) => ({
        tipo: "servico",
        dados: servico,
      })),
    ];
  }, [resultados]);

  function fecharBuscaCompleta() {
    fecharBusca();
    setBuscaAtiva(false);
    setItemSelecionado(-1);
  }

  function handlePerfil() {
    if (!usuario) {
      navigate("/login");
      return;
    }

    navigate(
      usuario.tipo === "lojista"
        ? "/perfil-lojista"
        : "/perfil"
    );
  }

  function handlePainel() {
    navigate("/perfil-lojista");
  }

  function handleCarrinhoLojista() {
    window.alert(
      "O carrinho para lojistas ainda não está disponível."
    );
  }

  function handleProdutoClick(produto) {
    limparBusca();
    navigate(`/produtos/${produto.id}`);
  }

  function handleLojaClick(loja) {
    limparBusca();
    navigate(`/lojas/${loja.id}`);
  }

  function handleServicoClick(servico) {
    limparBusca();
    navigate(`/agendar/${servico.loja_id}/${servico.id}`);
  }

  function handleVerTodos() {
    if (!busca.trim()) return;

    fecharBuscaCompleta();
    limparBusca();

    navigate(`/busca?q=${encodeURIComponent(busca.trim())}`);
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        buscaRef.current &&
        !buscaRef.current.contains(event.target)
      ) {
        fecharBuscaCompleta();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        fecharBuscaCompleta();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () =>
      document.removeEventListener(
        "keydown",
        handleEscape
      );
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (!dropdownAberto || itensNavegacao.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();

          setItemSelecionado((prev) =>
            prev < itensNavegacao.length - 1
              ? prev + 1
              : 0
          );
          break;

        case "ArrowUp":
          event.preventDefault();

          setItemSelecionado((prev) =>
            prev > 0
              ? prev - 1
              : itensNavegacao.length - 1
          );
          break;

        case "Enter": {
          event.preventDefault();

          if (itemSelecionado < 0) {
            handleVerTodos();
            return;
          }

          const item = itensNavegacao[itemSelecionado];

          if (!item) return;

          switch (item.tipo) {
            case "produto":
              handleProdutoClick(item.dados);
              break;

            case "loja":
              handleLojaClick(item.dados);
              break;

            case "servico":
              handleServicoClick(item.dados);
              break;
          }

          break;
        }

        default:
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () =>
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [dropdownAberto, itensNavegacao, itemSelecionado]);

  return (
  <header className="bg-[#0E5617] shadow-md px-4 md:px-6 py-3 font-[Josefin Sans]">
    <div className="flex items-center gap-4">

      {/* Logo */}
      <div
        className="shrink-0 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img
          src="/logo.png"
          alt="PetCare Logo"
          className="h-12 w-auto object-contain"
        />
      </div>

      {/* Área direita */}
      <div className="flex items-center flex-1 min-w-0">

        {/* Busca */}
        <form
          ref={buscaRef}
          onSubmit={(e) => e.preventDefault()}
          className={`
            relative
            transition-all
            duration-300
            flex-1
            ${buscaAtiva ? "mr-0" : "mr-4"}
          `}
        >
          <Search
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-[#0E5617]
              w-5
              h-5
            "
          />

          <input
            type="text"
            value={busca}
            onFocus={() => setBuscaAtiva(true)}
            onChange={(e) => {
              setBusca(e.target.value);
              setItemSelecionado(-1);
            }}
            placeholder="Buscar produtos, lojas, serviços..."
            className="
              w-full
              rounded-full
              border
              border-gray-300
              py-2
              pl-10
              pr-4
              text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-white
            "
          />

          {dropdownAberto && resultados && (
            <SearchDropdown
              busca={busca}
              resultados={resultados}
              loading={loading}
              itemSelecionado={itemSelecionado}
              onProdutoClick={handleProdutoClick}
              onLojaClick={handleLojaClick}
              onServicoClick={handleServicoClick}
              onVerTodos={handleVerTodos}
            />
          )}
        </form>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8 shrink-0">

          {usuario?.tipo === "lojista" ? (
            <>
              <div
                className="flex flex-col items-center cursor-pointer text-white"
                onClick={handlePainel}
              >
                <ClipboardList className="w-7 h-7" />
                <span className="text-sm">Painel</span>
              </div>

              <div
                className="flex flex-col items-center cursor-pointer text-white"
                onClick={handleCarrinhoLojista}
              >
                <ShoppingCart className="w-7 h-7" />
                <span className="text-sm">Carrinho</span>
              </div>
            </>
          ) : (
            <>
              <div
                className="flex flex-col items-center cursor-pointer text-white"
                onClick={() => navigate("/carrinho")}
              >
                <ShoppingCart className="w-7 h-7" />
                <span className="text-sm">Carrinho</span>
              </div>

              <div
                className="flex flex-col items-center cursor-pointer text-white"
                onClick={handlePerfil}
              >
                <User className="w-7 h-7" />
                <span className="text-sm">Conta</span>
              </div>
            </>
          )}

        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center shrink-0">

          {buscaAtiva ? (
            <button
              type="button"
              onClick={fecharBuscaCompleta}
              className="ml-3 text-white"
            >
              <X className="w-7 h-7" />
            </button>
          ) : (
            <div className="flex items-center gap-5 ml-3">

              {usuario?.tipo === "lojista" ? (
                <>
                  <ClipboardList
                    className="w-7 h-7 text-white cursor-pointer"
                    onClick={handlePainel}
                  />

                  <ShoppingCart
                    className="w-7 h-7 text-white cursor-pointer"
                    onClick={handleCarrinhoLojista}
                  />
                </>
              ) : (
                <>
                  <ShoppingCart
                    className="w-7 h-7 text-white cursor-pointer"
                    onClick={() => navigate("/carrinho")}
                  />

                  <User
                    className="w-7 h-7 text-white cursor-pointer"
                    onClick={handlePerfil}
                  />
                </>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  </header>
  );
}