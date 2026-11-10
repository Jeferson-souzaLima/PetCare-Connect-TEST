import { API_URL } from "@/services/apiUrl";
import { getMediaUrl } from "@/services/mediaUrl";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Minus,
  ShoppingCart,
  MapPin,
  CalendarDays,
  Package,
  Store,
  Check,
  ArrowLeft,
} from "lucide-react";
import { useCarrinho } from "../context/CarrinhoContext";

export default function LojaDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { adicionarItem } = useCarrinho();

  const [loja, setLoja] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [abaAtiva, setAbaAtiva] = useState("produtos");
  const [itens, setItens] = useState([]);
  const [quantidades, setQuantidades] = useState({});
  const [notificacao, setNotificacao] = useState(null);
  const [carregandoItens, setCarregandoItens] = useState(false);

  /*
   * CARREGA DADOS DA LOJA
   */
  useEffect(() => {
    let ativo = true;

    async function carregarLoja() {
      try {
        setLoading(true);
        setErro(null);

        const response = await fetch(
          `${API_URL}/lojas/${id}`
        );

        if (!response.ok) {
          throw new Error("Não foi possível carregar a loja.");
        }

        const data = await response.json();

        if (ativo) {
          setLoja(data);
        }
      } catch (error) {
        if (ativo) {
          setErro(error.message || "Erro ao carregar loja.");
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarLoja();

    return () => {
      ativo = false;
    };
  }, [id]);

  /*
   * CARREGA PRODUTOS OU SERVIÇOS
   */
  useEffect(() => {
    let ativo = true;

    async function carregarItens() {
      try {
        setCarregandoItens(true);

        const url =
          abaAtiva === "produtos"
            ? `${API_URL}/produtos/loja/${id}`
            : `${API_URL}/servicos/loja/${id}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Não foi possível carregar os itens.");
        }

        const data = await response.json();

        if (!ativo) return;

        if (Array.isArray(data)) {
          setItens(data);
        } else {
          setItens([]);
        }
      } catch (error) {
        console.error("Erro ao carregar itens da loja:", error);

        if (ativo) {
          setItens([]);
        }
      } finally {
        if (ativo) {
          setCarregandoItens(false);
        }
      }
    }

    carregarItens();

    return () => {
      ativo = false;
    };
  }, [abaAtiva, id]);

  /*
   * QUANTIDADE DOS PRODUTOS
   */
  function aumentar(idProduto) {
    setQuantidades((prev) => ({
      ...prev,
      [idProduto]: (prev[idProduto] || 0) + 1,
    }));
  }

  function diminuir(idProduto) {
    setQuantidades((prev) => {
      const atual = prev[idProduto] || 0;

      if (atual <= 1) {
        const novo = { ...prev };
        delete novo[idProduto];
        return novo;
      }

      return {
        ...prev,
        [idProduto]: atual - 1,
      };
    });
  }

  /*
   * ADICIONAR PRODUTO AO CARRINHO
   */
  function adicionarAoCarrinho(item) {
    const quantidade = quantidades[item.id];

    if (!quantidade || !loja?.id) {
      return;
    }

    adicionarItem({
      tipo: "produto",
      item_id: item.id,
      nome_item: item.nome,
      preco_unitario: item.preco,
      quantidade,
      loja_id: loja.id,
      loja_nome: loja.nome_fantasia,
      imagem: item.imagens?.[0]?.caminho || null,
    });

    setNotificacao(`${item.nome} adicionado ao carrinho`);

    setTimeout(() => {
      setNotificacao(null);
    }, 2500);

    setQuantidades((prev) => {
      const novo = { ...prev };
      delete novo[item.id];
      return novo;
    });
  }

  /*
   * FORMATAÇÃO DE PREÇO
   */
  function formatarPreco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  /*
   * LOADING
   */
  if (loading) {
    return (
      <div className="bg-[#EBE9E9] min-h-screen">
        <main className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 text-center">
            <div className="w-10 h-10 border-4 border-green-100 border-t-[#0E5617] rounded-full animate-spin mx-auto" />

            <p className="mt-4 text-sm text-gray-600">
              Carregando loja...
            </p>
          </div>
        </main>
      </div>
    );
  }

  /*
   * ERRO
   */
  if (erro || !loja) {
    return (
      <div className="bg-[#EBE9E9] min-h-screen">
        <main className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center">
              <Store className="w-7 h-7 text-red-600" />
            </div>

            <h1 className="mt-4 text-xl font-bold text-gray-800">
              Não foi possível carregar a loja
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              {erro || "Loja não encontrada."}
            </p>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="
                mt-6
                w-full
                rounded-xl
                bg-[#0E5617]
                text-white
                font-semibold
                py-3
                hover:bg-[#0b4612]
                transition
              "
            >
              Voltar
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#EBE9E9] min-h-screen">
      <main className="max-w-6xl mx-auto px-4 py-5 md:py-8">

        {/* VOLTAR */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="
            mb-4
            inline-flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-gray-600
            hover:text-[#0E5617]
            transition
          "
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        
        {/* CABEÇALHO DA LOJA */}
        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-b from-green-50 to-white px-5 py-8 md:px-8 md:py-10">
            <div className="flex flex-col items-center text-center">

              {/* LOGO */}
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center">
                <img
                  src={
                    getMediaUrl(loja.imagem, "/images/loja-padrao.png")
                  }
                  alt={loja.nome_fantasia}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* NOME */}
              <h1 className="mt-5 text-2xl md:text-3xl font-bold text-gray-900">
                {loja.nome_fantasia}
              </h1>

              {/* ENDEREÇO REAL DA LOJA */}
              {(loja.endereco || loja.cidade || loja.cep) && (
                <div className="mt-4 w-full max-w-xl mx-auto">
                  <div className="flex items-start justify-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#0E5617]" />

                    <div className="text-center">
                      {loja.endereco && (
                        <p className="font-medium text-gray-800">
                          {loja.endereco}
                        </p>
                      )}

                      {(loja.cidade || loja.uf) && (
                        <p className="mt-0.5">
                          {loja.cidade}
                          {loja.uf ? ` - ${loja.uf}` : ""}
                        </p>
                      )}

                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ABAS */}
          <div className="border-t border-gray-200 px-4 md:px-8">
            <div className="flex justify-center gap-2 md:gap-4">
              <button
                type="button"
                onClick={() => setAbaAtiva("produtos")}
                className={`
                  relative
                  flex
                  items-center
                  gap-2
                  px-5
                  py-4
                  text-sm
                  font-semibold
                  transition
                  ${
                    abaAtiva === "produtos"
                      ? "text-[#0E5617]"
                      : "text-gray-500 hover:text-gray-800"
                  }
                `}
              >
                <Package className="w-4 h-4" />
                Produtos

                {abaAtiva === "produtos" && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#0E5617] rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setAbaAtiva("servicos")}
                className={`
                  relative
                  flex
                  items-center
                  gap-2
                  px-5
                  py-4
                  text-sm
                  font-semibold
                  transition
                  ${
                    abaAtiva === "servicos"
                      ? "text-[#0E5617]"
                      : "text-gray-500 hover:text-gray-800"
                  }
                `}
              >
                <CalendarDays className="w-4 h-4" />
                Serviços

                {abaAtiva === "servicos" && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#0E5617] rounded-full" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* CONTEÚDO */}
        <section className="mt-6">

          {/* CABEÇALHO DA SEÇÃO */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {abaAtiva === "produtos"
                  ? "Produtos da loja"
                  : "Serviços da loja"}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {abaAtiva === "produtos"
                  ? "Confira os produtos disponíveis."
                  : "Confira os serviços disponíveis para agendamento."}
              </p>
            </div>
          </div>

          {/* LOADING DOS ITENS */}
          {carregandoItens && (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <div className="w-8 h-8 border-4 border-green-100 border-t-[#0E5617] rounded-full animate-spin mx-auto" />

              <p className="mt-3 text-sm text-gray-500">
                Carregando...
              </p>
            </div>
          )}

          {/* NENHUM ITEM */}
          {!carregandoItens && itens.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              {abaAtiva === "produtos" ? (
                <Package className="w-10 h-10 mx-auto text-gray-300" />
              ) : (
                <CalendarDays className="w-10 h-10 mx-auto text-gray-300" />
              )}

              <h3 className="mt-4 font-semibold text-gray-800">
                {abaAtiva === "produtos"
                  ? "Nenhum produto disponível"
                  : "Nenhum serviço disponível"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {abaAtiva === "produtos"
                  ? "Esta loja ainda não possui produtos cadastrados."
                  : "Esta loja ainda não possui serviços cadastrados."}
              </p>
            </div>
          )}

          {/* PRODUTOS */}
          {!carregandoItens &&
            itens.length > 0 &&
            abaAtiva === "produtos" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {itens.map((item) => {
                  const qtd = quantidades[item.id] || 0;

                  const imagem = getMediaUrl(
                    item.imagens?.[0]?.caminho,
                    "/images/produto-padrao.jpg"
                  );

                  return (
                    <article
                      key={item.id}
                      className="
                        bg-white
                        rounded-2xl
                        border
                        border-gray-200
                        shadow-sm
                        hover:shadow-md
                        overflow-hidden
                        transition
                        flex
                        flex-col
                      "
                    >
                      {/* IMAGEM */}
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/produtos/${item.id}`)
                        }
                        className="h-48 bg-gray-50 flex items-center justify-center overflow-hidden"
                      >
                        <img
                          src={imagem}
                          alt={item.nome}
                          className="w-full h-full object-contain p-5"
                        />
                      </button>

                      {/* INFORMAÇÕES */}
                      <div className="p-4 flex flex-col flex-1">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/produtos/${item.id}`)
                          }
                          className="text-left"
                        >
                          <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[40px]">
                            {item.nome}
                          </h3>

                          {item.descricao && (
                            <p className="mt-2 text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                              {item.descricao}
                            </p>
                          )}
                        </button>

                        {/* PREÇO */}
                        <div className="mt-auto pt-4">
                          <p className="text-lg font-bold text-[#0E5617]">
                            {formatarPreco(item.preco)}
                          </p>
                        </div>

                        {/* AÇÕES */}
                        <div
                          className="mt-4"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                        >
                          {qtd === 0 ? (
                            <button
                              type="button"
                              onClick={() => aumentar(item.id)}
                              className="
                                w-full
                                flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-[#0E5617]
                                text-white
                                font-semibold
                                py-3
                                hover:bg-[#0b4612]
                                active:scale-[0.99]
                                transition
                              "
                            >
                              <Plus className="w-4 h-4" />
                              Adicionar
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-center">
                                <div className="inline-flex items-center rounded-xl border border-gray-300 overflow-hidden bg-white">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      diminuir(item.id)
                                    }
                                    className="
                                      w-11
                                      h-11
                                      flex
                                      items-center
                                      justify-center
                                      text-gray-600
                                      hover:bg-gray-100
                                      transition
                                    "
                                    aria-label="Diminuir quantidade"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>

                                  <span className="w-12 text-center font-bold text-gray-800">
                                    {qtd}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      aumentar(item.id)
                                    }
                                    className="
                                      w-11
                                      h-11
                                      flex
                                      items-center
                                      justify-center
                                      bg-[#0E5617]
                                      text-white
                                      hover:bg-[#0b4612]
                                      transition
                                    "
                                    aria-label="Aumentar quantidade"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  adicionarAoCarrinho(item)
                                }
                                className="
                                  w-full
                                  flex
                                  items-center
                                  justify-center
                                  gap-2
                                  rounded-xl
                                  bg-[#22A447]
                                  text-white
                                  font-semibold
                                  py-3
                                  hover:bg-[#1D913D]
                                  active:scale-[0.99]
                                  transition
                                "
                              >
                                <ShoppingCart className="w-4 h-4" />
                                Adicionar ao carrinho
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

          {/* SERVIÇOS */}
          {!carregandoItens &&
            itens.length > 0 &&
            abaAtiva === "servicos" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {itens.map((item) => (
                  <article
                    key={item.id}
                    className="
                      bg-white
                      rounded-2xl
                      border
                      border-gray-200
                      shadow-sm
                      hover:shadow-md
                      transition
                      p-5
                      flex
                      flex-col
                    "
                  >
                    <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-[#0E5617]" />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/agendar/${id}/${item.id}`)
                      }
                      className="mt-4 text-left"
                    >
                      <h3 className="font-bold text-gray-900 line-clamp-2">
                        {item.nome}
                      </h3>

                      {item.descricao && (
                        <p className="mt-2 text-sm text-gray-500 line-clamp-3">
                          {item.descricao}
                        </p>
                      )}
                    </button>

                    <div className="mt-auto pt-5">
                      <p className="text-lg font-bold text-[#0E5617]">
                        {formatarPreco(item.preco)}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/agendar/${id}/${item.id}`)
                        }
                        className="
                          mt-4
                          w-full
                          flex
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-[#0E5617]
                          text-white
                          font-semibold
                          py-3
                          hover:bg-[#0b4612]
                          active:scale-[0.99]
                          transition
                        "
                      >
                        <CalendarDays className="w-4 h-4" />
                        Agendar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
        </section>
      </main>

      {/* NOTIFICAÇÃO */}
      {notificacao && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4">
          <div className="flex items-center gap-3 bg-[#0E5617] text-white px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold whitespace-nowrap">
            <Check className="w-5 h-5" />
            {notificacao}
          </div>
        </div>
      )}
    </div>
  );
}
