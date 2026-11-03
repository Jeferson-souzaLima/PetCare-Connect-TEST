import { CreditCard } from "lucide-react";

import { formatarMoeda } from "../../utils/formatadores";

/** Totais do pedido, mensagem de erro e botão que leva ao pagamento. */
export default function ResumoPedido({
  totalFormatado,
  totalComFreteFormatado,
  retirada,
  frete,
  calculandoFrete,
  quantidadeItens,
  erro,
  finalizando,
  onFinalizar,
}) {
  return (
    <section className="mt-8 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        Resumo do pedido
      </h2>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600">
            Total dos produtos
          </span>

          <span className="font-medium text-gray-800">
            {totalFormatado}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600">
            Frete
          </span>

          <span className="font-medium text-gray-800">
            {retirada === "retirada" ? (
              "Retirada na loja"
            ) : calculandoFrete ? (
              "Calculando..."
            ) : (
              formatarMoeda(frete)
            )}
          </span>
        </div>
      </div>

      <div className="my-4 border-t border-gray-200" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            Total
          </p>

          <p className="text-2xl font-bold text-gray-800">
            {totalComFreteFormatado}
          </p>
        </div>

        <p className="text-xs text-gray-500 text-right">
          {quantidadeItens}{" "}
          {quantidadeItens === 1 ? "item" : "itens"}
        </p>
      </div>

      {erro && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">
            {erro}
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={finalizando}
        onClick={onFinalizar}
        className="
          mt-5
          w-full
          flex
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-[#0E5617]
          text-white
          py-4
          px-5
          font-bold
          shadow-md
          hover:bg-[#0b4612]
          hover:shadow-lg
          active:scale-[0.99]
          transition-all
          disabled:opacity-60
          disabled:cursor-not-allowed
        "
      >
        {finalizando ? (
          "Preparando pagamento..."
        ) : (
          <>
            Ir para pagamento
            <CreditCard className="w-5 h-5" />
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-gray-500">
        Você será direcionado ao Checkout Seguro do Mercado Pago.
      </p>
    </section>
  );
}
