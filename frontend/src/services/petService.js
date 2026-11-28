import { api } from "./api";

const petService = {
  /** Espécies (com raças) e fases de vida aceitas no cadastro. */
  opcoes: () => api.get("/pets/opcoes"),

  listar: (token) => {
    return api.get("/pets", {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  criar: (formData, token) => {
    return api.post("/pets", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    });
  },

  atualizar: (id, dados, token) => {
    return api.put(`/pets/${id}`, dados, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  deletar: (id, token) => {
    return api.delete(`/pets/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  atualizarImagem: (id, formData, token) => {
    return api.post(`/pets/${id}/imagem`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    });
  }
};

export default petService;