// Regras da barra inferior do celular (sem React), testadas em navegacaoInferior.test.js.

const ROTAS = [
  ["inicio", /^\/$/],
  ["explorar", /^\/(lojas|produtos|servicos|busca|agendar)(\/|$)/],
  ["agenda", /^\/meus-agendamentos(\/|$)/],
  ["pedidos", /^\/(meus-pedidos|pagamento)(\/|$)/],
  ["carrinho", /^\/carrinho(\/|$)/],
  ["conta", /^\/(perfil|favoritos)(\/|$)/],
];

/**
 * Item da barra que corresponde à página atual, ou null (ex.: /admin).
 * Vem só do endereço, então funciona ao abrir o link direto ou atualizar a página.
 */
export function itemAtivo(pathname) {
  const caminho = String(pathname || "/").replace(/\/+$/, "") || "/";
  return ROTAS.find(([, padrao]) => padrao.test(caminho))?.[0] ?? null;
}

/** Quantidade de unidades no carrinho, para o selo do ícone. */
export function unidadesNoCarrinho(carrinho) {
  return (carrinho?.itens ?? []).reduce((total, item) => total + (Number(item.quantidade) || 0), 0);
}

/** Texto do selo: até 99, depois "99+". */
export function rotuloContador(valor) {
  return valor > 99 ? "99+" : String(valor);
}
