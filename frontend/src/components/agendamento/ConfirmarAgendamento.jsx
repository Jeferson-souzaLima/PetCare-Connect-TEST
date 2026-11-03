import { CreditCard } from "lucide-react";

/** Aviso de processamento + botão principal que leva ao pagamento. */
export default function ConfirmarAgendamento({
  processandoAgendamento,
  habilitado,
  onConfirmar,
}) {
  return (
    <>
      {processandoAgendamento && (
        <div className="mt-6 rounded-2xl bg-green-50 border border-green-200 p-5 text-center">

          <div className="w-9 h-9 border-4 border-green-200 border-t-[#0E5617] rounded-full animate-spin mx-auto" />

          <p className="mt-3 font-semibold text-green-800">
            Preparando seu pagamento...
          </p>

          <p className="text-sm text-green-700 mt-1">
            Você será direcionado ao Checkout do Mercado Pago.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onConfirmar}
        disabled={!habilitado}
        className={`
          mt-6
          w-full
          flex
          items-center
          justify-center
          gap-2
          py-4
          rounded-2xl
          font-bold
          transition-all
          shadow-sm
          ${
            habilitado
              ? "bg-[#0E5617] hover:bg-[#0b4612] text-white hover:shadow-md active:scale-[0.99]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }
        `}
      >
        {processandoAgendamento ? (
          "Preparando pagamento..."
        ) : (
          <>
            Confirmar agendamento
            <CreditCard className="w-5 h-5" />
          </>
        )}
      </button>

      <p className="mt-3 mb-8 text-center text-xs text-gray-500">
        O pagamento será realizado com segurança pelo Mercado Pago.
      </p>
    </>
  );
}
