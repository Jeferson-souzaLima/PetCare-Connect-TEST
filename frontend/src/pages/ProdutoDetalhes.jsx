import { getMediaUrl } from "@/services/mediaUrl";
import { API_URL } from "@/services/apiUrl";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Store,
  ShieldCheck,
  BadgeCheck,
  Zap,
  ChevronDown,
} from "lucide-react";
import { FavoriteButton } from "../components/ui/FavoriteButton";
import { useCarrinho } from "../context/CarrinhoContext";
import { Footer } from "../components/layout/Footer";

export default function ProdutoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { adicionarItem } = useCarrinho();

  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [imagemAtiva, setImagemAtiva] = useState(0);
  const [mostrarMais, setMostrarMais] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    setLoading(true);
    setErro(null);
    setImagemAtiva(0);
    setQuantidade(1);

    fetch(`${API_URL}/produtos/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erro ao carregar o produto");
        }

        return res.json();
      })
      .then((data) => {
        setProduto(data);
        setLoading(false);
      })
      .catch((err) => {
        setErro(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="bg-[#EBE9E9] min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-green-200 border-t-[#0E5617] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              Carregando produto...
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-[#EBE9E9] min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-md w-full">
            <p className="text-red-500 font-medium mb-5">
              {erro}
            </p>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl bg-[#0E5617] text-white font-semibold hover:bg-green-800 transition"
            >
              Voltar
            </button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (!produto) return null;

  const imagens = produto.imagens?.length
    ? produto.imagens
    : [{ caminho: "/images/produto-padrao.jpg" }];

  const imagemAtual = imagens[imagemAtiva] || imagens[0];

  const precoUnitario = Number(produto.preco) || 0;

  const totalFormatado = (precoUnitario * quantidade).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );

  const precoUnitarioFormatado = precoUnitario.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );

  const descricao = produto.descricao || "";

  const descricaoCurta =
    descricao.length > 180
      ? descricao.slice(0, 180) + "..."
      : descricao;

  function imagemAnterior() {
    setImagemAtiva((atual) =>
      atual === 0 ? imagens.length - 1 : atual - 1
    );
  }

  function proximaImagem() {
    setImagemAtiva((atual) =>
      atual === imagens.length - 1 ? 0 : atual + 1
    );
  }

  function diminuirQuantidade() {
    setQuantidade((atual) => Math.max(1, atual - 1));
  }

  function aumentarQuantidade() {
    setQuantidade((atual) => atual + 1);
  }

  function handleAdicionarAoCarrinho() {
    const entrou = adicionarItem({
      tipo: "produto",
      item_id: produto.id,
      nome_item: produto.nome,
      preco_unitario: produto.preco,
      quantidade,
      loja_id: produto.loja.id,
      loja_nome: produto.loja.nome,
      imagem: produto.imagens?.[0]?.caminho || null,
    });

    if (!entrou) return;

    setToast(true);

    setTimeout(() => {
      setToast(false);
    }, 2500);
  }

  function handleComprarAgora() {
    const entrou = adicionarItem({
      tipo: "produto",
      item_id: produto.id,
      nome_item: produto.nome,
      preco_unitario: produto.preco,
      quantidade,
      loja_id: produto.loja.id,
      loja_nome: produto.loja.nome,
      imagem: produto.imagens?.[0]?.caminho || null,
    });

    if (entrou) navigate("/carrinho");
  }

  return (
    <div className="bg-[#EBE9E9] min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-5 md:py-8">
          {/* VOLTAR */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#0E5617] transition mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>

          {/* PRODUTO */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* ================= IMAGENS ================= */}
              <section className="bg-white p-4 md:p-8 lg:p-10">
                <div className="relative">
                  <div className="w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img
                      src={getMediaUrl(imagemAtual.caminho, "/images/produto-padrao.jpg")}
                      alt={produto.nome}
                      className="w-full h-full object-contain p-5 md:p-8"
                    />

                    {imagens.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={imagemAnterior}
                          aria-label="Imagem anterior"
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:text-[#0E5617] hover:scale-105 transition"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          onClick={proximaImagem}
                          aria-label="Próxima imagem"
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:text-[#0E5617] hover:scale-105 transition"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* MINIATURAS */}
                  {imagens.length > 1 && (
                    <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                      {imagens.map((img, index) => (
                        <button
                          type="button"
                          key={index}
                          onClick={() => setImagemAtiva(index)}
                          className={`
                            shrink-0 w-16 h-16 md:w-20 md:h-20
                            rounded-xl overflow-hidden bg-gray-50
                            border-2 transition
                            ${
                              imagemAtiva === index
                                ? "border-[#0E5617] ring-2 ring-green-100"
                                : "border-gray-200 hover:border-gray-400"
                            }
                          `}
                        >
                          <img
                            src={getMediaUrl(img.caminho, "/images/produto-padrao.jpg")}
                            alt={`${produto.nome} - imagem ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* ================= INFORMAÇÕES ================= */}
              <section className="border-t lg:border-t-0 lg:border-l border-gray-200 p-5 md:p-8 lg:p-10 flex flex-col">
                {/* LOJA */}
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/lojas/${produto.loja.id}`)
                  }
                  className="self-start inline-flex items-center gap-2 text-sm font-semibold text-[#0E5617] hover:text-green-800 transition mb-4"
                >
                  <Store className="w-4 h-4" />
                  {produto.loja.nome}
                </button>

                {/* NOME */}
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                    {produto.nome}
                  </h1>

                  <FavoriteButton
                    tipo="produto"
                    referenciaId={produto.id}
                    className="shrink-0"
                  />
                </div>

                {/* PREÇO */}
                <div className="mt-5">
                  <p className="text-sm text-gray-500">
                    Preço unitário
                  </p>

                  <p className="text-3xl md:text-4xl font-bold text-gray-800 mt-1">
                    {precoUnitarioFormatado}
                  </p>

                  {quantidade > 1 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {quantidade} unidades •{" "}
                      <span className="font-semibold text-gray-700">
                        {totalFormatado}
                      </span>
                    </p>
                  )}
                </div>

                {/* CONFIANÇA */}
                <div className="grid grid-cols-3 gap-2 mt-6 text-xs text-gray-600 text-center">
                  <div className="bg-green-50 rounded-xl p-3 flex flex-col items-center justify-center min-h-[72px]">
                    <ShieldCheck className="w-5 h-5 text-[#0E5617] mb-1" />
                    <p className="font-semibold">
                      Compra segura
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-3 flex flex-col items-center justify-center min-h-[72px]">
                    <BadgeCheck className="w-5 h-5 text-[#0E5617] mb-1" />
                    <p className="font-semibold">
                      Loja verificada
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-3 flex flex-col items-center justify-center min-h-[72px]">
                    <Zap className="w-5 h-5 text-[#0E5617] mb-1" />
                    <p className="font-semibold">
                      Retirada rápida
                    </p>
                  </div>
                </div>

                {/* DESCRIÇÃO */}
                <div className="mt-7">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">
                    Descrição
                  </h2>

                  {descricao ? (
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                      {mostrarMais
                        ? descricao
                        : descricaoCurta}

                      {descricao.length > 180 && (
                        <button
                          type="button"
                          onClick={() =>
                            setMostrarMais(!mostrarMais)
                          }
                          className="inline-flex items-center gap-1 ml-2 font-bold text-[#0E5617] hover:text-green-800"
                        >
                          {mostrarMais ? "Ver menos" : "Ver mais"}
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              mostrarMais
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Este produto não possui descrição.
                    </p>
                  )}
                </div>

                {/* QUANTIDADE */}
                <div className="mt-7">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Quantidade
                  </p>

                  <div className="inline-flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={diminuirQuantidade}
                      disabled={quantidade === 1}
                      aria-label="Diminuir quantidade"
                      className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="w-12 h-11 flex items-center justify-center border-x border-gray-300 font-bold text-gray-800">
                      {quantidade}
                    </div>

                    <button
                      type="button"
                      onClick={aumentarQuantidade}
                      aria-label="Aumentar quantidade"
                      className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* LOJA */}
                <div className="mt-7 bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-white border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                        <img
                          src={getMediaUrl(produto.loja?.logo, "/images/loja-padrao.png")}
                          alt={`Logo da ${produto.loja.nome}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">
                          Vendido por
                        </p>

                        <p className="font-bold text-gray-800 truncate">
                          {produto.loja.nome}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/lojas/${produto.loja.id}`
                        )
                      }
                      className="text-sm font-bold text-[#0E5617] hover:text-green-800 whitespace-nowrap"
                    >
                      Ver loja
                    </button>
                  </div>
                </div>

                {/* AÇÕES */}
                <div className="mt-7 space-y-3">
                  <div className="flex w-full gap-1">
                    <button
                      type="button"
                      onClick={handleComprarAgora}
                      className="flex-1 flex items-center justify-center bg-[#22A447] text-white font-bold py-4 px-5 rounded-xl shadow-md hover:bg-[#1D913D] hover:shadow-lg active:scale-[0.99] transition-all"
                    >
                      COMPRAR AGORA
                    </button>

                    <button
                      type="button"
                      onClick={handleAdicionarAoCarrinho}
                      aria-label="Adicionar ao carrinho"
                      title="Adicionar ao carrinho"
                      className="w-[58px] shrink-0 flex items-center justify-center bg-[#22A447] text-white rounded-xl shadow-md hover:bg-[#1D913D] hover:shadow-lg active:scale-[0.99] transition-all"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/lojas/${produto.loja.id}`)
                    }
                    className="w-full py-3 px-5 rounded-xl border-2 border-[#0E5617] text-[#0E5617] font-semibold hover:bg-green-50 transition"
                  >
                    Ver mais produtos desta loja
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[60]">
          <div className="flex items-center gap-3 bg-[#0E5617] text-white px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold whitespace-nowrap">
            <ShoppingCart className="w-5 h-5" />
            Produto adicionado ao carrinho
          </div>
        </div>
      )}
    </div>
  );
}
