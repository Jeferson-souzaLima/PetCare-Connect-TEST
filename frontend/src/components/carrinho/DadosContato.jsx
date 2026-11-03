import { Phone, User } from "lucide-react";

import CabecalhoSecao from "../ui/CabecalhoSecao";

/** Nome e telefone usados para contato sobre o pedido. */
export default function DadosContato({ contato, setContato }) {
  return (
    <section className="mt-8 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <CabecalhoSecao
        icon={User}
        titulo="Dados para contato"
        descricao="Usaremos esses dados para falar sobre o pedido."
        className="mb-4"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-gray-700">
          Nome

          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              type="text"
              value={contato.nome}
              onChange={(e) =>
                setContato({
                  ...contato,
                  nome: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>
        </label>

        <label className="text-sm font-semibold text-gray-700">
          Telefone

          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              type="tel"
              value={contato.telefone}
              onChange={(e) =>
                setContato({
                  ...contato,
                  telefone: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>
        </label>
      </div>
    </section>
  );
}
