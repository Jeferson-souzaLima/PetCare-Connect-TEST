import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useBusca } from "@/hooks/useBusca";
import { SearchDropdown } from "@/components/search/SearchDropdown";

const ROTAS = {
  produto: (p) => `/produtos/${p.id}`,
  loja: (l) => `/lojas/${l.id}`,
  servico: (s) => `/agendar/${s.loja_id}/${s.id}`,
};

/**
 * Busca do cabeçalho único do site (HomeHeader), com sugestões e teclado (↑ ↓ Enter Esc).
 * `compacto`: versão baixa do cabeçalho recolhível da home (mesmo campo, menor).
 */
export function BuscaHome({ compacto = false }) {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const { busca, setBusca, resultados, loading, dropdownAberto, fecharBusca, limparBusca } = useBusca();
  const [selecionado, setSelecionado] = useState(-1);

  const itens = useMemo(
    () =>
      resultados
        ? [
            ...resultados.produtos.map((dados) => ({ tipo: "produto", dados })),
            ...resultados.lojas.map((dados) => ({ tipo: "loja", dados })),
            ...resultados.servicos.map((dados) => ({ tipo: "servico", dados })),
          ]
        : [],
    [resultados]
  );

  // O contexto recria fecharBusca a cada render; a ref evita registrar o ouvinte de novo.
  const fecharRef = useRef(fecharBusca);
  useLayoutEffect(() => {
    fecharRef.current = fecharBusca;
  });

  useEffect(() => {
    function aoClicarFora(evento) {
      if (formRef.current && !formRef.current.contains(evento.target)) {
        fecharRef.current();
        setSelecionado(-1);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  function irPara(caminho) {
    fecharBusca();
    limparBusca();
    setSelecionado(-1);
    navigate(caminho);
  }

  const verTodos = () => busca.trim() && irPara(`/busca?q=${encodeURIComponent(busca.trim())}`);

  function aoTeclar(evento) {
    if (evento.key === "Escape") {
      fecharBusca();
      setSelecionado(-1);
      return;
    }
    if (!dropdownAberto || itens.length === 0) return;
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setSelecionado((i) => (i < itens.length - 1 ? i + 1 : 0));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setSelecionado((i) => (i > 0 ? i - 1 : itens.length - 1));
    } else if (evento.key === "Enter" && selecionado >= 0) {
      evento.preventDefault();
      const item = itens[selecionado];
      if (item) irPara(ROTAS[item.tipo](item.dados));
    }
  }

  function aoEnviar(evento) {
    evento.preventDefault();
    // Só o Enter no campo envia a busca; cliques nos resultados navegam pelos próprios handlers.
    const origem = evento.nativeEvent?.submitter;
    if (origem && origem.id !== "busca-home-enviar") return;
    verTodos();
  }

  return (
    // No compacto o campo é estreito: as sugestões se abrem na largura do cabeçalho (o elemento
    // posicionado mais próximo passa a ser ele), alinhadas às margens do conteúdo.
    <form ref={formRef} role="search" onSubmit={aoEnviar} className={compacto ? "w-full" : "relative w-full"}>
      <label htmlFor="busca-home" className="sr-only">
        Buscar produtos, lojas, serviços e clínicas
      </label>
      <div className="relative">
        <Search
          size={compacto ? 18 : 20}
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-pc-texto-suave ${compacto ? "left-3" : "left-4"}`}
        />
        <input
          id="busca-home"
          type="search"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setSelecionado(-1);
          }}
          onKeyDown={aoTeclar}
          autoComplete="off"
          placeholder={compacto ? "Buscar..." : "Buscar produtos, lojas, serviços, clínicas..."}
          className={`${compacto ? "h-10 pl-9 pr-2" : "h-12 pl-12 pr-4"} w-full rounded-pc-pill border-0 bg-white text-sm text-pc-texto shadow-pc-card transition-[height] duration-300 placeholder:text-pc-texto-suave focus:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60`}
        />
      </div>
      <button id="busca-home-enviar" type="submit" className="sr-only">
        Buscar
      </button>
      {dropdownAberto && resultados && (
        <div className={compacto ? "absolute inset-x-4 top-full" : undefined}>
          <SearchDropdown
            busca={busca}
            resultados={resultados}
            loading={loading}
            itemSelecionado={selecionado}
            onProdutoClick={(produto) => irPara(ROTAS.produto(produto))}
            onLojaClick={(loja) => irPara(ROTAS.loja(loja))}
            onServicoClick={(servico) => irPara(ROTAS.servico(servico))}
            onVerTodos={verTodos}
          />
        </div>
      )}
    </form>
  );
}
