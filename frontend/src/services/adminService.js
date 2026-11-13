import api from "@/services/api";

export async function listarLojasAdmin(status) {
  const { data } = await api.get("/admin/lojas", { params: { status } });
  return data;
}

export async function definirSituacaoLoja(lojaId, ativo) {
  const { data } = await api.patch(`/admin/lojas/${lojaId}`, { ativo });
  return data;
}

export async function listarUsuariosAdmin({ tipo, busca }) {
  const { data } = await api.get("/admin/usuarios", { params: { tipo: tipo || undefined, busca: busca || undefined } });
  return data;
}

export async function listarPedidosAdmin() {
  const { data } = await api.get("/admin/pedidos");
  return data;
}

export async function cancelarPedidoAdmin(pedidoId) {
  const { data } = await api.post(`/admin/pedidos/${pedidoId}/cancelar`);
  return data;
}
