import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProdutoCardHome } from "./ProdutoCardHome";

// Até existir preço promocional não usamos "Ofertas da Semana". "Perto de você" só
// quando os produtos vieram da busca por proximidade.
const TITULO_PROXIMIDADE = "Destaques perto de você";
const TITULO_GERAL = "Destaques";
const LIMITE = 12;

export function VitrineProdutos({ produtos, carregando, logado, porProximidade }) {
  const lista = (produtos ?? []).slice(0, LIMITE);
  if (!carregando && lista.length === 0) return null;

  return (
    <section aria-labelledby="titulo-vitrine">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="titulo-vitrine" className="flex items-center gap-2 text-lg font-bold text-pc-texto md:text-xl">
          <Sparkles size={22} aria-hidden="true" className="text-pc-verde-700" />
          {porProximidade ? TITULO_PROXIMIDADE : TITULO_GERAL}
        </h2>
        <Link to="/?categoria=produtos#explorar" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-pc-verde-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-verde-700/40">
          Ver mais <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      {carregando && lista.length === 0 ? (
        <div className="flex gap-3 overflow-hidden" aria-busy="true" aria-label="Carregando produtos">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-60 w-40 shrink-0 animate-pulse rounded-pc-card bg-white shadow-pc-card sm:w-48" />
          ))}
        </div>
      ) : (
        <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          {lista.map((produto) => (
            <li key={produto.id} className="w-40 shrink-0 snap-start sm:w-48">
              <ProdutoCardHome produto={produto} logado={logado} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
