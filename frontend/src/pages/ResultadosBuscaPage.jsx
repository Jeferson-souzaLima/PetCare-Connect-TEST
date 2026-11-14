import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/cards/ProductCard";
import { LojaSection } from "@/components/sections/LojaSection";
import { ServicosSection } from "@/components/sections/ServicosSection";
import { Footer } from "@/components/layout/Footer";

import {
  buscarResultados,
} from "@/services/buscaService";

export default function ResultadosBuscaPage() {
  const [searchParams] = useSearchParams();

  const busca = searchParams.get("q") || "";

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [buscaDisponivel, setBuscaDisponivel] = useState(true);

  const [produtos, setProdutos] = useState([]);
  const [lojas, setLojas] = useState([]);
  const [servicos, setServicos] = useState([]);

  useEffect(() => {
    document.title = busca
      ? `${busca} • PetCare Connect`
      : "Busca • PetCare Connect";
  }, [busca]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [busca]);

  useEffect(() => {
    if (!busca.trim()) {
      setLoading(false);
      setErro("");
      setBuscaDisponivel(true);
      setProdutos([]);
      setLojas([]);
      setServicos([]);
      return;
    }

    const controller = new AbortController();

    async function carregarResultados() {
      try {
        setLoading(true);
        setErro("");

        const data = await buscarResultados(
        busca,
        controller.signal
      );

      const disponivel = data.disponivel !== false;

      setBuscaDisponivel(disponivel);

      setProdutos(data.produtos ?? []);
      setLojas(data.lojas ?? []);
      setServicos(data.servicos ?? []);

      } catch (error) {
        if (
          error.name !== "AbortError" &&
          error.name !== "CanceledError"
        ) {
          console.error(error);
          setErro("Não foi possível carregar os resultados.");
        }
      } finally {
        setLoading(false);
      }
    }

    carregarResultados();

    return () => controller.abort();
  }, [busca]);

  const totalResultados =
    produtos.length +
    lojas.length +
    servicos.length;

  return (
    <div className="bg-[#EBE9E9] min-h-screen flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">

      {/* Cabeçalho */}

      <section className="mb-10">

        <p className="text-sm uppercase tracking-wide text-gray-500">
          Resultados para
        </p>

        <h1 className="mt-2 text-4xl font-bold text-[#0E5617]">
          "{busca}"
        </h1>

        <p className="mt-3 text-gray-600">
          {totalResultados}{" "}
          {totalResultados === 1
            ? "resultado encontrado"
            : "resultados encontrados"}
        </p>

      </section>

      {/* Loading */}

      {loading && (
        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <p className="text-gray-500">
            Carregando resultados...
          </p>
        </div>
      )}

      {/* Erro */}

      {!loading && erro && (
        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <p className="text-red-600">{erro}</p>
        </div>
      )}

      {!loading && !erro && !buscaDisponivel && (
        <div className="bg-white rounded-2xl border shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">
            📦
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">
            Busca para lojistas em breve
          </h2>

          <p className="mt-3 text-gray-500 max-w-xl mx-auto">
            Estamos preparando esta área para você encontrar
            mercadorias e distribuidoras parceiras.
          </p>
        </div>
      )}

      {/* Conteúdo */}

      {!loading && !erro && buscaDisponivel && (
        <div className="space-y-12">

          {/* Nenhum resultado */}

          {totalResultados === 0 && (
            <div className="bg-white rounded-2xl border shadow-sm p-12 text-center">

              <div className="text-6xl mb-4">
                🔍
              </div>

              <h2 className="text-2xl font-semibold text-gray-800">
                Nenhum resultado encontrado
              </h2>

              <p className="mt-3 text-gray-500">
                Não encontramos resultados para
              </p>

              <p className="mt-1 font-semibold text-[#0E5617]">
                "{busca}"
              </p>

              <p className="mt-5 text-gray-500">
                Tente pesquisar utilizando outro termo.
              </p>

            </div>
          )}

          {/* Produtos */}

          {produtos.length > 0 && (
            <section>

              <div className="flex items-center justify-between mb-5">

                <h2 className="text-2xl font-bold">
                  Produtos
                </h2>

                <span className="text-sm text-gray-500">
                  {produtos.length}
                </span>

              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">

                {produtos.map((produto) => (
                  <ProductCard
                    key={produto.id}
                    produto={produto}
                  />
                ))}

              </div>

            </section>
          )}

          {/* Lojas */}

          {lojas.length > 0 && (
            <section>

              <div className="flex items-center justify-between mb-5">

                <h2 className="text-2xl font-bold">
                  Lojas
                </h2>

                <span className="text-sm text-gray-500">
                  {lojas.length}
                </span>

              </div>

              <LojaSection lojas={lojas} />

            </section>
          )}

          {/* Serviços */}

          {servicos.length > 0 && (
            <section>

              <div className="flex items-center justify-between mb-5">

                <h2 className="text-2xl font-bold">
                  Serviços
                </h2>

                <span className="text-sm text-gray-500">
                  {servicos.length}
                </span>

              </div>

              <ServicosSection servicos={servicos} />

            </section>
          )}

        </div>
      )}

        </main>

    <Footer />
  </div>
  );
}
