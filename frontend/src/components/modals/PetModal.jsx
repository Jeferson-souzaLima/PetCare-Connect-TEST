import { useState } from "react";
import petService from "../../services/petService";

export default function PetModal({ token, onClose, onPetSalvo, petExistente = null }) {
  const [novoPet, setNovoPet] = useState(
    petExistente || { nome: "", especie: "", raca: "", idade: "", imagem: null }
  );
  const [salvandoPet, setSalvandoPet] = useState(false);

  async function salvarPet(e) {
    e.preventDefault();
    if (!novoPet.nome || !novoPet.especie) return alert("Nome e espécie são obrigatórios");

    setSalvandoPet(true);

    try {
      const formData = new FormData();
      formData.append("nome", novoPet.nome);
      formData.append("especie", novoPet.especie);
      formData.append("raca", novoPet.raca);
      formData.append("idade", novoPet.idade);

      if (novoPet.imagem instanceof File) {
        formData.append("imagem", novoPet.imagem);
      }

      let response;

      if (petExistente) {
        // ATUALIZAR
        response = await petService.atualizarPet(petExistente.id, formData, token);
      } else {
        // CRIAR
        response = await petService.criar(formData, token);
      }

      onPetSalvo(response.data);
      onClose();

    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao salvar o pet.");
    } finally {
      setSalvandoPet(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {petExistente ? "Editar Pet" : "Cadastrar Novo Pet"}
        </h2>

        <form onSubmit={salvarPet} className="space-y-3">
          
          <input
            type="text"
            placeholder="Nome"
            className="w-full border p-2 rounded"
            value={novoPet.nome}
            onChange={(e) => setNovoPet({ ...novoPet, nome: e.target.value })}
            required
          />

          <input
            type="text"
            placeholder="Espécie"
            className="w-full border p-2 rounded"
            value={novoPet.especie}
            onChange={(e) => setNovoPet({ ...novoPet, especie: e.target.value })}
            required
          />

          <input
            type="text"
            placeholder="Raça"
            className="w-full border p-2 rounded"
            value={novoPet.raca}
            onChange={(e) => setNovoPet({ ...novoPet, raca: e.target.value })}
          />

          <input
            type="number"
            placeholder="Idade"
            className="w-full border p-2 rounded"
            value={novoPet.idade}
            onChange={(e) => setNovoPet({ ...novoPet, idade: e.target.value })}
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNovoPet({ ...novoPet, imagem: e.target.files[0] })}
          />

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 rounded"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-green-900 text-white rounded"
              disabled={salvandoPet}
            >
              {salvandoPet ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}