import { PawPrint } from "lucide-react";

import CabecalhoSecao from "../ui/CabecalhoSecao";

/** Seleção do pet que receberá o atendimento (ou convite para cadastrar o primeiro). */
export default function SeletorPet({
  pets,
  petSelecionado,
  setPetSelecionado,
  onCadastrarPet,
}) {
  return (
    <section className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">

      <CabecalhoSecao
        icon={PawPrint}
        titulo="Qual é o pet?"
        descricao="Selecione o pet que receberá o atendimento."
        className="mb-4"
      />

      {pets.length > 0 ? (
        <select
          className="
            w-full
            p-3.5
            rounded-xl
            bg-white
            border
            border-gray-300
            text-gray-800
            outline-none
            focus:border-green-600
            focus:ring-2
            focus:ring-green-100
          "
          value={petSelecionado}
          onChange={(e) =>
            setPetSelecionado(e.target.value)
          }
        >
          <option value="">
            Selecionar pet
          </option>

          {pets.map((pet) => (
            <option key={pet.id} value={pet.id}>
              {pet.nome}
            </option>
          ))}
        </select>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-white flex items-center justify-center">
            <PawPrint className="w-7 h-7 text-[#0E5617]" />
          </div>

          <p className="mt-4 font-semibold text-gray-800">
            Você ainda não possui pets cadastrados.
          </p>

          <p className="text-sm text-gray-500 mt-2">
            Cadastre seu primeiro pet para continuar.
          </p>

          <button
            type="button"
            onClick={onCadastrarPet}
            className="
              mt-4
              bg-[#0E5617]
              hover:bg-[#0b4612]
              text-white
              px-5
              py-2.5
              rounded-xl
              font-semibold
              transition
            "
          >
            Cadastrar meu pet
          </button>
        </div>
      )}
    </section>
  );
}
