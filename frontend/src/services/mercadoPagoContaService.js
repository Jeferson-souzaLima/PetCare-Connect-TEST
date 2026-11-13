import api from "@/services/api";

/** Conta Mercado Pago da loja do lojista logado (split de pagamento). */

export async function buscarContaMercadoPago() {
  const response = await api.get("/mercadopago/conta");
  return response.data;
}

export async function iniciarConexaoMercadoPago() {
  const response = await api.post("/mercadopago/conta/conectar");
  return response.data.url;
}

export async function desconectarMercadoPago() {
  await api.delete("/mercadopago/conta");
}
