import { Check, LocateFixed, Save, Search } from "lucide-react";

import BotaoLocalizacaoAtual from "../ui/BotaoLocalizacaoAtual";

/** Formulário de endereço de entrega, com busca de CEP, localização e opção de salvar no perfil. */
export default function FormularioEnderecoEntrega({
  possuiEnderecoPerfil,
  endereco,
  setEndereco,
  buscarCep,
  buscandoCep,
  erroEndereco,
  coordenadasEntrega,
  usandoLocalizacao,
  usarLocalizacaoAtual,
  mensagemLocalizacao,
  salvarNoPerfil,
  setSalvarNoPerfil,
  aplicarEndereco,
  salvandoEndereco,
  onCancelar,
}) {
  return (
    <>
      {/* FORMULÁRIO DE ENDEREÇO */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-semibold text-gray-700">
            CEP

            <div className="mt-1 flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={9}
                value={endereco.cep}
                onChange={(e) =>
                  setEndereco({
                    ...endereco,
                    cep: e.target.value,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    buscarCep();
                  }
                }}
                className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <button
                type="button"
                onClick={buscarCep}
                disabled={buscandoCep}
                className="
                  shrink-0
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-gray-100
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-gray-700
                  hover:bg-gray-200
                  transition
                  disabled:opacity-60
                "
              >
                <Search className="w-4 h-4" />

                {buscandoCep
                  ? "Buscando..."
                  : "Buscar"}
              </button>
            </div>
          </label>
        </div>

        <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
          Endereço

          <input
            type="text"
            value={endereco.logradouro}
            onChange={(e) =>
              setEndereco({
                ...endereco,
                logradouro: e.target.value,
              })
            }
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </label>

        <label className="text-sm font-semibold text-gray-700">
          Número

          <input
            type="text"
            value={endereco.numero}
            onChange={(e) =>
              setEndereco({
                ...endereco,
                numero: e.target.value,
              })
            }
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </label>

        <label className="text-sm font-semibold text-gray-700">
          Complemento
          <span className="font-normal text-gray-400">
            {" "}
            (opcional)
          </span>

          <input
            type="text"
            value={endereco.complemento}
            onChange={(e) =>
              setEndereco({
                ...endereco,
                complemento: e.target.value,
              })
            }
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </label>

        <label className="text-sm font-semibold text-gray-700">
          Bairro

          <input
            type="text"
            value={endereco.bairro}
            onChange={(e) =>
              setEndereco({
                ...endereco,
                bairro: e.target.value,
              })
            }
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </label>

        <label className="text-sm font-semibold text-gray-700">
          Cidade

          <input
            type="text"
            value={endereco.cidade}
            onChange={(e) =>
              setEndereco({
                ...endereco,
                cidade: e.target.value,
              })
            }
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </label>

        <label className="text-sm font-semibold text-gray-700">
          UF

          <input
            type="text"
            maxLength={2}
            value={endereco.uf}
            onChange={(e) =>
              setEndereco({
                ...endereco,
                uf: e.target.value.toUpperCase(),
              })
            }
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 uppercase outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </label>
      </div>

      {erroEndereco && (
        <p className="mt-3 text-sm text-red-700">
          {erroEndereco}
        </p>
      )}

      {/* LOCALIZAÇÃO */}
      <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <LocateFixed className="w-5 h-5 text-[#0E5617] mt-0.5 shrink-0" />

          <div>
            <p className="font-semibold text-gray-800">
              Localização da entrega
            </p>

            <p className="text-sm text-gray-600 mt-1">
              Podemos usar sua localização atual para calcular
              a distância da entrega.
            </p>
          </div>
        </div>

        <BotaoLocalizacaoAtual
          onClick={usarLocalizacaoAtual}
          carregando={usandoLocalizacao}
          className="mt-3 w-full sm:w-auto border-gray-300"
        />

        {coordenadasEntrega && (
          <p className="mt-3 flex items-center gap-2 text-sm text-green-700">
            <Check className="w-4 h-4" />
            Localização definida para esta entrega.
          </p>
        )}

        {mensagemLocalizacao && (
          <p className="mt-2 text-sm text-green-700">
            {mensagemLocalizacao}
          </p>
        )}
      </div>

      {/* SALVAR NO PERFIL */}
      <label className="mt-5 flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={salvarNoPerfil}
          onChange={(e) =>
            setSalvarNoPerfil(e.target.checked)
          }
          className="mt-1 w-4 h-4 accent-green-700"
        />

        <span>
          <span className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
            <Save className="w-4 h-4 text-[#0E5617]" />
            Salvar este endereço no meu perfil
          </span>

          <span className="block text-sm text-gray-500 mt-1">
            Assim ele ficará preenchido automaticamente nas
            próximas compras.
          </span>
        </span>
      </label>

      {/* AÇÕES DO ENDEREÇO */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={aplicarEndereco}
          disabled={salvandoEndereco}
          className="
            flex-1
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-[#0E5617]
            text-white
            font-semibold
            py-3
            px-5
            hover:bg-[#0b4612]
            transition
            disabled:opacity-60
          "
        >
          {salvandoEndereco ? (
            "Salvando..."
          ) : (
            <>
              <Check className="w-4 h-4" />
              Usar este endereço
            </>
          )}
        </button>

        {possuiEnderecoPerfil && (
          <button
            type="button"
            onClick={onCancelar}
            className="
              rounded-xl
              border
              border-gray-300
              bg-white
              px-5
              py-3
              font-semibold
              text-gray-700
              hover:bg-gray-50
              transition
            "
          >
            Cancelar
          </button>
        )}
      </div>
    </>
  );
}
