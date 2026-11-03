import api from "./api";

/**
 * Calcula o frete de entrega a partir da loja e das coordenadas do cliente.
 * Retorna { frete, distanciaKm }.
 */
export async function calcularFrete({ lojaId, latitude, longitude }) {
  const { data } = await api.post("/pedidos/calcular-frete", {
    loja_id: lojaId,
    latitude,
    longitude,
  });

  return {
    frete: Number(data.frete || 0),
    distanciaKm: data.distancia_km != null ? Number(data.distancia_km) : null,
  };
}
