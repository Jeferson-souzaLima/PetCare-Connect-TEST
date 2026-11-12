// Regras puras das páginas Lojas, Produtos e Serviços (sem React), testadas em explorar.test.js.

export const TIPOS_EXPLORAR = {
  lojas: { titulo: "Lojas", rota: "/lojas", placeholder: "Buscar lojas e clínicas", vazio: "Nenhuma loja encontrada." },
  produtos: { titulo: "Produtos", rota: "/produtos", placeholder: "Buscar produtos", vazio: "Nenhum produto encontrado." },
  servicos: { titulo: "Serviços", rota: "/servicos", placeholder: "Buscar serviços", vazio: "Nenhum serviço encontrado." },
};

const TAMANHO_MINIMO_BUSCA = 2;

/** De onde vem a lista: texto buscado, lugares perto da localização escolhida ou lista geral. */
export function fonteDaLista({ termo, localizacao }) {
  if ((termo ?? "").trim().length >= TAMANHO_MINIMO_BUSCA) return "busca";
  if (localizacao?.latitude != null && localizacao?.longitude != null) return "proximidade";
  return "geral";
}

/** Página 1 substitui a lista; as seguintes somam, sem repetir itens já mostrados. */
export function juntarPagina(atuais, novos, pagina) {
  if (pagina === 1) return [...(novos ?? [])];
  const vistos = new Set(atuais.map((item) => item.id));
  return [...atuais, ...(novos ?? []).filter((item) => !vistos.has(item.id))];
}
