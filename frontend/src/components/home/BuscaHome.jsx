import { useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useBusca } from "@/hooks/useBusca";
import { SearchDropdown } from "@/components/search/SearchDropdown";

/** Busca da home: mesmas sugestões do cabeçalho atual (useBusca + SearchDropdown). */
export function BuscaHome() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const { busca, setBusca, resultados, loading, dropdownAberto, fecharBusca, limparBusca } = useBusca();

  // O contexto recria fecharBusca a cada render; a ref evita registrar o ouvinte de novo.
  const fecharRef = useRef(fecharBusca);
  useLayoutEffect(() => {
    fecharRef.current = fecharBusca;
  });

  useEffect(() => {
    function aoClicarFora(evento) {
      if (formRef.current && !formRef.current.contains(evento.target)) fecharRef.current();
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  function irPara(caminho) {
    fecharBusca();
    limparBusca();
    navigate(caminho);
  }

  function aoEnviar(evento) {
    evento.preventDefault();
    if (busca.trim()) irPara(`/busca?q=${encodeURIComponent(busca.trim())}`);
  }

  return (
    <form ref={formRef} role="search" onSubmit={aoEnviar} className="relative w-full">
      <label htmlFor="busca-home" className="sr-only">
        Buscar produtos, lojas, serviços e clínicas
      </label>
      <Search size={20} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pc-texto-suave" />
      <input
        id="busca-home"
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar produtos, lojas, serviços, clínicas..."
        className="h-12 w-full rounded-pc-pill border-0 bg-white pl-12 pr-4 text-sm text-pc-texto shadow-pc-card placeholder:text-pc-texto-suave focus:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60"
      />
      {dropdownAberto && resultados && (
        <SearchDropdown
          busca={busca}
          resultados={resultados}
          loading={loading}
          itemSelecionado={-1}
          onProdutoClick={(produto) => irPara(`/produtos/${produto.id}`)}
          onLojaClick={(loja) => irPara(`/lojas/${loja.id}`)}
          onServicoClick={(servico) => irPara(`/agendar/${servico.loja_id}/${servico.id}`)}
          onVerTodos={() => busca.trim() && irPara(`/busca?q=${encodeURIComponent(busca.trim())}`)}
        />
      )}
    </form>
  );
}
