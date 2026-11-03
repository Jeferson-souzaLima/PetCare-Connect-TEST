import { CalendarDays, Check, Clock3 } from "lucide-react";

import CabecalhoSecao from "../ui/CabecalhoSecao";
import { formatarDataISO } from "../../utils/formatadores";

/** Escolha da data e de um dos horários disponíveis na agenda da loja. */
export default function SeletorDataHorario({
  data,
  hora,
  setHora,
  dataMinima,
  horariosDisponiveis,
  carregandoHorarios,
  onAlterarData,
}) {
  return (
    <section className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">

      <CabecalhoSecao
        icon={CalendarDays}
        titulo="Escolha o atendimento"
        descricao="Selecione a data e depois um horário disponível."
        className="mb-5"
      />

      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-2">
          Data
        </label>

        <input
          type="date"
          className="
            w-full
            p-3.5
            rounded-xl
            bg-white
            border
            border-gray-300
            outline-none
            focus:border-green-600
            focus:ring-2
            focus:ring-green-100
          "
          value={data}
          min={dataMinima}
          onChange={(e) => onAlterarData(e.target.value)}
        />
      </div>

      <div className="mt-5">

        <div className="flex items-center justify-between gap-3 mb-3">
          <label className="text-sm font-semibold text-gray-700">
            Horário
          </label>

          {data && !carregandoHorarios && (
            <span className="text-xs text-gray-500">
              {horariosDisponiveis.length}{" "}
              {horariosDisponiveis.length === 1
                ? "horário disponível"
                : "horários disponíveis"}
            </span>
          )}
        </div>

        {!data ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center">
            <Clock3 className="w-6 h-6 mx-auto text-gray-400" />

            <p className="mt-2 text-sm text-gray-500">
              Escolha uma data para visualizar os horários.
            </p>
          </div>
        ) : carregandoHorarios ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
            <div className="w-7 h-7 border-4 border-green-100 border-t-[#0E5617] rounded-full animate-spin mx-auto" />

            <p className="mt-3 text-sm text-gray-500">
              Buscando horários disponíveis...
            </p>
          </div>
        ) : horariosDisponiveis.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
            <Clock3 className="w-7 h-7 mx-auto text-gray-400" />

            <p className="mt-2 font-semibold text-gray-700">
              Nenhum horário disponível
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Escolha outra data para consultar a agenda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {horariosDisponiveis.map((horario) => (
              <button
                key={horario}
                type="button"
                onClick={() => setHora(horario)}
                className={`
                  flex
                  items-center
                  justify-center
                  gap-1.5
                  p-3
                  rounded-xl
                  border
                  font-semibold
                  transition
                  ${
                    hora === horario
                      ? "bg-[#0E5617] text-white border-[#0E5617] shadow-sm"
                      : "bg-white text-gray-700 border-gray-300 hover:border-green-500 hover:bg-green-50"
                  }
                `}
              >
                <Clock3 className="w-4 h-4" />
                {horario}
              </button>
            ))}
          </div>
        )}

        {data && hora && (
          <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-3 flex items-center gap-2 text-sm text-green-800">
            <Check className="w-4 h-4 shrink-0" />

            <span>
              Atendimento em{" "}
              <strong>
                {formatarDataISO(data)}
              </strong>{" "}
              às <strong>{hora}</strong>.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
