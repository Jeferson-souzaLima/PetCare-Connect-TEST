import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ChevronRight } from "lucide-react";
import { rotuloAgendamento } from "@/utils/painelLojista";

const FOCO = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60";

/** Próximos agendamentos confirmados da loja (até 3, vindos do painel). */
export function ProximosAgendamentosLojista({ itens = [], carregando }) {
  return (
    <section aria-labelledby="titulo-proximos-lojista" className="rounded-pc-card bg-white p-4 shadow-pc-card sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="titulo-proximos-lojista" className="flex items-center gap-2 text-base font-bold text-pc-texto min-[400px]:text-lg sm:text-xl">
          <CalendarDays aria-hidden="true" className="h-6 w-6 shrink-0 text-pc-verde-700 sm:h-7 sm:w-7" />
          Próximos Agendamentos
        </h2>
        <Link to="/lojista/agenda" className={`flex min-h-[44px] shrink-0 items-center gap-1 whitespace-nowrap rounded-lg text-sm font-semibold text-pc-verde-700 hover:underline ${FOCO}`}>
          Ver todos <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>

      {carregando && <div className="h-40 animate-pulse rounded-xl bg-pc-fundo" />}

      {!carregando && itens.length === 0 && (
        <p className="rounded-xl bg-pc-fundo p-4 text-sm text-pc-texto-suave">
          Nenhum agendamento confirmado pela frente. Os agendamentos pagos aparecem aqui.
        </p>
      )}

      {!carregando && itens.length > 0 && (
        <ul className="space-y-2">
          {itens.map((agendamento) => {
            const detalhe = [agendamento.pet_nome, agendamento.cliente].filter(Boolean).join(" • ");
            return (
              <li key={agendamento.id}>
                <Link
                  to="/lojista/agenda"
                  className={`flex items-center gap-3 rounded-2xl border border-gray-100 p-2.5 hover:bg-pc-fundo sm:gap-4 sm:p-3 ${FOCO}`}
                >
                  <img src="/images/pet-padrao.webp" alt="" width={52} height={52} className="h-12 w-12 shrink-0 rounded-full object-cover sm:h-[52px] sm:w-[52px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-pc-texto">{agendamento.servico}</span>
                    {detalhe && <span className="block truncate text-sm text-pc-texto-suave">{detalhe}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pc-pill bg-[#E2F2E4] px-2.5 py-1.5 text-xs font-medium text-pc-texto sm:px-3 sm:text-sm">
                    <CalendarDays aria-hidden="true" className="hidden h-4 w-4 text-pc-verde-700 min-[400px]:block" />
                    {rotuloAgendamento(agendamento.data_inicio)}
                  </span>
                  <ChevronRight aria-hidden="true" className="hidden h-5 w-5 shrink-0 text-pc-verde-700 sm:block" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
