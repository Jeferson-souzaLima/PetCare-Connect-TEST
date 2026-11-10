import { ShoppingBag, ShoppingCart } from "lucide-react";

import { Footer } from "../layout/Footer";

/** Tela exibida quando não há itens no carrinho. */
export default function CarrinhoVazio({ onExplorar }) {
  return (
    <div className="bg-[#EBE9E9] min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-50 flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-[#0E5617]" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-800">
            Seu carrinho está vazio
          </h1>

          <p className="mt-2 text-gray-600 leading-relaxed">
            Encontre produtos para o seu pet e adicione ao carrinho
            para começar sua compra.
          </p>

          <button
            type="button"
            onClick={onExplorar}
            className="
              mt-6
              w-full
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[#0E5617]
              text-white
              font-semibold
              py-3.5
              px-5
              shadow-md
              hover:bg-[#0b4612]
              hover:shadow-lg
              active:scale-[0.99]
              transition-all
            "
          >
            <ShoppingBag className="w-5 h-5" />
            Explorar produtos
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
