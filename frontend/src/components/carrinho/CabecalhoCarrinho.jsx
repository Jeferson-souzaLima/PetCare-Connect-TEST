import { ShoppingCart } from "lucide-react";

/** Título do carrinho com a quantidade de itens e a loja. */
export default function CabecalhoCarrinho({ quantidadeItens, nomeLoja }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
          <ShoppingCart className="w-6 h-6 text-[#0E5617]" />
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Seu carrinho
          </h1>

          <p className="text-sm text-gray-600">
            {quantidadeItens}{" "}
            {quantidadeItens === 1 ? "item" : "itens"} ·{" "}
            {nomeLoja}
          </p>
        </div>
      </div>
    </div>
  );
}
