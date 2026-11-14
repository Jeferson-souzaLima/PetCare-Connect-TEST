// Regras puras da nova home (sem React), testadas em home.test.js.

// Status reais do backend (agendamentosController): cancelado_cliente, cancelado_loja, concluido.
const STATUS_ENCERRADOS = new Set(["cancelado_cliente", "cancelado_loja", "concluido"]);

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

// Imagens do site (banners, cards, fotos padrão) ficam no próprio site, em public/midia.
// Se VITE_MEDIA_URL estiver definida, elas vêm de lá (R2), com os mesmos caminhos.
const MIDIA_LOCAL = "/midia";
const midiaExterna = () => (import.meta.env?.VITE_MEDIA_URL ?? "").trim();

/** true quando há um endereço externo de mídia (R2) configurado. */
export function temMidiaExterna() {
  return Boolean(midiaExterna());
}

/** URL de um arquivo de mídia do site (ex.: "site/home/x.webp"); null sem caminho ou com base vazia. */
export function urlMidiaSite(caminho, base = midiaExterna() || MIDIA_LOCAL) {
  const raiz = typeof base === "string" ? base.trim().replace(/\/+$/, "") : "";
  if (!raiz || !caminho) return null;
  return `${raiz}/${caminho.replace(/^\/+/, "")}`;
}

/** URL de um banner da home (banners/home/). */
export function urlBanner(arquivo, base) {
  return arquivo ? urlMidiaSite(`banners/home/${arquivo}`, base) : null;
}
