const { consultar } = require('../utils/transacao');

/*
 * Indicadores do painel do administrador, somando todas as lojas.
 * Seguem a mesma regra do relatório do lojista: a venda conta na data do
 * pagamento (updated_at) e só pagamentos aprovados entram no GMV. Uma venda
 * estornada passa a ter status 'estornado' e sai do GMV.
 */

const LIMITE_RANKING = 10;

exports.financeiroPorMes = (inicio, fimExclusivo) => consultar(
    `SELECT
        MONTH(pg.updated_at) AS mes,
        COALESCE(SUM(CASE WHEN pg.status = 'aprovado' THEN pg.valor END), 0) AS gmv,
        COALESCE(SUM(CASE WHEN pg.status = 'aprovado' AND pg.tipo_referencia = 'pedido' THEN pg.valor END), 0) AS gmv_produtos,
        COALESCE(SUM(CASE WHEN pg.status = 'aprovado' AND pg.tipo_referencia = 'agendamento' THEN pg.valor END), 0) AS gmv_servicos,
        COALESCE(SUM(CASE WHEN pg.status = 'aprovado' THEN pg.valor_comissao END), 0) AS receita_comissoes,
        COUNT(CASE WHEN pg.status = 'aprovado' THEN 1 END) AS vendas,
        COALESCE(SUM(CASE WHEN pg.status = 'estornado' THEN pg.valor END), 0) AS estornos,
        COUNT(CASE WHEN pg.status = 'estornado' THEN 1 END) AS vendas_estornadas
     FROM pagamentos pg
     WHERE pg.status IN ('aprovado', 'estornado')
       AND pg.updated_at >= ?
       AND pg.updated_at < ?
     GROUP BY MONTH(pg.updated_at)
     ORDER BY mes ASC`,
    [inicio, fimExclusivo]
);

const produtosMaisVendidos = (inicio, fimExclusivo) => consultar(
    `SELECT ip.item_id AS id, MAX(ip.nome_item) AS nome, MAX(l.nome_fantasia) AS loja,
            SUM(ip.quantidade) AS quantidade, SUM(ip.preco_unitario * ip.quantidade) AS valor
     FROM pagamentos pg
     INNER JOIN pedidos pe ON pg.tipo_referencia = 'pedido' AND pe.id = pg.referencia_id
     INNER JOIN itenspedido ip ON ip.pedido_id = pe.id AND ip.tipo = 'produto'
     INNER JOIN lojas l ON l.id = pe.loja_id
     WHERE pg.status = 'aprovado' AND pg.updated_at >= ? AND pg.updated_at < ?
     GROUP BY ip.item_id
     ORDER BY quantidade DESC, valor DESC, nome ASC
     LIMIT ${LIMITE_RANKING}`,
    [inicio, fimExclusivo]
);

const servicosMaisVendidos = (inicio, fimExclusivo) => consultar(
    `SELECT s.id, s.nome, l.nome_fantasia AS loja,
            COUNT(*) AS quantidade, SUM(pg.valor) AS valor
     FROM pagamentos pg
     INNER JOIN agendamentos ag ON pg.tipo_referencia = 'agendamento' AND ag.id = pg.referencia_id
     INNER JOIN servicos s ON s.id = ag.servico_id
     INNER JOIN lojas l ON l.id = ag.loja_id
     WHERE pg.status = 'aprovado' AND pg.updated_at >= ? AND pg.updated_at < ?
     GROUP BY s.id, s.nome, l.nome_fantasia
     ORDER BY quantidade DESC, valor DESC, s.nome ASC
     LIMIT ${LIMITE_RANKING}`,
    [inicio, fimExclusivo]
);

const lojasQueMaisVendem = (inicio, fimExclusivo) => consultar(
    `SELECT l.id, l.nome_fantasia AS nome,
            COUNT(*) AS vendas, SUM(pg.valor) AS valor, COALESCE(SUM(pg.valor_comissao), 0) AS comissao
     FROM pagamentos pg
     LEFT JOIN pedidos pe ON pg.tipo_referencia = 'pedido' AND pe.id = pg.referencia_id
     LEFT JOIN agendamentos ag ON pg.tipo_referencia = 'agendamento' AND ag.id = pg.referencia_id
     INNER JOIN lojas l ON l.id = COALESCE(pe.loja_id, ag.loja_id)
     WHERE pg.status = 'aprovado' AND pg.updated_at >= ? AND pg.updated_at < ?
     GROUP BY l.id, l.nome_fantasia
     ORDER BY valor DESC, vendas DESC, nome ASC
     LIMIT ${LIMITE_RANKING}`,
    [inicio, fimExclusivo]
);

// Favoritos atuais (de todos os tempos): os 10 primeiros de cada tipo, ignorando itens já excluídos.
const maisFavoritados = () => consultar(
    `SELECT tipo, id, nome, total FROM (
        SELECT f.tipo, f.referencia_id AS id,
               MAX(COALESCE(p.nome, s.nome, l.nome_fantasia)) AS nome,
               COUNT(*) AS total,
               ROW_NUMBER() OVER (PARTITION BY f.tipo ORDER BY COUNT(*) DESC, f.referencia_id ASC) AS posicao
        FROM favoritos f
        LEFT JOIN produtos p ON f.tipo = 'produto' AND p.id = f.referencia_id
        LEFT JOIN servicos s ON f.tipo = 'servico' AND s.id = f.referencia_id
        LEFT JOIN lojas l ON f.tipo = 'loja' AND l.id = f.referencia_id
        WHERE COALESCE(p.id, s.id, l.id) IS NOT NULL
        GROUP BY f.tipo, f.referencia_id
     ) ranking
     WHERE posicao <= ${LIMITE_RANKING}
     ORDER BY tipo ASC, posicao ASC`
);

const termosMaisBuscados = (inicio, fimExclusivo, somenteSemResultado) => consultar(
    `SELECT termo, COUNT(*) AS total
     FROM buscas_realizadas
     WHERE created_at >= ? AND created_at < ?
       ${somenteSemResultado ? 'AND total_resultados = 0' : ''}
     GROUP BY termo
     ORDER BY total DESC, termo ASC
     LIMIT ${LIMITE_RANKING}`,
    [inicio, fimExclusivo]
);

exports.rankings = async (inicio, fimExclusivo) => {
    const [produtos, servicos, lojas, favoritos, buscas, buscasSemResultado] = await Promise.all([
        produtosMaisVendidos(inicio, fimExclusivo),
        servicosMaisVendidos(inicio, fimExclusivo),
        lojasQueMaisVendem(inicio, fimExclusivo),
        maisFavoritados(),
        termosMaisBuscados(inicio, fimExclusivo, false),
        termosMaisBuscados(inicio, fimExclusivo, true)
    ]);

    return { produtos, servicos, lojas, favoritos, buscas, buscasSemResultado };
};
