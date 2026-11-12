/*
 * Filtros públicos das listas de produtos, lojas e serviços (páginas Explorar).
 * Cada função valida a query e devolve { erro } ou os filtros prontos para o model.
 * O texto buscado vai sempre como parâmetro (LIKE ?), nunca concatenado no SQL.
 */
const TAMANHO_MAXIMO_TERMO = 80;

// Tipos de serviço pelo nome (o banco não tem categoria de serviço; ver proposta de categorias).
const PALAVRAS_POR_TIPO = {
    banho_tosa: ['banho', 'tosa', 'hidrata', 'escova'],
    saude: ['vacin', 'veterin', 'consulta', 'microchip', 'exame', 'castra', 'vermif']
};
const TIPOS_SERVICO = ['banho_tosa', 'saude', 'outros'];
const ORDENS_PRODUTO = ['preco_asc', 'preco_desc'];

function lerTermo(query) {
    if (query.q === undefined) return { termo: null };
    if (typeof query.q !== 'string') return { erro: 'Busca inválida.' };
    const termo = query.q.trim();
    if (termo.length > TAMANHO_MAXIMO_TERMO) return { erro: 'Busca muito longa.' };
    return { termo: termo || null };
}

function lerOpcao(valor, permitidos, mensagem) {
    if (valor === undefined || valor === '') return { valor: null };
    if (typeof valor !== 'string' || !permitidos.includes(valor)) return { erro: mensagem };
    return { valor };
}

/** "%texto%" com %, _ e \ escapados (o MySQL usa \ como escape padrão do LIKE). */
function padraoLike(texto) {
    return `%${texto.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/** Condição SQL (para somar ao WHERE) e seus parâmetros. */
function condicaoTermo(coluna, termo) {
    return termo ? { sql: ` AND ${coluna} LIKE ?`, valores: [padraoLike(termo)] } : { sql: '', valores: [] };
}

function condicaoTipoServico(tipo) {
    if (!tipo) return { sql: '', valores: [] };
    const palavras = tipo === 'outros'
        ? [...PALAVRAS_POR_TIPO.banho_tosa, ...PALAVRAS_POR_TIPO.saude]
        : PALAVRAS_POR_TIPO[tipo];
    const alguma = palavras.map(() => 's.nome LIKE ?').join(' OR ');
    return {
        sql: tipo === 'outros' ? ` AND NOT (${alguma})` : ` AND (${alguma})`,
        valores: palavras.map((p) => `%${p}%`)
    };
}

exports.filtrosProdutos = (query) => {
    const { termo, erro } = lerTermo(query);
    if (erro) return { erro };
    const ordem = lerOpcao(query.ordem, ORDENS_PRODUTO, 'Ordem inválida.');
    if (ordem.erro) return { erro: ordem.erro };
    return { ordem: ordem.valor, termo: condicaoTermo('p.nome', termo) };
};

exports.filtrosLojas = (query) => {
    const { termo, erro } = lerTermo(query);
    if (erro) return { erro };
    const entrega = lerOpcao(query.entrega, ['1'], 'Filtro de entrega inválido.');
    if (entrega.erro) return { erro: entrega.erro };
    return { soComEntrega: entrega.valor === '1', termo: condicaoTermo('nome_fantasia', termo) };
};

exports.filtrosServicos = (query) => {
    const { termo, erro } = lerTermo(query);
    if (erro) return { erro };
    const tipo = lerOpcao(query.tipo, TIPOS_SERVICO, 'Tipo de serviço inválido.');
    if (tipo.erro) return { erro: tipo.erro };
    return { tipo: condicaoTipoServico(tipo.valor), termo: condicaoTermo('s.nome', termo) };
};
