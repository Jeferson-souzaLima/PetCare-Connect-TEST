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

export async function obterFinanceiroAdmin(ano) {
  const { data } = await api.get("/admin/financeiro", { params: { ano } });
  return data;
}

export async function obterRankingsAdmin({ ano, mes }) {
  const { data } = await api.get("/admin/rankings", { params: { ano, mes: mes || undefined } });
  return data;
}

export async function listarEstornosAdmin() {
  const { data } = await api.get("/admin/estornos");
  return data;
}

export async function tentarEstornoAdmin(pagamentoId) {
  const { data } = await api.post(`/admin/estornos/${pagamentoId}/tentar`);
  return data;
}

export async function obterCatalogoLojaAdmin(lojaId) {
  const { data } = await api.get(`/admin/lojas/${lojaId}/catalogo`);
  return data;
}

export async function enviarImagensProdutoAdmin(produtoId, arquivos) {
  const form = new FormData();
  for (const arquivo of arquivos) form.append("imagens", arquivo);
  const { data } = await api.post(`/admin/produtos/${produtoId}/imagens`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function enviarLogoLojaAdmin(lojaId, arquivo) {
  const form = new FormData();
  form.append("imagem", arquivo);
  const { data } = await api.post(`/admin/lojas/${lojaId}/imagem`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
