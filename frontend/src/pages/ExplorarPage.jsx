import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { RotateCcw, Search, X } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { HomeHeader } from "@/components/home/HomeHeader";
import { BarraInferiorCliente } from "@/components/navigation/BarraInferiorCliente";
import { LojaSection } from "@/components/sections/LojaSection";
import { ProductSection } from "@/components/sections/ProductSection";
import { ServicosSection } from "@/components/sections/ServicosSection";
import { useAuth } from "@/hooks/useAuth";
import { useListaExplorar } from "@/hooks/useListaExplorar";
import { useLocalizacao } from "@/hooks/useLocalizacao";
import { FILTROS_EXPLORAR, TIPOS_EXPLORAR, filtrosDaUrl } from "@/utils/explorar";
import { rotuloLocalizacao } from "@/utils/localizacao";

const ESPERA_DIGITACAO_MS = 350;

function Lista({ tipo, lista }) {
  const props = { onCarregarMais: lista.carregarMais, temMais: lista.temMais, carregandoMais: lista.carregandoMais };
  if (tipo === "lojas") return <LojaSection lojas={lista.itens} {...props} />;
  if (tipo === "servicos") return <ServicosSection servicos={lista.itens} {...props} />;
  return <ProductSection produtos={lista.itens} {...props} />;
}

function Esqueleto({ tipo }) {
  const quantos = tipo === "produtos" ? 8 : 4;
  return (
    <div aria-hidden="true" className={`grid gap-4 ${tipo === "produtos" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2"}`}>
      {Array.from({ length: quantos }, (_, i) => (
        <div key={i} className={`animate-pulse rounded-pc-card bg-white shadow-pc-card motion-reduce:animate-none ${tipo === "produtos" ? "h-64" : "h-28"}`} />
      ))}
    </div>
  );
}

