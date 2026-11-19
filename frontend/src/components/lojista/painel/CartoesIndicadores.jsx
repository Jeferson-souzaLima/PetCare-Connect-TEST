import { ArrowDown, ArrowUp, CalendarDays, Package, ShoppingCart, Users } from "lucide-react";
import { formatarMoeda } from "@/utils/formatadores";
import { descreverVariacao } from "@/utils/painelLojista";

const CARTOES = [
  { id: "vendas", titulo: "Vendas", detalhe: "(30 dias)", icone: ShoppingCart, formatar: formatarMoeda },
  { id: "agendamentos", titulo: "Agendamentos", icone: CalendarDays },
  { id: "pedidos", titulo: "Pedidos", icone: Package },
  { id: "novos_clientes", titulo: "Novos Clientes", icone: Users },
];

const COR_TENDENCIA = { alta: "text-green-700", baixa: "text-red-700", estavel: "text-pc-texto-suave" };

function Variacao({ variacao }) {
  const descricao = descreverVariacao(variacao);
  if (!descricao) return null;
  const Seta = descricao.tendencia === "baixa" ? ArrowDown : ArrowUp;

  return (
    <span className={`flex items-center gap-0.5 whitespace-nowrap text-sm font-semibold ${COR_TENDENCIA[descricao.tendencia]}`}>
      {descricao.tendencia !== "estavel" && <Seta aria-hidden="true" className="h-4 w-4" />}
      {descricao.texto}
      <span className="sr-only"> em relação aos 30 dias anteriores</span>
    </span>
  );
}

/** Indicadores dos últimos 30 dias, com a variação sobre os 30 dias anteriores. */
export function CartoesIndicadores({ indicadores, carregando }) {
  return (
    <section aria-label="Indicadores dos últimos 30 dias" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {CARTOES.map(({ id, titulo, detalhe, icone: Icone, formatar = String }) => {
        const indicador = indicadores?.[id];
        return (
          <article key={id} className="flex items-center gap-3 rounded-pc-card bg-white p-3 shadow-pc-card sm:gap-4 sm:p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E2F2E4] sm:h-14 sm:w-14">
              <Icone aria-hidden="true" className="h-6 w-6 text-pc-verde-700 sm:h-7 sm:w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm text-pc-texto sm:text-base">
                {titulo} {detalhe && <span className="text-xs text-pc-texto-suave">{detalhe}</span>}
              </h2>
              <div className="mt-1 flex flex-wrap items-end justify-between gap-x-2">
                <p className="whitespace-nowrap text-xl font-bold text-pc-texto sm:text-2xl 2xl:text-[26px]">
                  {carregando || !indicador ? "—" : formatar(indicador.atual)}
                </p>
                {!carregando && indicador && <Variacao variacao={indicador.variacao} />}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
