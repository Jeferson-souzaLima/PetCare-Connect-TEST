import { API_URL } from "@/services/apiUrl";
const API = `${API_URL}`;

export async function buscarCarrinho(token) {
  const res = await fetch(`${API}/pedidos/carrinho`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Erro ao carregar carrinho");
  return res.json();
}

export async function adicionarItem(item, token) {
  const res = await fetch(`${API}/pedidos/carrinho/itens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });

  if (!res.ok) throw new Error("Erro ao adicionar item");
  return res.json();
}

export async function removerItem(itemId, token) {
  const res = await fetch(`${API}/pedidos/carrinho/itens/${itemId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Erro ao remover item");
}