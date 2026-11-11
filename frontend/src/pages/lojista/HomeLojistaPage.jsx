import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Store, ArrowRight } from "lucide-react";

import { Carousel } from "@/components/ui/Carousel";
import { CategoryTabs } from "@/components/navigation/CategoryTabs";
import { Footer } from "@/components/layout/Footer";

export default function HomeLojistaPage() {
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("mercadorias");

  const categoriasLojista = [
    {
      id: "mercadorias",
      label: "Mercadorias",
      icon: Package,
    },
    {
      id: "distribuidoras",
      label: "Distribuidoras",
      icon: Store,
    },
  ];

  return (
    <div className="bg-[#EBE9E9] min-h-screen flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full">

        

        <Carousel />

        <CategoryTabs
          selected={selectedCategory}
          onChange={setSelectedCategory}
          tabs={categoriasLojista}
        />

        

        <div className="px-4 pt-6 pb-12">
          {selectedCategory === "mercadorias" && (
            <section>
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-[#0E5617]">
                  Mercadorias
                </h2>

                <p className="text-gray-600 mt-1">
                  Encontre produtos para abastecer e repor o estoque da sua
                  loja.
                </p>
              </div>

              <div
                className="
                  bg-white
                  rounded-2xl
                  border border-gray-200
                  shadow-sm
                  p-8
                  text-center
                "
              >
                <Package className="w-12 h-12 mx-auto text-[#0E5617] mb-4" />

                <h3 className="text-xl font-bold text-gray-800">
                  Mercadorias em breve
                </h3>

                <p className="text-gray-600 mt-2 max-w-xl mx-auto">
                  Em breve você poderá encontrar mercadorias de distribuidoras
                  parceiras e realizar compras para abastecer sua loja.
                </p>
              </div>
            </section>
          )}

          {selectedCategory === "distribuidoras" && (
            <section>
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-[#0E5617]">
                  Distribuidoras
                </h2>

                <p className="text-gray-600 mt-1">
                  Encontre distribuidoras e fornecedores para o seu negócio.
                </p>
              </div>

              <div
                className="
                  bg-white
                  rounded-2xl
                  border border-gray-200
                  shadow-sm
                  p-8
                  text-center
                "
              >
                <Store className="w-12 h-12 mx-auto text-[#0E5617] mb-4" />

                <h3 className="text-xl font-bold text-gray-800">
                  Distribuidoras em breve
                </h3>

                <p className="text-gray-600 mt-2 max-w-xl mx-auto">
                  Estamos preparando esta área para conectar lojistas a
                  distribuidoras e fornecedores parceiros.
                </p>
              </div>
            </section>
          )}

          {/* Acesso ao painel */}
            <div className="mt-6">
                <button
                type="button"
                onClick={() => navigate("/perfil-lojista")}
                className="
                    w-full
                    flex items-center justify-center gap-2
                    rounded-xl
                    bg-white
                    border border-gray-200
                    px-5 py-3
                    text-[#0E5617]
                    font-semibold
                    shadow-sm
                    hover:shadow-md
                    hover:bg-green-50
                    transition-all
                    duration-200
                "
                >
                <Store className="w-5 h-5" />
                <span>Ir para o Painel da Loja</span>
                <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>

        
      </main>

      <Footer />
    </div>
  );
}