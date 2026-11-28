// Regras de exibição da página "Minha conta" (sem React), testadas em perfil.test.js.
import { proximosAgendamentos } from "./home.js";

/** Iniciais do nome para o avatar (até duas letras). */
export function iniciaisNome(nome) {
  const partes = String(nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  const letras = partes.length === 1 ? partes[0].slice(0, 1) : partes[0][0] + partes[partes.length - 1][0];
  return letras.toUpperCase();
}

export function primeiroNome(nome) {
  return String(nome ?? "").trim().split(/\s+/)[0] || "";
}

/**
 * Total de favoritos. A API (GET /favoritos) devolve { produtos, lojas, servicos };
 * cada grupo que não for lista conta como vazio. Sem resposta, null.
 */
export function totalFavoritos(favoritos) {
  if (Array.isArray(favoritos)) return favoritos.length;
  if (!favoritos || typeof favoritos !== "object") return null;
  return ["produtos", "lojas", "servicos"].reduce((soma, grupo) => soma + (Array.isArray(favoritos[grupo]) ? favoritos[grupo].length : 0), 0);
}

/**
 * Números do "Acesso rápido". Cada lista pode ser null (falhou ou não se aplica): o número fica null.
 * Agendamentos contam só os próximos (futuros e não encerrados), como em "Próximos serviços".
 */
export function contadoresPerfil({ favoritos, agendamentos, pedidos, pets }, agora = new Date()) {
  const tamanho = (lista) => (Array.isArray(lista) ? lista.length : null);
  return {
    favoritos: totalFavoritos(favoritos),
    agendamentos: Array.isArray(agendamentos) ? proximosAgendamentos(agendamentos, agora, Infinity).length : null,
    pedidos: tamanho(pedidos),
    pets: tamanho(pets),
  };
}

/** Número do card com dois dígitos ("02"), como no layout; sem dado, um traço. */
export function numeroCard(valor) {
  return Number.isInteger(valor) && valor >= 0 ? String(valor).padStart(2, "0") : "–";
}

/** Texto no singular ou plural conforme a quantidade. */
export function rotuloQuantidade(valor, singular, plural) {
  return valor === 1 ? singular : plural;
}
