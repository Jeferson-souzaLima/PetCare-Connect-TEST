import { API_URL } from "@/services/apiUrl";
import axios from "axios";

export async function buscarServicos(page = 1, limit = 20, filtros = {}) {
  const response = await axios.get(`${API_URL}/servicos`, { params: { page, limit, ...filtros } });
  return response.data;
}
