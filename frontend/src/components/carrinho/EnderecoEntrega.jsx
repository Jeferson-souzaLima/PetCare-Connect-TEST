import { Check, MapPin, Pencil } from "lucide-react";

import CabecalhoSecao from "../ui/CabecalhoSecao";
import BotaoLocalizacaoAtual from "../ui/BotaoLocalizacaoAtual";
import EnderecoLinhas from "../endereco/EnderecoLinhas";
import FormularioEnderecoEntrega from "./FormularioEnderecoEntrega";

/**
 * Seção de endereço de entrega do carrinho: mostra o endereço do perfil
 * ou o formulário para informar/alterar o endereço.
 */
export default function EnderecoEntrega({
  possuiEnderecoPerfil,
  editandoEndereco,
  onAlterar,
  endereco,
  coordenadasEntrega,
  usandoLocalizacao,
  usarLocalizacaoAtual,
  ...formulario
}) {
  return (
    <section className="mt-8 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <CabecalhoSecao
          icon={MapPin}
          titulo="Endereço de entrega"
          descricao="Para onde devemos enviar seu pedido?"
        />

        {possuiEnderecoPerfil && !editandoEndereco && (
          <button
            type="button"
            onClick={onAlterar}
            className="shrink-0 flex items-center gap-1.5 text-sm font-semibold text-[#0E5617] hover:underline"
          >
            <Pencil className="w-4 h-4" />
            Alterar
          </button>
        )}
      </div>

      {/* ENDEREÇO SALVO */}
      {possuiEnderecoPerfil && !editandoEndereco ? (
        <div className="mt-5">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <Check className="w-4 h-4 text-[#0E5617]" />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-gray-800">
                  Endereço do seu perfil
                </p>

                <EnderecoLinhas endereco={endereco} />
              </div>
            </div>
          </div>

          {coordenadasEntrega && (
            <p className="mt-3 flex items-center gap-2 text-sm text-green-700">
              <MapPin className="w-4 h-4" />
              Localização do endereço disponível para cálculo da
              entrega.
            </p>
          )}

          <BotaoLocalizacaoAtual
            onClick={usarLocalizacaoAtual}
            carregando={usandoLocalizacao}
            className="mt-4 w-full sm:w-auto border-gray-300"
          />
        </div>
      ) : (
        <FormularioEnderecoEntrega
          possuiEnderecoPerfil={possuiEnderecoPerfil}
          endereco={endereco}
          coordenadasEntrega={coordenadasEntrega}
          usandoLocalizacao={usandoLocalizacao}
          usarLocalizacaoAtual={usarLocalizacaoAtual}
          {...formulario}
        />
      )}
    </section>
  );
}
