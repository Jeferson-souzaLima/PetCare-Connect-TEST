import { Link } from "react-router-dom";

/** Moldura dos blocos da coluna direita, com carregando, vazio e erro. */
export function BlocoResumo({ titulo, icone: Icone, estado, link, vazio, children }) {
  const idTitulo = `resumo-${link.destino.replace(/[^a-z0-9]+/gi, "")}`;
  return (
    <section aria-labelledby={idTitulo} className="rounded-pc-card bg-white p-4 shadow-pc-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 id={idTitulo} className="flex items-center gap-2 text-base font-bold text-pc-texto">
          <Icone size={20} aria-hidden="true" className="text-pc-verde-700" />
          {titulo}
        </h2>
        <Link to={link.destino} className="shrink-0 whitespace-nowrap text-sm font-semibold text-pc-verde-700 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-verde-700/40">
          {link.rotulo}
        </Link>
      </div>
      {estado === "carregando" && (
        <div aria-busy="true" aria-label={`Carregando ${titulo.toLowerCase()}`} className="space-y-2">
          <div className="h-12 animate-pulse rounded-xl bg-pc-fundo" />
          <div className="h-12 animate-pulse rounded-xl bg-pc-fundo" />
        </div>
      )}
      {estado === "erro" && <p className="text-sm text-pc-texto-suave">Não foi possível carregar agora. Tente novamente mais tarde.</p>}
      {estado === "vazio" && vazio}
      {estado === "ok" && children}
    </section>
  );
}
