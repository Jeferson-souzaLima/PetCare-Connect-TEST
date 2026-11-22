import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CalendarDays, Package, PackageCheck, Rocket, Search, ShieldCheck, Undo2, Wallet, X } from "lucide-react";
import { ArtigoAjuda } from "@/components/lojista/ajuda/ArtigoAjuda";
import { ContatoSuporte } from "@/components/lojista/ajuda/ContatoSuporte";
import { ARTIGOS_AJUDA, TOPICOS_AJUDA, filtrarArtigos } from "@/utils/ajudaLojista";

const ICONES_TOPICO = {
  comecar: Rocket,
  recebimentos: Wallet,
  pedidos: PackageCheck,
  agenda: CalendarDays,
  estornos: Undo2,
  catalogo: Package,
  conta: ShieldCheck,
};

const CHIP = "shrink-0 rounded-pc-pill border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60";
const CHIP_ATIVO = "border-pc-verde-900 bg-pc-verde-900 text-white";
const CHIP_INATIVO = "border-gray-200 bg-white text-pc-texto hover:border-pc-verde-700/40 hover:bg-pc-verde-100";

export default function AjudaSuportePage() {
  const { loja } = useOutletContext();
  const [termo, setTermo] = useState("");
  const [topico, setTopico] = useState(null);

  const artigos = useMemo(() => filtrarArtigos(ARTIGOS_AJUDA, { termo, topico }), [termo, topico]);
  const buscando = termo.trim().length >= 2;
  const grupos = TOPICOS_AJUDA
    .map((t) => ({ ...t, artigos: artigos.filter((artigo) => artigo.topico === t.id) }))
    .filter((grupo) => grupo.artigos.length);

  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="rounded-pc-card bg-gradient-to-br from-pc-verde-900 to-pc-verde-700 p-5 text-white shadow-pc-card sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Central de Ajuda</h1>
        <p className="mt-1 text-white/85">Tire dúvidas sobre vendas, recebimentos, agenda e sua conta.</p>

        <form role="search" onSubmit={(evento) => evento.preventDefault()} className="relative mt-5 max-w-2xl">
          <label htmlFor="busca-ajuda" className="sr-only">Buscar na Central de Ajuda</label>
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-pc-texto-suave" />
          <input
            id="busca-ajuda"
            type="search"
            value={termo}
            onChange={(evento) => setTermo(evento.target.value)}
            placeholder="Ex.: comissão, estorno, frete"
            autoComplete="off"
            className="w-full rounded-pc-pill border-0 bg-white py-3 pl-12 pr-12 text-pc-texto placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-pc-lima/70 [&::-webkit-search-cancel-button]:hidden"
          />
          {termo && (
            <button
              type="button"
              onClick={() => setTermo("")}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-pc-texto-suave hover:bg-gray-100"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          )}
        </form>

        <a href="#titulo-contato" className="mt-4 inline-block text-sm font-semibold text-pc-lima underline-offset-4 hover:underline lg:hidden">
          Falar com o suporte
        </a>
      </header>

      <nav aria-label="Temas da ajuda" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap">
        <button type="button" aria-pressed={!topico} onClick={() => setTopico(null)} className={`${CHIP} ${!topico ? CHIP_ATIVO : CHIP_INATIVO}`}>
          Todos
        </button>
        {TOPICOS_AJUDA.map(({ id, rotulo }) => (
          <button key={id} type="button" aria-pressed={topico === id} onClick={() => setTopico(topico === id ? null : id)} className={`${CHIP} ${topico === id ? CHIP_ATIVO : CHIP_INATIVO}`}>
            {rotulo}
          </button>
        ))}
      </nav>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-12 lg:items-start">
        <div className="space-y-4 sm:space-y-5 lg:col-span-8">
          <p aria-live="polite" className="sr-only">
            {buscando ? `${artigos.length} resultado(s) para "${termo.trim()}"` : ""}
          </p>

          {grupos.map(({ id, rotulo, artigos: artigosDoTopico }) => {
            const Icone = ICONES_TOPICO[id];
            return (
              <section key={id} aria-labelledby={`topico-${id}`} className="rounded-pc-card bg-white p-4 shadow-pc-card sm:p-6">
                <h2 id={`topico-${id}`} className="mb-3 flex items-center gap-2 text-lg font-bold text-pc-texto">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pc-verde-100">
                    <Icone aria-hidden="true" className="h-5 w-5 text-pc-verde-700" />
                  </span>
                  {rotulo}
                </h2>
                <div className="space-y-2">
                  {artigosDoTopico.map((artigo) => (
                    // A chave muda com a busca para abrir as respostas encontradas.
                    <ArtigoAjuda key={`${artigo.id}-${buscando}`} artigo={artigo} aberto={buscando} />
                  ))}
                </div>
              </section>
            );
          })}

          {!grupos.length && (
            <section className="rounded-pc-card bg-white p-6 text-center shadow-pc-card">
              <p className="font-semibold text-pc-texto">Nenhuma resposta encontrada para "{termo.trim()}".</p>
              <p className="mt-1 text-sm text-pc-texto-suave">Tente outras palavras ou fale com o suporte, ao lado.</p>
              <button
                type="button"
                onClick={() => { setTermo(""); setTopico(null); }}
                className="mt-4 rounded-pc-pill border border-pc-verde-700 px-4 py-2 text-sm font-semibold text-pc-verde-700 hover:bg-pc-verde-100"
              >
                Ver todas as perguntas
              </button>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:col-span-4">
          <ContatoSuporte loja={loja} />
        </aside>
      </div>
    </div>
  );
}
