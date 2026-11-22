import { API_URL } from "@/services/apiUrl";
import axios from "axios";

export async function buscarProdutos(page = 1, limit = 20, filtros = {}) {
    const response = await axios.get(
        `${API_URL}/produtos`,
        {
            params: {
                page,
                limit,
                ...filtros
            }
        }
    );

    return response.data;
}

/** Um produto ativo, com todas as imagens e a loja (inclui se a loja faz entrega). */
export async function buscarProduto(id) {
    const response = await axios.get(`${API_URL}/produtos/${encodeURIComponent(id)}`);
    return response.data;
}

/** Produtos ativos de uma loja (sugestões do "Leve também!"). */
export async function buscarProdutosDaLoja(lojaId) {
    const response = await axios.get(`${API_URL}/produtos/loja/${encodeURIComponent(lojaId)}`);
    return Array.isArray(response.data) ? response.data : [];
}
