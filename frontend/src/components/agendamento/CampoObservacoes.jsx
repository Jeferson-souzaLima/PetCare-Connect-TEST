import { PawPrint } from "lucide-react";

import CabecalhoSecao from "../ui/CabecalhoSecao";

/** Campo livre para observações sobre o pet. */
export default function CampoObservacoes({ observacoes, setObservacoes }) {
  return (
    <section className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">

      <CabecalhoSecao
        icon={PawPrint}
        titulo="Observações"
        descricao="Alguma informação importante sobre seu pet?"
        className="mb-4"
      />

      <textarea
        className="
          w-full
          min-h-[110px]
          p-3.5
          rounded-xl
          bg-white
          border
          border-gray-300
          outline-none
          resize-y
          focus:border-green-600
          focus:ring-2
          focus:ring-green-100
        "
        placeholder="Escreva aqui, se necessário..."
        value={observacoes}
        onChange={(e) =>
          setObservacoes(e.target.value)
        }
      />
    </section>
  );
}
