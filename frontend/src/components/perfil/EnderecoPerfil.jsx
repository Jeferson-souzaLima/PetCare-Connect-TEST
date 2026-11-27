import { FaPen } from "react-icons/fa";

import EnderecoPerfilResumo from "./EnderecoPerfilResumo";
import FormularioEnderecoPerfil from "./FormularioEnderecoPerfil";

/** Endereço da conta: resumo com botão de editar, ou o formulário. O título fica com quem o usa. */
export default function EnderecoPerfil({
  usuario,
  editandoEndereco,
  onAlternarEdicao,
  ...formulario
}) {
  return (
    <div>

      <div className="mb-2 flex justify-end">

        <button
          type="button"
          onClick={onAlternarEdicao}
          className="w-9 h-9 rounded-lg bg-gray-50 text-[#0E5617] flex items-center justify-center hover:bg-green-50 transition"
          aria-label={editandoEndereco ? "Fechar edição do endereço" : "Editar endereço"}
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
