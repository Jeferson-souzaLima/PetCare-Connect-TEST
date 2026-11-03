import { CreditCard } from "lucide-react";

import CabecalhoSecao from "../ui/CabecalhoSecao";

/** Informa que o pagamento é feito no Checkout do Mercado Pago. */
export default function AvisoPagamento() {
  return (
    <section className="mt-8 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <CabecalhoSecao
        icon={CreditCard}
        titulo="Pagamento"
        descricao="Pagamento seguro pelo Mercado Pago."
      />

      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-800">
          Você escolherá <strong>Pix ou cartão</strong> com
          segurança no Checkout do Mercado Pago.
        </p>
      </div>
    </section>
  );
}
