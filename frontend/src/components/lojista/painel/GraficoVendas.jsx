import { useState } from "react";
import { ChartColumn } from "lucide-react";
import { formatarMoeda } from "@/utils/formatadores";
import { escalaDoGrafico, moedaDoEixo, rotuloDia } from "@/utils/painelLojista";

const PERIODOS = [
  { dias: 30, rotulo: "Últimos 30 dias" },
  { dias: 7, rotulo: "Últimos 7 dias" },
];

/** Em 30 dias, mostra um rótulo a cada 3 dias (a cada 6 no celular). */
function classeDoRotulo(indice, totalDias) {
  if (totalDias <= 7 || indice % 6 === 0) return "";
  return indice % 3 === 0 ? "hidden md:block" : "hidden";
}

/** Barras com a receita paga por dia (dados do painel: últimos 30 dias). */
export function GraficoVendas({ vendasPorDia = [], carregando }) {
  const [dias, setDias] = useState(30);
  const serie = vendasPorDia.slice(-dias);
  const { topo, marcas } = escalaDoGrafico(serie.map((dia) => dia.receita));
  const semVendas = serie.every((dia) => !dia.receita);

  return (
    <section aria-labelledby="titulo-grafico-vendas" className="rounded-pc-card bg-white p-4 shadow-pc-card sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-grafico-vendas" className="flex items-center gap-2 text-lg font-bold text-pc-texto sm:text-xl">
          <ChartColumn aria-hidden="true" className="h-7 w-7 text-pc-verde-700" />
          Desempenho de Vendas
        </h2>
        <label className="sr-only" htmlFor="periodo-grafico-vendas">Período do gráfico</label>
        <select
          id="periodo-grafico-vendas"
          value={dias}
          onChange={(evento) => setDias(Number(evento.target.value))}
          className="min-h-[40px] rounded-pc-pill border border-gray-300 bg-white px-4 text-sm text-pc-texto focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60"
        >
          {PERIODOS.map((periodo) => <option key={periodo.dias} value={periodo.dias}>{periodo.rotulo}</option>)}
        </select>
      </div>

      {carregando ? (
        <div className="h-56 animate-pulse rounded-xl bg-pc-fundo" />
      ) : (
        <div className="relative">
          <div className="flex h-56 gap-2 sm:h-64" aria-hidden="true">
            <div className="flex flex-col-reverse justify-between pb-6 text-right text-xs text-pc-texto-suave">
              {marcas.map((marca) => <span key={marca} className="leading-none">{moedaDoEixo(marca)}</span>)}
            </div>
            <div className="relative flex flex-1 flex-col">
              <div className="pointer-events-none absolute inset-x-0 bottom-6 top-0 flex flex-col-reverse justify-between">
                {marcas.map((marca) => <span key={marca} className="border-t border-gray-100" />)}
              </div>
              <div className="relative flex flex-1 items-end gap-[3px] sm:gap-1">
                {serie.map((dia) => (
                  <div
                    key={dia.data}
                    title={`${rotuloDia(dia.data)}: ${formatarMoeda(dia.receita)}`}
                    style={{ height: `${(dia.receita / topo) * 100}%` }}
                    className="min-h-[2px] flex-1 rounded-t-[3px] bg-gradient-to-t from-[#A8E68A] to-[#5CC84A]"
                  />
                ))}
              </div>
              <div className="flex h-6 items-end gap-[3px] sm:gap-1">
                {serie.map((dia, indice) => (
                  <span key={dia.data} className="relative flex-1">
                    <span className={`absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-[11px] text-pc-texto-suave ${classeDoRotulo(indice, serie.length)}`}>
                      {rotuloDia(dia.data)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          {semVendas && (
            <p className="absolute inset-x-0 top-1/3 text-center text-sm font-medium text-pc-texto-suave">
              Nenhuma venda paga neste período.
            </p>
          )}
          <table className="sr-only">
            <caption>Receita paga por dia</caption>
            <tbody>
              {serie.map((dia) => (
                <tr key={dia.data}><th scope="row">{rotuloDia(dia.data)}</th><td>{formatarMoeda(dia.receita)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
