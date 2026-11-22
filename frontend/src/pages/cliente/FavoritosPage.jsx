import { useEffect, useState } from "react";

import { listarFavoritos } from "../../services/favoritoService";

import { ProductSection } from "../../components/sections/ProductSection";
import { LojaSection } from "../../components/sections/LojaSection";
import { ServicosSection } from "../../components/sections/ServicosSection";

export default function FavoritosPage() {

  const [favoritos, setFavoritos] = useState({
    produtos: [],
    lojas: [],
    servicos: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarFavoritos();
  }, []);

  async function carregarFavoritos() {
    try {

      const data = await listarFavoritos();

      setFavoritos(data);

    } catch (error) {

      console.error("Erro ao carregar favoritos:", error);

    } finally {

      setLoading(false);

    }
  }

  if (loading) {
    return (
      <main className="max-w-pc-pagina mx-auto px-4 py-10">
        <div className="text-center text-gray-500">
          Carregando favoritos...
        </div>
      </main>
    );
  }

  const semFavoritos =
    favoritos.produtos.length === 0 &&
    favoritos.lojas.length === 0 &&
    favoritos.servicos.length === 0;

  return (
    <main className="max-w-pc-pagina mx-auto px-4 py-8">

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-800">
          Meus Favoritos
        </h1>

        <p className="text-gray-500 mt-2">
          Encontre rapidamente seus produtos, lojas e serviços favoritos.
        </p>
      </div>

      {semFavoritos ? (

        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">

          <div className="text-6xl mb-4">
            ❤️
          </div>

          <h2 className="text-2xl font-semibold text-gray-700">
            Nenhum favorito encontrado
          </h2>

          <p className="text-gray-500 mt-3">
            Favorite produtos, lojas e serviços para acessá-los facilmente depois.
          </p>

        </div>

      ) : (

        <div className="space-y-12">

          {favoritos.produtos.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-5">
                Produtos
              </h2>

              <ProductSection
                produtos={favoritos.produtos}
              />
            </section>
          )}

          {favoritos.lojas.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-5">
                Lojas
              </h2>

              <LojaSection
                lojas={favoritos.lojas}
              />
            </section>
          )}

          {favoritos.servicos.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-5">
                Serviços
              </h2>

              <ServicosSection
                servicos={favoritos.servicos}
              />
            </section>
          )}

        </div>

      )}

    </main>
  );

}