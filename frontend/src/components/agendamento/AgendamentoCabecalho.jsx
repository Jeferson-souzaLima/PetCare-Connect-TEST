import { getMediaUrl, IMAGEM_PADRAO_LOJA } from "@/services/mediaUrl";
import { useState } from "react";
import { Clock3, CreditCard, MapPin, Store } from "lucide-react";

import { formatarMoeda } from "../../utils/formatadores";

/** Cabeçalho do agendamento: loja, serviço, endereço, duração, valor e descrição. */
export default function AgendamentoCabecalho({ loja, servico }) {
  const [descricaoExpandida, setDescricaoExpandida] = useState(false);

  return (
    <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">

      <div className="h-2 bg-[#0E5617]" />

      <div className="p-6 md:p-8">

        <div className="flex items-center gap-4">

          {/* LOGO */}
          <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center">
            <img
              src={getMediaUrl(loja?.imagem, IMAGEM_PADRAO_LOJA)}
              alt={loja?.nome_fantasia || "Loja"}
              className="w-full h-full object-contain p-2"
            />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0E5617]">
              Agendamento
            </p>

            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-gray-900">
              {servico?.nome}
            </h1>

            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
              <Store className="w-4 h-4 text-[#0E5617]" />
              <span>
                {loja?.nome_fantasia || "Loja"}
              </span>
            </div>
          </div>
        </div>

        {/* ENDEREÇO REAL */}
        {(loja?.endereco ||
          loja?.cidade ||
          loja?.cep) && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-[#0E5617]" />

              <div className="text-sm">
                {loja?.endereco && (
                  <p className="font-medium text-gray-800">
                    {loja.endereco}
                  </p>
                )}

                {(loja?.cidade || loja?.uf) && (
                  <p className="mt-0.5 text-gray-600">
                    {loja?.cidade}
                    {loja?.uf ? ` - ${loja.uf}` : ""}
                  </p>
                )}

                {loja?.cep && (
                  <p className="mt-0.5 text-gray-500">
                    CEP: {loja.cep}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DADOS DO SERVIÇO */}
        <div className="grid grid-cols-2 gap-3 mt-5">

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock3 className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Duração
              </span>
            </div>

            <p className="mt-2 text-lg font-bold text-gray-900">
              {servico?.duracao_min} min
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Valor
              </span>
            </div>

            <p className="mt-2 text-lg font-bold text-[#0E5617]">
              {formatarMoeda(servico?.preco)}
            </p>
          </div>

        </div>

        {/* DESCRIÇÃO */}
        {servico?.descricao && (
          <div className="mt-6">

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Sobre o serviço
            </p>

            <p
              className={`mt-2 text-gray-700 leading-relaxed ${
                descricaoExpandida
                  ? ""
                  : "line-clamp-3"
              }`}
            >
              {servico.descricao}
            </p>

            {servico.descricao.length > 180 && (
              <button
                type="button"
                onClick={() =>
                  setDescricaoExpandida(
                    !descricaoExpandida
                  )
                }
                className="mt-2 text-sm font-semibold text-[#0E5617] hover:underline"
              >
                {descricaoExpandida
                  ? "Ver menos"
                  : "Ver mais"}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
