import { Car, Check, Truck } from "lucide-react";

import CabecalhoSecao from "../ui/CabecalhoSecao";
import EnderecoBuscaEntrega from "./EnderecoBuscaEntrega";

const OPCOES_TRANSPORTE = [
  {
    id: "sem",
    titulo: "Levo meu pet",
    descricao: "Você leva o pet até o estabelecimento.",
    icon: Car,
  },
  {
    id: "com",
    titulo: "Busca e entrega",
    descricao: "O valor será calculado de acordo com a localização.",
    icon: Truck,
  },
];

/**
 * Escolha do transporte do pet. Quando "busca e entrega" está selecionada,
 * exibe o endereço/localização usados no cálculo do frete.
 */
export default function SeletorTransporte({
  transporte,
  onSelecionarTransporte,
  ...entrega
}) {
  return (
    <section className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">

      <CabecalhoSecao
        icon={Truck}
        titulo="Como será o transporte?"
        descricao="Escolha como seu pet chegará ao atendimento."
        className="mb-4"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {OPCOES_TRANSPORTE.map((opcao) => {
          const Icon = opcao.icon;
          const selecionada = transporte === opcao.id;

          return (
            <button
              key={opcao.id}
              type="button"
              onClick={() => onSelecionarTransporte(opcao.id)}
              className={`
                relative
                text-left
                rounded-2xl
                border
                p-4
                transition
                ${
                  selecionada
                    ? "border-green-700 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-green-300"
                }
              `}
            >
              {selecionada && (
                <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#0E5617] text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </span>
              )}

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>

                <div className="pr-7">
                  <p className="font-semibold text-gray-800">
                    {opcao.titulo}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {opcao.descricao}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {transporte === "com" && <EnderecoBuscaEntrega {...entrega} />}
    </section>
  );
}
