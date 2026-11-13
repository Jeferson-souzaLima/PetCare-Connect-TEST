import { api } from "./api";

const pedidoService = {
  listarPedidosLoja: (token) => {
    return api.get("/pedidos/loja", {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  atualizarStatus: (id, status, token) => {
    return api.put(
      `/pedidos/${id}/status`,
      { status },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  },

  /** Cliente cancela o próprio pedido; se já foi pago, o backend estorna. */
  cancelarMeuPedido: async (id) => {
    const response = await api.post(`/pedidos/${id}/cancelar`);
    return response.data;
  }
};

export default pedidoService;