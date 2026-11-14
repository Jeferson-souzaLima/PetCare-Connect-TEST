// Regras puras das páginas Lojas, Produtos e Serviços (sem React), testadas em explorar.test.js.

export const TIPOS_EXPLORAR = {
  lojas: { titulo: "Lojas", rota: "/lojas", placeholder: "Buscar lojas e clínicas", vazio: "Nenhuma loja encontrada." },
  produtos: { titulo: "Produtos", rota: "/produtos", placeholder: "Buscar produtos", vazio: "Nenhum produto encontrado." },
  servicos: { titulo: "Serviços", rota: "/servicos", placeholder: "Buscar serviços", vazio: "Nenhum serviço encontrado." },
};

// Um filtro por página, aplicado na API (a paginação continua certa).
export const FILTROS_EXPLORAR = {
  lojas: { parametro: "entrega", rotulo: "Entrega", opcoes: [{ valor: "", rotulo: "Todas" }, { valor: "1", rotulo: "Só as que entregam" }] },
  produtos: {
    parametro: "ordem",
    rotulo: "Ordenar",
    opcoes: [
      { valor: "", rotulo: "Destaques" },
      { valor: "preco_asc", rotulo: "Menor preço" },
      { valor: "preco_desc", rotulo: "Maior preço" },
    ],
  },
  servicos: {
    parametro: "tipo",
    rotulo: "Tipo",
    opcoes: [
      { valor: "", rotulo: "Todos" },
      { valor: "banho_tosa", rotulo: "Banho e tosa" },
      { valor: "saude", rotulo: "Saúde e vacinas" },
      { valor: "outros", rotulo: "Outros" },
    ],
  },
};

const TAMANHO_MINIMO_BUSCA = 2;

function termoValido(termo) {
  const limpo = (termo ?? "").trim();
  return limpo.length >= TAMANHO_MINIMO_BUSCA ? limpo : null;
}

/** Filtro da página lido da URL, só com valores conhecidos. */
export function filtrosDaUrl(tipo, searchParams) {
  const { parametro, opcoes } = FILTROS_EXPLORAR[tipo];
  const valor = searchParams.get(parametro);
  return valor && opcoes.some((o) => o.valor === valor) ? { [parametro]: valor } : {};
}

/** Parâmetros da lista na API: texto buscado (2 letras ou mais) e o filtro. */
export function parametrosDaLista({ termo, filtros }) {
  const q = termoValido(termo);
  return { ...(q ? { q } : {}), ...filtros };
}

/** De onde vem a lista: busca/filtro na API, lugares perto da localização escolhida ou lista geral. */
export function fonteDaLista({ termo, filtros, localizacao }) {
  if (Object.keys(parametrosDaLista({ termo, filtros })).length) return "filtrada";
  if (localizacao?.latitude != null && localizacao?.longitude != null) return "proximidade";
  return "geral";
}

/** Página 1 substitui a lista; as seguintes somam, sem repetir itens já mostrados. */
export function juntarPagina(atuais, novos, pagina) {
  if (pagina === 1) return [...(novos ?? [])];
  const vistos = new Set(atuais.map((item) => item.id));
  return [...atuais, ...(novos ?? []).filter((item) => !vistos.has(item.id))];
}
