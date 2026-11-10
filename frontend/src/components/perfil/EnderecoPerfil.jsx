import { FaMapMarkerAlt, FaPen } from "react-icons/fa";

import EnderecoPerfilResumo from "./EnderecoPerfilResumo";
import FormularioEnderecoPerfil from "./FormularioEnderecoPerfil";

/** Bloco "Endereço" dos dados da conta: resumo ou formulário de edição. */
export default function EnderecoPerfil({
  usuario,
  editandoEndereco,
  onAlternarEdicao,
  ...formulario
}) {
  return (
    <div className="border-t border-gray-100 pt-6">

      <div className="flex items-center justify-between gap-4 mb-4">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-xl bg-green-50 text-[#0E5617] flex items-center justify-center">
            <FaMapMarkerAlt />
          </div>

          <div>
            <h3 className="font-bold text-gray-800">
              Endereço
            </h3>

            <p className="text-sm text-gray-500">
              Usado para entregas
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={onAlternarEdicao}
          className="w-9 h-9 rounded-lg bg-gray-50 text-[#0E5617] flex items-center justify-center hover:bg-green-50 transition"
          aria-label="Editar endereço"
        >
          <FaPen className="text-sm" />
        </button>

      </div>

      {!editandoEndereco ? (
        <EnderecoPerfilResumo usuario={usuario} />
      ) : (
        <FormularioEnderecoPerfil {...formulario} />
      )}

    </div>
  );
}
