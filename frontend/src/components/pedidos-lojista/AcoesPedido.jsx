import { useState } from "react";
import {
  FaArrowRight,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSyncAlt,
} from "react-icons/fa";

import { useAuth } from "../../hooks/useAuth";
import pedidoService from "../../services/pedidoService";
import { formatarStatus, obterProximoStatus } from "../../utils/statusPedido";

/** Botão que avança o pedido para a próxima etapa (ou indica que já terminou). */
export default function AcoesPedido({ pedido }) {
  const [processando, setProcessando] = useState(false);

  const { token } = useAuth();

  const proximoStatus = obterProximoStatus(pedido);

  async function alterarStatus() {
    if (!proximoStatus) return;

    const confirmar = window.confirm(
      `Deseja alterar o pedido #${pedido.id} para "${formatarStatus(
        proximoStatus
      )}"?`
    );

    if (!confirmar) return;

    try {
      setProcessando(true);

      await pedidoService.atualizarStatus(
        pedido.id,
        proximoStatus,
        token
      );

      window.location.reload();
    } catch (error) {
      console.error(
        "Erro ao atualizar status:",
        error
      );

      alert(
        error.response?.data?.mensagem ||
          "Não foi possível atualizar o status do pedido."
      );
    } finally {
      setProcessando(false);
    }
  }

  if (!proximoStatus) {
    return (
      <div className="border-t border-gray-100 mt-6 pt-5">

        {pedido.status === "entregue" && (
          <div className="flex items-center gap-2 text-green-700 font-medium">
            <FaCheckCircle />
            Pedido finalizado.
          </div>
        )}

        {pedido.status === "cancelado" && (
          <div className="flex items-center gap-2 text-red-600 font-medium">
            <FaExclamationTriangle />
            Pedido cancelado.
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 mt-6 pt-5">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <p className="text-sm text-gray-500">
            Próxima etapa
          </p>

          <p className="font-semibold text-green-900">
            {formatarStatus(proximoStatus)}
          </p>
        </div>

        <button
          type="button"
          onClick={alterarStatus}
          disabled={processando}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-900 text-white font-semibold hover:bg-green-800 transition disabled:opacity-60"
        >
          {processando ? (
            <>
              <FaSyncAlt className="animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              {pedido.status === "pago" &&
                "Iniciar preparo"}

              {pedido.status === "em_preparo" &&
                pedido.modalidade_entrega ===
                  "retirada" &&
                "Marcar como pronto"}

              {pedido.status === "em_preparo" &&
                pedido.modalidade_entrega ===
                  "entrega" &&
                "Enviar para entrega"}

              {pedido.status ===
                "pronto_para_retirada" &&
                "Marcar como entregue"}

              {pedido.status === "em_entrega" &&
                "Marcar como entregue"}

              <FaArrowRight />
            </>
          )}
        </button>

      </div>

    </div>
  );
}
