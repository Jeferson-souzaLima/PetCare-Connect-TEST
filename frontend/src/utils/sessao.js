// Evento disparado quando a API recusa o token (401) de uma sessão aberta.
export const EVENTO_SESSAO_EXPIRADA = "petcare:sessao-expirada";

// Mensagem guardada para a tela de login explicar por que a pessoa saiu.
const CHAVE_AVISO_LOGIN = "avisoLogin";

export function deixarAvisoParaLogin(texto) {
  try {
    sessionStorage.setItem(CHAVE_AVISO_LOGIN, texto);
  } catch {
    // Sem sessionStorage a pessoa sai mesmo assim, só sem o aviso.
  }
}

export function lerAvisoParaLogin() {
  try {
    return sessionStorage.getItem(CHAVE_AVISO_LOGIN) || "";
  } catch {
    return "";
  }
}

/** Apaga o aviso depois de exibido, para não reaparecer. */
export function limparAvisoParaLogin() {
  try {
    sessionStorage.removeItem(CHAVE_AVISO_LOGIN);
  } catch {
    // Nada a limpar sem sessionStorage.
  }
}

/** Momento (em ms) em que o token expira, ou null se não for possível ler. */
export function expiracaoDoToken(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
}

// Maior espera aceita por setTimeout (cerca de 24,8 dias); acima disso ele dispara na hora.
const MAIOR_ESPERA_DO_TIMER = 2 ** 31 - 1;

/**
 * Quanto esperar (ms) antes de conferir se o token venceu, ou null se não der para ler.
 * Tokens de "manter conectado" (30 dias) passam do limite do setTimeout: nesse caso
 * espera o máximo permitido, e quem chamou confere de novo.
 */
export function esperaAteConferirToken(token, agora = Date.now()) {
  const expiraEm = expiracaoDoToken(token);
  if (expiraEm === null) return null;
  return Math.min(Math.max(expiraEm - agora, 0), MAIOR_ESPERA_DO_TIMER);
}

export function tokenExpirado(token, agora = Date.now()) {
  const expiraEm = expiracaoDoToken(token);
  return expiraEm === null || expiraEm <= agora;
}

export function avisarSessaoExpirada() {
  window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
}
