import api from "./api";

// Lojas, produtos e serviços perto de um ponto. O token, quando há sessão, vai pelo interceptor do api.
export async function buscarConteudoPorLocalizacao(latitude, longitude, page = 1, limit = 20) {
    const response = await api.post("/geolocalizacao", { latitude, longitude }, { params: { page, limit } });
    return response.data;
}

/** Coordenadas → { cidade, uf } (Nominatim, pelo backend). */
export async function buscarCidadePorCoordenadas(latitude, longitude) {
    const { data } = await api.get("/geolocalizacao/reverso", { params: { latitude, longitude } });
    return data;
}

/** CEP ou nome de cidade → { cidade, uf, latitude, longitude, cep? } (ViaCEP e Nominatim, pelo backend). */
export async function buscarLocal(texto) {
    const { data } = await api.get("/geolocalizacao/local", { params: { q: texto } });
    return data;
}
