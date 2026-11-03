import { FaChevronDown, FaChevronUp, FaCog, FaSignOutAlt } from "react-icons/fa";

import DadosPessoais from "./DadosPessoais";
import EnderecoPerfil from "./EnderecoPerfil";
import MensagemStatus from "../ui/MensagemStatus";

/** Painel recolhível "Dados da conta": dados pessoais, endereço e sair. */
export default function DadosConta({
  showUserData,
  onAlternarDados,
  dadosPessoais,
  endereco,
  mensagemPerfil,
  onSair,
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

      <button
        type="button"
        onClick={onAlternarDados}
        className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-xl bg-green-50 text-[#0E5617] flex items-center justify-center shrink-0">
            <FaCog />
          </div>

          <div>
            <h2 className="font-bold text-gray-800">
              Dados da conta
            </h2>

            <p className="text-sm text-gray-500">
              Dados pessoais e endereço
            </p>
          </div>

        </div>

        <div className="text-[#0E5617]">
          {showUserData ? (
            <FaChevronUp />
          ) : (
            <FaChevronDown />
          )}
        </div>
      </button>

      <div
        className={`
          overflow-hidden
          transition-all duration-300 ease-out
          ${
            showUserData
              ? "max-h-[1800px] opacity-100"
              : "max-h-0 opacity-0"
          }
        `}
      >
        <div className="border-t border-gray-100 p-5 md:p-6 space-y-6">

          {/* DADOS PESSOAIS */}

          <DadosPessoais {...dadosPessoais} />

          {/* ENDEREÇO */}

          <EnderecoPerfil {...endereco} />

          {/* MENSAGEM PERFIL */}

          <MensagemStatus mensagem={mensagemPerfil} />

          {/* SAIR */}

          <div className="border-t border-gray-100 pt-5">

            <button
              type="button"
              onClick={onSair}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition"
            >
              <FaSignOutAlt />
              Sair da conta
            </button>

          </div>

        </div>
      </div>
    </section>
  );
}
