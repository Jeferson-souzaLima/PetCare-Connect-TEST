import { MapPin } from "lucide-react";

import BotaoLocalizacaoAtual from "../ui/BotaoLocalizacaoAtual";
import EnderecoLinhas from "../endereco/EnderecoLinhas";

function Spinner() {
  return (
    <div className="w-4 h-4 border-2 border-green-100 border-t-[#0E5617] rounded-full animate-spin" />
  );
}

/** Endereço e localização usados para calcular a busca e entrega do pet. */
export default function EnderecoBuscaEntrega({
  carregandoPerfil,
  possuiEnderecoPerfil,
  endereco,
  coordenadasEntrega,
  usandoLocalizacao,
  usarLocalizacaoAtual,
  mensagemLocalizacao,
  calculandoFrete,
}) {
  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">

      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 mt-0.5 text-[#0E5617] shrink-0" />

        <div className="min-w-0">
          <p className="font-semibold text-gray-800">
            Endereço da busca e entrega
          </p>

          <p className="text-sm text-gray-600 mt-1">
            Usaremos seu endereço principal para calcular o valor da
            busca e entrega.
          </p>
        </div>
      </div>

      {carregandoPerfil ? (
        <div className="mt-4 rounded-xl bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Spinner />
            Carregando seu endereço...
          </div>
        </div>
      ) : possuiEnderecoPerfil ? (
        <>
          {/* ENDEREÇO PRINCIPAL */}
          <div className="mt-4 rounded-xl bg-white border border-green-200 p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#0E5617]" />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-gray-800">
                  Endereço principal
                </p>

                <EnderecoLinhas endereco={endereco} />
              </div>
            </div>
          </div>

          {/* ALTERNATIVA DE LOCALIZAÇÃO */}
          {coordenadasEntrega ? (
            <div className="mt-3">
              <BotaoLocalizacaoAtual
                variante="link"
                onClick={usarLocalizacaoAtual}
                carregando={usandoLocalizacao}
              />

              <p className="mt-1 text-xs text-gray-500">
                Use esta opção somente se quiser calcular a busca e entrega
                a partir da sua localização atual.
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">

              <p className="text-sm font-semibold text-amber-800">
                Precisamos da localização para calcular a entrega.
              </p>

              <p className="text-sm text-amber-700 mt-1">
                Seu endereço está cadastrado, mas ainda não possui
                coordenadas disponíveis.
              </p>

              <BotaoLocalizacaoAtual
                onClick={usarLocalizacaoAtual}
                carregando={usandoLocalizacao}
                className="mt-3 border-amber-300"
              />
            </div>
          )}
        </>
      ) : (
        /* SEM ENDEREÇO */
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">

          <p className="font-semibold text-gray-800">
            Você ainda não possui um endereço completo cadastrado.
          </p>

          <p className="text-sm text-gray-500 mt-1">
            Para calcular a busca e entrega, precisamos da sua
            localização.
          </p>

          <BotaoLocalizacaoAtual
            onClick={usarLocalizacaoAtual}
            carregando={usandoLocalizacao}
            className="mt-4 w-full sm:w-auto border-gray-300"
          />
        </div>
      )}

      {mensagemLocalizacao && (
        <p className="mt-3 text-sm text-green-700">
          {mensagemLocalizacao}
        </p>
      )}

      {calculandoFrete && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <Spinner />

          Calculando valor da busca e entrega...
        </div>
      )}
    </div>
  );
}
