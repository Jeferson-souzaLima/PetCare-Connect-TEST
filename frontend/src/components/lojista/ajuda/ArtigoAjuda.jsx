import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";

/** Uma pergunta da Central de Ajuda, que abre e fecha (details/summary nativo, acessível por teclado). */
export function ArtigoAjuda({ artigo, aberto }) {
  return (
    <details open={aberto} className="group rounded-xl border border-gray-100 bg-white open:border-pc-verde-700/20 open:bg-pc-verde-100/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-left font-semibold text-pc-texto hover:bg-pc-verde-100/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60 [&::-webkit-details-marker]:hidden">
        {artigo.pergunta}
        <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-pc-verde-700 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-2 px-4 pb-4 text-sm leading-relaxed text-pc-texto-suave">
        {artigo.resposta.map((paragrafo) => (
          <p key={paragrafo}>{paragrafo}</p>
        ))}
        {artigo.link && (
          <Link
            to={artigo.link.destino}
            className="inline-flex items-center gap-1 pt-1 font-semibold text-pc-verde-700 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60"
          >
            {artigo.link.rotulo}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        )}
      </div>
    </details>
  );
}
