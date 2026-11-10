// Evento disparado quando a API recusa o token (401) de uma sessão aberta.
export const EVENTO_SESSAO_EXPIRADA = "petcare:sessao-expirada";

// Marca lida pela tela de login para explicar por que a pessoa saiu.
export const CHAVE_AVISO_SESSAO_EXPIRADA = "sessaoExpirada";

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

export function tokenExpirado(token, agora = Date.now()) {
  const expiraEm = expiracaoDoToken(token);
  return expiraEm === null || expiraEm <= agora;
}

export function avisarSessaoExpirada() {
  window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
}
