import { STATUS_PEDIDO } from "../../utils/statusPedido";

/** Etiqueta colorida com o status do pedido. */
export default function StatusBadge({ status }) {
  const configuracao =
    STATUS_PEDIDO[status] || {
      label: status,
      classes:
        "bg-gray-100 text-gray-700",
    };

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${configuracao.classes}`}
    >
      {configuracao.label}
    </span>
  );
}
