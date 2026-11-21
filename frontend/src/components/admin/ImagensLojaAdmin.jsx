import { useCallback, useEffect, useState } from "react";
import MensagemStatus from "@/components/ui/MensagemStatus";
import { enviarImagensProdutoAdmin, enviarLogoLojaAdmin, obterCatalogoLojaAdmin } from "@/services/adminService";
import { getMediaUrl, IMAGEM_PADRAO_LOJA, IMAGEM_PADRAO_PRODUTO } from "@/services/mediaUrl";
import { mensagemDeErro } from "./mensagemDeErro";

const TIPOS_ACEITOS = "image/jpeg,image/png";

/** Botão de envio: abre o seletor de arquivos e envia na hora. */
function BotaoEnviar({ rotulo, multiplo = false, ocupado, aoEscolher }) {
  return (
    <label className={`inline-flex cursor-pointer items-center rounded-xl border border-green-900 px-3 py-1.5 text-sm font-semibold text-green-900 hover:bg-green-50 ${ocupado ? "pointer-events-none opacity-50" : ""}`}>
      {ocupado ? "Enviando..." : rotulo}
      <input
        type="file"
        accept={TIPOS_ACEITOS}
        multiple={multiplo}
        className="sr-only"
        disabled={ocupado}
        onChange={(evento) => {
          const arquivos = Array.from(evento.target.files || []);
          evento.target.value = "";
          if (arquivos.length) aoEscolher(arquivos);
        }}
      />
    </label>
  );
}

/** Logo e imagens dos produtos de uma loja, para o admin completar o catálogo. */
export default function ImagensLojaAdmin({ lojaId }) {
  const [catalogo, setCatalogo] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [enviando, setEnviando] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setCatalogo(await obterCatalogoLojaAdmin(lojaId));
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(erro, "Não foi possível carregar o catálogo da loja.") });
    }
  }, [lojaId]);

  useEffect(() => { carregar(); }, [carregar]);

  async function enviar(chave, acao, textoErro) {
    setEnviando(chave);
    setMensagem(null);
    try {
      const resposta = await acao();
      setMensagem({ tipo: "sucesso", texto: resposta.mensagem });
      await carregar();
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(erro, textoErro) });
    } finally {
      setEnviando(null);
    }
  }

  if (!catalogo) {
    return (
      <div className="mt-4 border-t border-gray-100 pt-4">
        <MensagemStatus mensagem={mensagem} />
        {!mensagem && <p className="text-sm text-gray-600">Carregando catálogo...</p>}
      </div>
    );
  }

  const semImagem = catalogo.produtos.filter((produto) => !produto.imagens.length).length;

  return (
    <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
      <MensagemStatus mensagem={mensagem} />

      <div className="flex items-center gap-4">
        <img src={getMediaUrl(catalogo.imagem, IMAGEM_PADRAO_LOJA)} alt="" className="h-16 w-16 rounded-full border border-gray-200 bg-white object-contain p-1" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-800">Logo da loja</p>
          <BotaoEnviar
            rotulo={catalogo.imagem ? "Trocar logo" : "Enviar logo"}
            ocupado={enviando === "logo"}
            aoEscolher={([arquivo]) => enviar("logo", () => enviarLogoLojaAdmin(lojaId, arquivo), "Não foi possível enviar o logo.")}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-800">
          Produtos ({catalogo.produtos.length}){semImagem > 0 && <span className="font-normal text-yellow-800"> · {semImagem} sem imagem</span>}
        </p>
        {catalogo.produtos.length === 0 && <p className="text-sm text-gray-600">Esta loja não tem produtos cadastrados.</p>}
        <ul className="divide-y divide-gray-100">
          {catalogo.produtos.map((produto) => (
            <li key={produto.id} className="flex flex-wrap items-center gap-3 py-2">
              <img
                src={getMediaUrl(produto.imagens[0]?.caminho, IMAGEM_PADRAO_PRODUTO)}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg border border-gray-200 bg-white object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{produto.nome}</p>
                <p className="text-xs text-gray-500">
                  #{produto.id} · {produto.imagens.length} imagem(ns){!produto.ativo && " · inativo"}
                </p>
              </div>
              <BotaoEnviar
                rotulo="Enviar imagens"
                multiplo
                ocupado={enviando === `produto-${produto.id}`}
                aoEscolher={(arquivos) => enviar(`produto-${produto.id}`, () => enviarImagensProdutoAdmin(produto.id, arquivos), "Não foi possível enviar as imagens.")}
              />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-gray-500">JPG ou PNG, até 5 MB cada e até 10 por vez. Num produto sem imagens, a primeira enviada vira a principal.</p>
      </div>
    </div>
  );
}
