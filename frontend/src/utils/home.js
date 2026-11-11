// Regras puras da nova home (sem React), testadas em home.test.js.

const STATUS_ENCERRADOS = new Set(["cancelado", "concluido"]);

function tempo(valor) {
  const ms = Date.parse(valor ?? "");
  return Number.isNaN(ms) ? null : ms;
}

/** Agendamentos futuros e ativos, do mais próximo ao mais distante. */
export function proximosAgendamentos(lista, agora = new Date(), limite = 3) {
  if (!Array.isArray(lista)) return [];
  const agoraMs = agora.getTime();

  return lista
    .filter((a) => !STATUS_ENCERRADOS.has(a?.status))
    .map((a) => ({ a, ms: tempo(a?.data_inicio) }))
    .filter(({ ms }) => ms !== null && ms > agoraMs)
    .sort((x, y) => x.ms - y.ms)
    .slice(0, limite)
    .map(({ a }) => a);
}

/** Pedidos do mais recente ao mais antigo. */
export function pedidosRecentes(lista, limite = 3) {
  if (!Array.isArray(lista)) return [];
  return [...lista]
    .sort((x, y) => (tempo(y?.data_pedido) ?? 0) - (tempo(x?.data_pedido) ?? 0))
    .slice(0, limite);
}

/** Texto do seletor de cidade e, quando não há localização, para onde levar a pessoa. */
export function rotuloLocalizacao({ usuario, coords }) {
  if (usuario?.cidade && usuario?.uf) {
    return { texto: `${usuario.cidade} - ${usuario.uf}`, destino: null };
  }
  if (coords) return { texto: "Perto de você", destino: null };
  return { texto: "Definir localização", destino: usuario ? "/perfil" : "/login" };
}

/**
 * URL pública de uma imagem da home no R2 (VITE_MEDIA_URL = R2_PUBLIC_URL).
 * Sem a variável, devolve null e a home mostra o fallback sem imagem.
 */
export function urlBanner(arquivo, base = import.meta.env?.VITE_MEDIA_URL) {
  const raiz = typeof base === "string" ? base.trim().replace(/\/+$/, "") : "";
  if (!raiz || !arquivo) return null;
  return `${raiz}/banners/home/${arquivo}`;
}
