import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { formatarDataHora } from "@/utils/formatadores";
import { BlocoResumo } from "./BlocoResumo";

export function ProximosAgendamentos({ estado, itens }) {
  return (
    <BlocoResumo
      titulo="Próximos Agendamentos"
      icone={CalendarDays}
      estado={estado}
      link={{ destino: "/meus-agendamentos", rotulo: "Ver todos" }}
      vazio={
        <p className="text-sm text-pc-texto-suave">
          Nenhum agendamento.{" "}
          <Link to="/servicos" className="font-semibold text-pc-verde-700 hover:underline">Agendar um serviço</Link>
        </p>
      }
    >
      <ul className="space-y-2">
        {itens.map((a) => (
          <li key={a.id} className="rounded-xl bg-pc-fundo p-3">
            <p className="text-sm font-semibold text-pc-texto">{a.servico_nome}</p>
            <p className="text-xs text-pc-texto-suave">
              {formatarDataHora(a.data_inicio)}
              {a.pet_nome ? ` · ${a.pet_nome}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </BlocoResumo>
  );
}
