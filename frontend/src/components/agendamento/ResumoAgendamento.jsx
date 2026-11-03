import { CreditCard, ShoppingBag } from "lucide-react";

import CabecalhoSecao from "../ui/CabecalhoSecao";
import { formatarDataISO, formatarMoeda } from "../../utils/formatadores";

/** Resumo final: dados escolhidos, valores e total. */
export default function ResumoAgendamento({
  pets,
  petSelecionado,
  servico,
  loja,
  data,
  hora,
  transporte,
  observacoes,
  precoServico,
  frete,
  calculandoFrete,
  total,
  erro,
}) {
  return (
    <section className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">

      <CabecalhoSecao
        icon={ShoppingBag}
        titulo="Confira seu agendamento"
        descricao="Revise as informações antes de continuar."
        className="mb-5"
      />

      <div className="space-y-3 text-sm">

        <div className="flex justify-between gap-4">
          <span className="text-gray-500">
            Pet
          </span>

          <span className="font-semibold text-gray-800 text-right">
            {pets.find(
              (p) => p.id == petSelecionado
            )?.nome || "-"}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-500">
            Serviço
          </span>

          <span className="font-semibold text-gray-800 text-right">
            {servico?.nome || "-"}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-500">
            Loja
          </span>

          <span className="font-semibold text-gray-800 text-right">
            {loja?.nome_fantasia || "-"}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-500">
            Data
          </span>

          <span className="font-semibold text-gray-800 text-right">
            {data ? formatarDataISO(data) : "-"}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-500">
            Horário
          </span>

          <span className="font-semibold text-gray-800 text-right">
            {hora || "-"}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-500">
            Atendimento
          </span>

          <span className="font-semibold text-gray-800 text-right">
            {transporte === "com"
              ? "Busca e entrega"
              : transporte === "sem"
              ? "No estabelecimento"
              : "-"}
          </span>
        </div>

        {observacoes && (
          <div className="pt-2">
            <p className="text-gray-500 mb-1">
              Observações
            </p>

            <p className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-gray-700 whitespace-pre-wrap">
              {observacoes}
            </p>
          </div>
        )}
      </div>

      <hr className="my-5" />

      <div className="space-y-3">

        <div className="flex justify-between gap-4 text-sm">
          <span className="text-gray-500">
            Serviço
          </span>

          <span className="font-medium text-gray-800">
            {formatarMoeda(precoServico)}
          </span>
        </div>

        {transporte === "com" && (
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-gray-500">
              Busca e entrega
            </span>

            <span className="font-medium text-gray-800">
              {calculandoFrete
                ? "Calculando..."
                : formatarMoeda(frete)}
            </span>
          </div>
        )}
      </div>

      <hr className="my-5" />

      <div className="flex items-center justify-between gap-4">

        <div>
          <p className="text-sm text-gray-500">
            Total
          </p>

          <p className="text-2xl font-bold text-[#0E5617]">
            {formatarMoeda(total)}
          </p>
        </div>

        <CreditCard className="w-7 h-7 text-gray-300" />
      </div>

      {erro && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">
            {erro}
          </p>
        </div>
      )}
    </section>
  );
}
