import { API_URL } from "@/services/apiUrl";
import axios from "axios";
import { avisarSessaoExpirada } from "@/utils/sessao";

export const api = axios.create({
  baseURL: `${API_URL}`,
});

api.interceptors.request.use((config) => {

  const token = localStorage.getItem("token");

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;

});

/*
 * Se a API recusar o token de uma requisição autenticada (401), a sessão
 * acabou (token expirado ou inválido): o AuthProvider encerra a sessão.
 * Respostas 401 sem token (ex.: senha errada no login) são ignoradas.
 */
function observarSessaoExpirada(instancia) {
  instancia.interceptors.response.use(
    (resposta) => resposta,
    (erro) => {
      const headers = erro?.config?.headers;
      const enviouToken = Boolean(headers?.get?.("Authorization") ?? headers?.Authorization);

      if (erro?.response?.status === 401 && enviouToken) {
        avisarSessaoExpirada();
      }

      return Promise.reject(erro);
    }
  );
}

observarSessaoExpirada(api);
// Alguns serviços usam o axios padrão diretamente.
observarSessaoExpirada(axios);

export default api;