/** Páginas /lojas, /produtos e /servicos: busca, lista em cards e "carregar mais", no visual da nova home. */
export default function ExplorarPage({ tipo }) {
  const { usuario, logout } = useAuth();
  const { localizacao } = useLocalizacao();
  const [searchParams, setSearchParams] = useSearchParams();
  const termoUrl = searchParams.get("q") ?? "";
  const [texto, setTexto] = useState(termoUrl);
  const campoRef = useRef(null);
  const config = TIPOS_EXPLORAR[tipo];
  const filtros = filtrosDaUrl(tipo, searchParams);
  const filtro = FILTROS_EXPLORAR[tipo];
  const valorFiltro = filtros[filtro.parametro] ?? "";
  const lista = useListaExplorar(tipo, { termo: termoUrl, filtros, localizacao });

  // Atualiza um parâmetro da URL mantendo os outros (busca e filtro andam juntos).
  const trocarParametro = useCallback(
    (nome, valor) =>
      setSearchParams(
        (atuais) => {
          const proximos = new URLSearchParams(atuais);
          proximos.delete("buscar");
          if (valor) proximos.set(nome, valor);
          else proximos.delete(nome);
          return proximos;
        },
        { replace: true }
      ),
    [setSearchParams]
  );

  // Vindo do "Explorar" da barra (?buscar=1): o campo de busca já abre com o foco.
  useEffect(() => {
    if (searchParams.get("buscar") === "1") campoRef.current?.focus();
  }, [searchParams]);

  // A busca vai para a URL depois de uma pausa na digitação (dá para voltar e compartilhar o link).
  useEffect(() => {
    if (texto.trim() === termoUrl) return undefined;
    const id = setTimeout(() => trocarParametro("q", texto.trim()), ESPERA_DIGITACAO_MS);
    return () => clearTimeout(id);
  }, [texto, termoUrl, trocarParametro]);

  const perto = lista.fonte === "proximidade" ? rotuloLocalizacao({ localizacao, usuario }) : null;

  return (
    <div className="min-h-screen bg-pc-fundo pb-[calc(7rem+env(safe-area-inset-bottom))] text-pc-texto md:pb-0">
      <HomeHeader usuario={usuario} logout={logout} pagina />

      <main className="mx-auto max-w-7xl px-4 pb-10 pt-5 md:px-6">
        <h1 className="text-2xl font-bold">{config.titulo}</h1>

        <nav aria-label="Tipo de conteúdo" className="mt-3 flex gap-2 overflow-x-auto">
          {Object.entries(TIPOS_EXPLORAR).map(([chave, { titulo, rota }]) => (
            <NavLink
              key={chave}
              to={termoUrl ? `${rota}?q=${encodeURIComponent(termoUrl)}` : rota}
              className={({ isActive }) =>
                `inline-flex min-h-[40px] items-center rounded-pc-pill px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700 focus-visible:ring-offset-2 ${
                  isActive ? "bg-pc-verde-700 text-white" : "bg-white text-pc-texto shadow-pc-card hover:bg-pc-verde-100"
                }`
              }
            >
              {titulo}
            </NavLink>
          ))}
        </nav>

        <form role="search" onSubmit={(e) => e.preventDefault()} className="relative mt-4">
          <label htmlFor="busca-explorar" className="sr-only">
            {config.placeholder}
          </label>
          <Search size={20} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pc-texto-suave" />
          <input
            ref={campoRef}
            id="busca-explorar"
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={config.placeholder}
            autoComplete="off"
            className="h-12 w-full rounded-pc-pill border-0 bg-white pl-12 pr-12 text-sm shadow-pc-card placeholder:text-pc-texto-suave focus:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
          />
          {texto && (
            <button
              type="button"
              onClick={() => setTexto("")}
              aria-label="Limpar busca"
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-pc-texto-suave hover:bg-pc-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </form>

        <fieldset className="mt-3">
          <legend className="sr-only">{filtro.rotulo}</legend>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filtro.opcoes.map(({ valor, rotulo }) => {
              const ativo = valorFiltro === valor;
              return (
                <button
                  key={valor || "todos"}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => trocarParametro(filtro.parametro, valor)}
                  className={`inline-flex min-h-[36px] shrink-0 items-center rounded-pc-pill border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700 focus-visible:ring-offset-2 ${
                    ativo ? "border-pc-verde-700 bg-pc-verde-100 text-pc-verde-900" : "border-black/10 bg-white text-pc-texto-suave hover:bg-pc-verde-100"
                  }`}
                >
                  {rotulo}
                </button>
              );
            })}
          </div>
        </fieldset>

        <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-pc-texto-suave">
          {lista.estado === "carregando" && "Carregando…"}
          {lista.estado !== "carregando" && termoUrl.trim().length >= 2 && `Resultados para "${termoUrl}"`}
          {lista.estado !== "carregando" && perto && `Perto de: ${perto}`}
        </p>

        <div className="mt-2">
          {lista.estado === "carregando" && <Esqueleto tipo={tipo} />}

          {lista.estado === "erro" && (
            <div role="alert" className="rounded-pc-card bg-white p-6 text-center shadow-pc-card">
              <p className="font-semibold">Não foi possível carregar {config.titulo.toLowerCase()}.</p>
              <p className="mt-1 text-sm text-pc-texto-suave">Confira sua conexão e tente de novo.</p>
              <button
                type="button"
                onClick={lista.tentarDeNovo}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-pc-pill bg-pc-verde-700 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-900 focus-visible:ring-offset-2"
              >
                <RotateCcw size={16} aria-hidden="true" />
                Tentar de novo
              </button>
            </div>
          )}

          {lista.estado === "vazio" && (
            <div className="rounded-pc-card bg-white p-6 text-center shadow-pc-card">
              <p className="font-semibold">{config.vazio}</p>
              {termoUrl && (
                <button
                  type="button"
                  onClick={() => setTexto("")}
                  className="mt-3 text-sm font-semibold text-pc-verde-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
                >
                  Limpar a busca
                </button>
              )}
            </div>
          )}

          {lista.estado === "ok" && <Lista tipo={tipo} lista={lista} />}
        </div>
      </main>

      <Footer />
      <BarraInferiorCliente />
    </div>
  );
}
