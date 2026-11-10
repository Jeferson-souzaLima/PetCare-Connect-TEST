import { Check, Store, Truck } from "lucide-react";

/*
 * Formas de retirada.
 */
const retiradas = [
  {
    id: "retirada",
    nome: "Retirar na loja",
    descricao: "Você busca o pedido na loja.",
    icon: Store,
  },
  {
    id: "entrega",
    nome: "Receber em casa",
    descricao: "Calcularemos a entrega para seu endereço.",
    icon: Truck,
  },
];

/** Escolha entre retirar na loja ou receber em casa. */
export default function OpcoesRecebimento({ retirada, onSelecionar }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-gray-800 mb-3">
        Como você quer receber?
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {retiradas.map((opcao) => {
          const Icon = opcao.icon;
          const selecionada = retirada === opcao.id;

          return (
            <button
              key={opcao.id}
              type="button"
              onClick={() => onSelecionar(opcao.id)}
              className={`
                relative
                text-left
                rounded-2xl
                border
                p-4
                transition-all
                ${
                  selecionada
                    ? "border-green-700 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-green-300 hover:shadow-sm"
                }
              `}
            >
              {selecionada && (
                <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#0E5617] text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </span>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    ${
                      selecionada
                        ? "bg-white text-[#0E5617]"
                        : "bg-gray-50 text-gray-600"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="pr-7">
                  <p
                    className={`font-semibold ${
                      selecionada
                        ? "text-[#0E5617]"
                        : "text-gray-800"
                    }`}
                  >
                    {opcao.nome}
                  </p>

                  <p className="text-sm text-gray-600 mt-1">
                    {opcao.descricao}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
