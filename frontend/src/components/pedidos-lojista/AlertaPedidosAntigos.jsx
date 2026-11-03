import { FaArrowRight, FaExclamationTriangle } from "react-icons/fa";

/** Aviso de pedidos de dias anteriores que ainda estão em andamento. */
export default function AlertaPedidosAntigos({ quantidade, onVerPedidos }) {
  return (
    <section className="px-2 mb-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div className="flex items-start gap-3">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-700">
              <FaExclamationTriangle />
            </div>

            <div>
              <h2 className="font-bold text-yellow-900">
                Atenção
              </h2>

              <p className="text-sm text-yellow-800 mt-1">
                Você tem{" "}
                <strong>
                  {quantidade}
                </strong>{" "}
                {quantidade === 1
                  ? "pedido em andamento"
                  : "pedidos em andamento"}{" "}
                de dias anteriores.
              </p>
            </div>
          </div>

          <button
            onClick={onVerPedidos}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-yellow-600 text-white font-semibold hover:bg-yellow-700 transition"
          >
            Ver pedidos
            <FaArrowRight />
          </button>

        </div>
      </div>
    </section>
  );
}
