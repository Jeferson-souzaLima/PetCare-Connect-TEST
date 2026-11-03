/** Status de pedido considerados "em andamento" (exigem ação da loja). */
export const STATUS_EM_ANDAMENTO = [
  "pago",
  "em_preparo",
  "pronto_para_retirada",
  "em_entrega",
];

export const STATUS_FINAIS = ["entregue", "cancelado"];

/** Rótulo e cores de cada status de pedido. */
export const STATUS_PEDIDO = {
  aguardando_pagamento: {
    label: "Aguardando pagamento",
    classes: "bg-yellow-100 text-yellow-800",
  },
  pago: {
    label: "Pago",
    classes: "bg-blue-100 text-blue-800",
  },
  em_preparo: {
    label: "Em preparo",
    classes: "bg-orange-100 text-orange-800",
  },
  pronto_para_retirada: {
    label: "Pronto para retirada",
    classes: "bg-purple-100 text-purple-800",
  },
  em_entrega: {
    label: "Em entrega",
    classes: "bg-indigo-100 text-indigo-800",
  },
  entregue: {
    label: "Entregue",
    classes: "bg-green-100 text-green-800",
  },
  cancelado: {
    label: "Cancelado",
    classes: "bg-red-100 text-red-800",
  },
};

export function formatarStatus(status) {
  return STATUS_PEDIDO[status]?.label || status;
}

/* ============================================================
   PRÓXIMO STATUS
============================================================ */

export function obterProximoStatus(pedido) {
  if (pedido.status === "pago") {
    return "em_preparo";
  }

  if (pedido.status === "em_preparo") {
    if (pedido.modalidade_entrega === "retirada") {
      return "pronto_para_retirada";
    }

    if (pedido.modalidade_entrega === "entrega") {
      return "em_entrega";
    }
  }

  if (pedido.status === "pronto_para_retirada") {
    return "entregue";
  }

  if (pedido.status === "em_entrega") {
    return "entregue";
  }

  return null;
}
