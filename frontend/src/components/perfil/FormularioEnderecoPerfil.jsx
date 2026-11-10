import MensagemStatus from "../ui/MensagemStatus";

/** Formulário de edição do endereço do perfil, com busca por CEP. */
export default function FormularioEnderecoPerfil({
  enderecoForm,
  setEnderecoForm,
  buscarCep,
  buscandoCep,
  mensagemEndereco,
  salvarEndereco,
  salvandoEndereco,
  usandoLocalizacao,
  cancelarEdicaoEndereco,
}) {
  return (
    <div className="space-y-4">

      {/* CEP */}

      <div>
        <label className="text-xs font-medium text-gray-500">
          CEP
        </label>

        <div className="flex gap-2 mt-1">

          <input
            type="text"
            value={enderecoForm.cep}
            onChange={(e) =>
              setEnderecoForm({
                ...enderecoForm,
                cep: e.target.value
              })
            }
            placeholder="Digite o CEP"
            maxLength={9}
            disabled={buscandoCep}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
          />

          <button
            type="button"
            onClick={buscarCep}
            disabled={buscandoCep}
            className="px-4 md:px-5 py-3 bg-[#0E5617] text-white rounded-xl hover:bg-[#0B4312] transition disabled:opacity-50 whitespace-nowrap"
          >
            {buscandoCep
              ? "Buscando..."
              : "Buscar"}
          </button>

        </div>
      </div>

      {/* LOGRADOURO / NÚMERO */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-500">
            Logradouro
          </label>

          <input
            type="text"
            value={enderecoForm.logradouro}
            onChange={(e) =>
              setEnderecoForm({
                ...enderecoForm,
                logradouro: e.target.value
              })
            }
            placeholder="Rua, avenida..."
            className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500">
            Número
          </label>

          <input
            type="text"
            value={enderecoForm.numero}
            onChange={(e) =>
              setEnderecoForm({
                ...enderecoForm,
                numero: e.target.value
              })
            }
            placeholder="Nº"
            className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

      </div>

      {/* BAIRRO */}

      <div>
        <label className="text-xs font-medium text-gray-500">
          Bairro
        </label>

        <input
          type="text"
          value={enderecoForm.bairro}
          onChange={(e) =>
            setEnderecoForm({
              ...enderecoForm,
              bairro: e.target.value
            })
          }
          placeholder="Digite o bairro"
          className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* CIDADE / UF */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-500">
            Cidade
          </label>

          <input
            type="text"
            value={enderecoForm.cidade}
            onChange={(e) =>
              setEnderecoForm({
                ...enderecoForm,
                cidade: e.target.value
              })
            }
            placeholder="Digite a cidade"
            className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500">
            UF
          </label>

          <input
            type="text"
            value={enderecoForm.uf}
            onChange={(e) =>
              setEnderecoForm({
                ...enderecoForm,
                uf: e.target.value.toUpperCase()
              })
            }
            placeholder="SP"
            maxLength={2}
            className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 uppercase"
          />
        </div>

      </div>

      {/* COMPLEMENTO */}

      <div>
        <label className="text-xs font-medium text-gray-500">
          Complemento
        </label>

        <input
          type="text"
          value={enderecoForm.complemento}
          onChange={(e) =>
            setEnderecoForm({
              ...enderecoForm,
              complemento: e.target.value
            })
          }
          placeholder="Apartamento, bloco, referência..."
          className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* MENSAGEM ENDEREÇO */}

      <MensagemStatus mensagem={mensagemEndereco} />

      {/* AÇÕES */}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">

        <button
          type="button"
          onClick={cancelarEdicaoEndereco}
          disabled={salvandoEndereco}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={salvarEndereco}
          disabled={
            salvandoEndereco ||
            usandoLocalizacao
          }
          className="px-4 py-2.5 rounded-xl bg-[#0E5617] text-white hover:bg-[#0B4312] transition disabled:opacity-50"
        >
          {usandoLocalizacao
            ? "Obtendo localização..."
            : salvandoEndereco
            ? "Salvando..."
            : "Salvar endereço"}
        </button>

      </div>

    </div>
  );
}
