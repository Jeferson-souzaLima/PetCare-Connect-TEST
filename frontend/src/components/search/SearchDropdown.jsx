import { getMediaUrl, IMAGEM_PADRAO_LOJA, IMAGEM_PADRAO_PRODUTO } from "@/services/mediaUrl";
import { Package, Store, Scissors } from "lucide-react";

export function SearchDropdown({
  busca,
  resultados,
  loading,
  itemSelecionado,
  onProdutoClick,
  onLojaClick,
  onServicoClick,
  onVerTodos,
  }) {
    if (loading) {
      return (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border z-50 overflow-hidden max-h-[500px] overflow-y-auto">
          <p className="text-sm text-gray-500">Buscando...</p>
        </div>
      );
    }

  if (resultados.disponivel === false) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 p-6 text-center">
        <Package className="w-10 h-10 mx-auto text-[#0E5617] mb-3" />

        <h3 className="text-base font-bold text-gray-800">
          Busca para lojistas em breve
        </h3>

        <p className="text-sm text-gray-500 mt-2">
          Estamos preparando esta área para você encontrar
          mercadorias e distribuidoras parceiras.
        </p>
      </div>
    );
  }

  const { produtos = [], lojas = [], servicos = [] } = resultados;

  let indiceAtual = 0;

  const vazio =
    produtos.length === 0 &&
    lojas.length === 0 &&
    servicos.length === 0;

  if (vazio) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border z-50 p-4">
        <p className="text-sm text-gray-500">
          Nenhum resultado encontrado.
        </p>
      </div>
    );
  }

  function highlightTexto(texto, busca) {

      const textoSeguro = texto ?? "";

      if (!busca?.trim()) return textoSeguro;

      const regex = new RegExp(`(${busca})`, "gi");
      const partes = textoSeguro.split(regex);

      return partes.map((parte, index) =>
          regex.test(parte) ? (
              <mark
                  key={index}
                  className="bg-[#DDF5E1] text-[#0E5617] font-semibold px-0.5 rounded"
              >
                  {parte}
              </mark>
          ) : (
              parte
          )
      );
  }

  return (
    <div
      className="
        absolute
        top-full
        left-0
        right-0
        mt-2
        bg-white
        rounded-2xl
        shadow-2xl
        border
        border-gray-200
        z-50
        overflow-hidden
      "
    >

      {/* Área com scroll */}
      <div
        className="
          max-h-[300px]
          sm:max-h-[360px]
          lg:max-h-[420px]
          overflow-y-auto
          search-scroll
        "
      >

        {/* Produtos */}
        {produtos.length > 0 && (
          <>
              <div className="flex items-center gap-2 px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase">
                <Package size={16} />
                Produtos
              </div>

              {produtos.map((produto) => {
                const indice = indiceAtual++;
                const imagemProduto = getMediaUrl(
                  produto.imagens?.[0]?.caminho,
                  IMAGEM_PADRAO_PRODUTO
                );

                return (
                  <button
                    key={produto.id}
                    onClick={() => onProdutoClick?.(produto)}
                    className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left transition-colors ${
                      indice === itemSelecionado
                        ? "bg-green-100 border-l-4 border-[#0E5617]"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">

                      <img
                        src={imagemProduto}
                        alt={produto.nome}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                      />

                      <div className="flex flex-col">

                        <span className="font-medium text-sm text-gray-800">
                          {highlightTexto(produto.nome, busca)}
                        </span>

                        <span className="text-xs text-gray-500">
                          {highlightTexto(produto.loja?.nome, busca)}
                        </span>

                      </div>

                    </div>

                    <span className="text-sm font-semibold text-[#0E5617] whitespace-nowrap">
                      R$ {Number(produto.preco).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </>
        )}

        {/* Lojas */}
        {lojas.length > 0 && (
        <>
              <div className="flex items-center gap-2 px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase border-t">
                <Store size={16} />
                Lojas
              </div>

              {lojas.map((loja) => {
                const indice = indiceAtual++;
                const logoLoja = getMediaUrl(loja.imagem, IMAGEM_PADRAO_LOJA);

                return (
                  <button
                    key={loja.id}
                    onClick={() => onLojaClick?.(loja)}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      indice === itemSelecionado
                        ? "bg-green-100 border-l-4 border-[#0E5617]"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={logoLoja}
                        alt={loja.nome_fantasia}
                        className="w-10 h-10 rounded-full object-cover bg-gray-100"
                      />

                      <span className="font-medium text-sm text-gray-800">
                        {highlightTexto(loja.nome_fantasia, busca)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </>
        )}

        {/* Serviços */}
        {servicos.length > 0 && (
          <>
              <div className="flex items-center gap-2 px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase border-t">
                <Scissors size={16} />
                Serviços
              </div>

              {servicos.map((servico) => {
                const indice = indiceAtual++;
                const logoLoja = getMediaUrl(servico.loja_logo, IMAGEM_PADRAO_LOJA);

                return (
                  <button
                    key={servico.id}
                    onClick={() => onServicoClick?.(servico)}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      indice === itemSelecionado
                        ? "bg-green-100 border-l-4 border-[#0E5617]"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <img
                        src={logoLoja}
                        alt={servico.loja_nome}
                        className="w-10 h-10 rounded-full object-cover bg-gray-100"
                      />

                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-gray-800">
                          {highlightTexto(servico.nome, busca)}
                        </span>

                        <span className="text-xs text-gray-500">
                          {highlightTexto(servico.loja_nome, busca)}
                        </span>
                      </div>
                    </div>

                    <span className="text-sm font-semibold text-[#0E5617] whitespace-nowrap">
                      R$ {Number(servico.preco).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </>
        )}

      </div>

      {/* Rodapé fixo */}
      <div className="border-t bg-white">

        <div className="px-4 pt-3 text-xs text-gray-500 text-center">
          {produtos.length} produtos • {lojas.length} lojas • {servicos.length} serviços
        </div>

        <button
          onClick={onVerTodos}
          className="
            w-full
            py-3
            text-sm
            font-semibold
            text-[#0E5617]
            hover:bg-green-50
            transition-colors
          "
        >
          Ver todos os resultados →
        </button>

      </div>

    </div>
  );
}
