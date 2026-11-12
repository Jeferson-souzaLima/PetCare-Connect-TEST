import { useId } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw } from "lucide-react";

/**
 * Faixa horizontal da home (lojas, destaques ou serviços) com título, "Ver mais" e os estados
 * carregando, vazio e erro. `larguraItem` define a largura de cada card na faixa.
 */
export function FaixaHome({ titulo, icone: Icone, verMais, faixa, larguraItem, alturaEsqueleto, vazio, aoTentarDeNovo, renderItem }) {
  const tituloId = useId();
  const { itens, estado } = faixa;

  return (
    <section aria-labelledby={tituloId}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id={tituloId} className="flex items-center gap-2 text-lg font-bold text-pc-texto md:text-xl">
          <Icone size={22} aria-hidden="true" className="shrink-0 text-pc-verde-700" />
          {titulo}
        </h2>
        <Link
          to={verMais}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1 text-sm font-semibold text-pc-verde-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-verde-700/40"
        >
          Ver mais <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {estado === "carregando" && (
        <div className="flex gap-3 overflow-hidden" aria-busy="true" aria-label={`Carregando ${titulo.toLowerCase()}`}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${larguraItem} ${alturaEsqueleto} shrink-0 animate-pulse rounded-pc-card bg-white shadow-pc-card motion-reduce:animate-none`} />
          ))}
        </div>
      )}

      {estado === "vazio" && <p className="rounded-pc-card bg-white p-4 text-sm text-pc-texto-suave shadow-pc-card">{vazio}</p>}

      {estado === "erro" && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-pc-card bg-white p-4 text-sm shadow-pc-card">
          <span>Não foi possível carregar agora.</span>
          <button
            type="button"
            onClick={aoTentarDeNovo}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-pc-pill px-3 font-semibold text-pc-verde-700 hover:bg-pc-verde-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
          >
            <RotateCcw size={16} aria-hidden="true" /> Tentar de novo
          </button>
        </div>
      )}

      {estado === "ok" && (
        <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          {itens.map((item) => (
            <li key={item.id} className={`${larguraItem} shrink-0 snap-start`}>
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
