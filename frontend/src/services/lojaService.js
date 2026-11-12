import api from "@/services/api";

function authConfig(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function buscarLojas(page = 1, limit = 20, filtros = {}) {
  const response = await api.get('/lojas', {
    params: {
      page,
      limit,
      ...filtros
    }
  });

  return response.data;
}

export async function buscarMinhaLoja(token) { const response = await api.get('/lojas/minha', authConfig(token)); return response.data; }
export async function salvarMinhaLoja(dados, token, lojaExiste) { const config = authConfig(token); const response = lojaExiste ? await api.put('/lojas/minha', dados, config) : await api.post('/lojas/minha', dados, config); return response.data; }
export async function enviarImagemMinhaLoja(imagem, token) { const formData = new FormData(); formData.append('imagem', imagem); const response = await api.post('/lojas/minha/imagem', formData, { headers: { Authorization: `Bearer ${token}` } }); return response.data; }
