import { API_URL } from "@/services/apiUrl";
// src/services/authService.js
import axios from "axios";

export const loginUser = async (email, senha) => {
  const response = await axios.post(`${API_URL}/auth/login`, { email, senha });
  return response.data; // { token, usuario, mensagem }
};

export const solicitarRedefinicaoSenha = async (email) => {
  const response = await axios.post(`${API_URL}/auth/esqueci-senha`, { email });
  return response.data;
};

export const redefinirSenha = async ({ token, senha, confirmacaoSenha }) => {
  const response = await axios.post(`${API_URL}/auth/redefinir-senha`, { token, senha, confirmacaoSenha });
  return response.data;
};