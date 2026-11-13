import { getMediaUrl, IMAGEM_PADRAO_PET } from "@/services/mediaUrl";
import { FaPaw, FaPen, FaPlus, FaTrash } from "react-icons/fa";

/** Seção "Meus pets": listagem com editar/remover e botão de adicionar. */
export default function ListaPets({
  pets,
  loadingPets,
  onEditarPet,
  onRemoverPet,
  onAdicionarPet,
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

      <div className="p-5 md:p-6 border-b border-gray-100">

        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-green-50 text-[#0E5617] flex items-center justify-center">
              <FaPaw />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Meus pets
              </h2>

              <p className="text-sm text-gray-500">
                Cadastre seus pets para facilitar seus atendimentos.
              </p>
            </div>

          </div>

          <span className="hidden sm:block text-sm font-semibold text-gray-400">
            {pets.length}{" "}
            {pets.length === 1 ? "pet" : "pets"}
          </span>

        </div>

      </div>

      <div className="p-5 md:p-6">

        {loadingPets ? (
          <div className="py-10 text-center">
            <div className="w-8 h-8 border-4 border-green-100 border-t-[#0E5617] rounded-full animate-spin mx-auto mb-3" />

            <p className="text-sm text-gray-500">
              Carregando pets...
            </p>
          </div>
        ) : pets.length === 0 ? (
          <div className="py-8 text-center">

            <div className="w-16 h-16 rounded-full bg-green-50 text-[#0E5617] flex items-center justify-center mx-auto mb-4">
              <FaPaw className="text-2xl" />
            </div>

            <h3 className="font-bold text-gray-800">
              Nenhum pet cadastrado
            </h3>

            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Cadastre seu pet para manter os dados dele organizados
              e facilitar futuros atendimentos.
            </p>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {pets.map((pet) => (
              <div
                key={pet.id}
                className="relative bg-gradient-to-br from-green-50 to-green-100 border border-green-100 rounded-2xl p-4 overflow-hidden"
              >

                <div className="flex gap-4">

                  <img
                    src={
                      getMediaUrl(pet.imagem, IMAGEM_PADRAO_PET)
                    }
                    alt={pet.nome}
                    className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover shrink-0"
                  />

                  <div className="flex-1 min-w-0 pr-10">

                    <h3 className="text-lg font-bold text-[#0E5617] truncate">
                      {pet.nome}
                    </h3>

                    <div className="space-y-1 mt-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">
                          Raça:
                        </span>{" "}
                        {pet.raca || "Não informada"}
                      </p>

                      <p>
                        <span className="font-medium">
                          Idade:
                        </span>{" "}
                        {pet.idade || "Não informada"}
                      </p>
                    </div>

                  </div>

                </div>

                {/* AÇÕES */}

                <div className="absolute top-3 right-3 flex gap-2">

                  <button
                    type="button"
                    className="w-9 h-9 bg-white rounded-lg text-[#0E5617] shadow-sm hover:bg-green-50 transition flex items-center justify-center"
                    onClick={() => onEditarPet(pet)}
                    aria-label={`Editar ${pet.nome}`}
                  >
                    <FaPen className="text-sm" />
                  </button>

                  <button
                    type="button"
                    className="w-9 h-9 bg-white rounded-lg text-red-500 shadow-sm hover:bg-red-50 transition flex items-center justify-center"
                    onClick={() => onRemoverPet(pet.id)}
                    aria-label={`Remover ${pet.nome}`}
                  >
                    <FaTrash className="text-sm" />
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

        {/* ADICIONAR PET */}

        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-900 text-white rounded hover:bg-green-800"
          onClick={onAdicionarPet}
        >
          <FaPlus />
          Adicionar Pet
        </button>

      </div>

    </section>
  );
}
