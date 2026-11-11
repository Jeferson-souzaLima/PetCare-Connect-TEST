import { api } from "./api";

// Resumo do cliente na home. O token é enviado pelo interceptor de services/api.js.
export async function listarMeusPets() {
  const { data } = await api.get("/pets");
  return data;
}

export async function listarMeusAgendamentos() {
  const { data } = await api.get("/agendamentos/meus");
  return data;
}

export async function listarMeusPedidos() {
  const { data } = await api.get("/pedidos/meus");
  return data;
}
