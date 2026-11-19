const db = require('../db');

const executar = (sql, valores) => new Promise((resolve, reject) => {
    db.query(sql, valores, (erro, resultados) => {
        if (erro) return reject(erro);
        resolve(resultados);
    });
});

const LIMITE_VENDAS = 100;

exports.obterRelatorioDaLoja = async (lojaId, inicio, fimExclusivo) => {
    const periodoPagamento = [lojaId, inicio, fimExclusivo];
    const periodoAgendamento = [lojaId, inicio, fimExclusivo];

    const [resumo, vendasPorPeriodo, produtosMaisVendidos, totalAgendamentos, agendamentosPorStatus, servicosMaisAgendados, vendas] = await Promise.all([
        executar(
            `SELECT
                COALESCE(SUM(CASE WHEN pg.tipo_referencia = 'pedido' THEN pg.valor ELSE 0 END), 0) AS receita_produtos,
                COALESCE(SUM(CASE WHEN pg.tipo_referencia = 'agendamento' THEN pg.valor ELSE 0 END), 0) AS receita_servicos,
                COALESCE(SUM(pg.valor), 0) AS receita_total,
                COALESCE(SUM(pg.valor_comissao), 0) AS comissao_total,
                COALESCE(SUM(pg.tarifa_gateway), 0) AS tarifa_total,
                COUNT(DISTINCT CASE WHEN pg.tipo_referencia = 'pedido' THEN pe.id END) AS pedidos_pagos,
                COUNT(DISTINCT CASE WHEN pg.tipo_referencia = 'agendamento' THEN ag.id END) AS agendamentos_pagos
            FROM pagamentos pg
            LEFT JOIN pedidos pe
                ON pg.tipo_referencia = 'pedido' AND pg.referencia_id = pe.id AND pe.loja_id = ?
            LEFT JOIN agendamentos ag
                ON pg.tipo_referencia = 'agendamento' AND pg.referencia_id = ag.id AND ag.loja_id = ?
            WHERE pg.status = 'aprovado'
              AND pg.updated_at >= ?
              AND pg.updated_at < ?
              AND (pe.id IS NOT NULL OR ag.id IS NOT NULL)`,
            [lojaId, lojaId, inicio, fimExclusivo]
        ),
        executar(
            `SELECT
                DATE(pg.updated_at) AS data,
                COALESCE(SUM(CASE WHEN pg.tipo_referencia = 'pedido' THEN pg.valor ELSE 0 END), 0) AS receita_produtos,
                COALESCE(SUM(CASE WHEN pg.tipo_referencia = 'agendamento' THEN pg.valor ELSE 0 END), 0) AS receita_servicos,
                COALESCE(SUM(pg.valor), 0) AS receita_total,
                COUNT(DISTINCT CASE WHEN pg.tipo_referencia = 'pedido' THEN pe.id END) AS pedidos_pagos,
                COUNT(DISTINCT CASE WHEN pg.tipo_referencia = 'agendamento' THEN ag.id END) AS agendamentos_pagos
            FROM pagamentos pg
            LEFT JOIN pedidos pe
                ON pg.tipo_referencia = 'pedido' AND pg.referencia_id = pe.id AND pe.loja_id = ?
            LEFT JOIN agendamentos ag
                ON pg.tipo_referencia = 'agendamento' AND pg.referencia_id = ag.id AND ag.loja_id = ?
            WHERE pg.status = 'aprovado'
              AND pg.updated_at >= ?
              AND pg.updated_at < ?
              AND (pe.id IS NOT NULL OR ag.id IS NOT NULL)
            GROUP BY DATE(pg.updated_at)
            ORDER BY data ASC`,
            [lojaId, lojaId, inicio, fimExclusivo]
        ),
        executar(
            `SELECT
                ip.item_id AS produto_id,
                MAX(ip.nome_item) AS nome,
                SUM(ip.quantidade) AS quantidade_vendida,
                SUM(ip.preco_unitario * ip.quantidade) AS receita
            FROM pagamentos pg
            INNER JOIN pedidos pe
                ON pg.tipo_referencia = 'pedido'
                AND pg.referencia_id = pe.id
                AND pe.loja_id = ?
            INNER JOIN itenspedido ip
                ON ip.pedido_id = pe.id AND ip.tipo = 'produto'
            WHERE pg.status = 'aprovado'
              AND pg.updated_at >= ?
              AND pg.updated_at < ?
            GROUP BY ip.item_id
            ORDER BY quantidade_vendida DESC, receita DESC, nome ASC
            LIMIT 10`,
            periodoPagamento
        ),
        executar(
            `SELECT COUNT(*) AS total
            FROM agendamentos
            WHERE loja_id = ?
              AND data_inicio >= ?
              AND data_inicio < ?`,
            periodoAgendamento
        ),
        executar(
            `SELECT status, COUNT(*) AS total
            FROM agendamentos
            WHERE loja_id = ?
              AND data_inicio >= ?
              AND data_inicio < ?
            GROUP BY status
            ORDER BY status ASC`,
            periodoAgendamento
        ),
        executar(
            `SELECT
                s.id AS servico_id,
                s.nome,
                COUNT(a.id) AS total_agendamentos,
                SUM(CASE WHEN a.status = 'concluido' THEN 1 ELSE 0 END) AS concluidos,
                SUM(CASE WHEN a.status IN ('cancelado', 'cancelado_cliente', 'cancelado_loja') THEN 1 ELSE 0 END) AS cancelados
            FROM agendamentos a
            INNER JOIN servicos s ON s.id = a.servico_id AND s.loja_id = ?
            WHERE a.loja_id = ?
              AND a.data_inicio >= ?
              AND a.data_inicio < ?
            GROUP BY s.id, s.nome
            ORDER BY total_agendamentos DESC, s.nome ASC
            LIMIT 10`,
            [lojaId, ...periodoAgendamento]
        ),
        // Cada venda paga (ou estornada) com a divisão do valor, mais recentes primeiro.
        executar(
            `SELECT
                pg.id AS pagamento_id,
                pg.tipo_referencia,
                pg.referencia_id,
                pg.status,
                pg.valor,
                pg.valor_comissao,
                pg.tarifa_gateway,
                pg.updated_at AS data
            FROM pagamentos pg
            LEFT JOIN pedidos pe
                ON pg.tipo_referencia = 'pedido' AND pg.referencia_id = pe.id AND pe.loja_id = ?
            LEFT JOIN agendamentos ag
                ON pg.tipo_referencia = 'agendamento' AND pg.referencia_id = ag.id AND ag.loja_id = ?
            WHERE pg.status IN ('aprovado', 'estornado')
              AND pg.updated_at >= ?
              AND pg.updated_at < ?
              AND (pe.id IS NOT NULL OR ag.id IS NOT NULL)
            ORDER BY pg.updated_at DESC
            LIMIT ${LIMITE_VENDAS}`,
            [lojaId, lojaId, inicio, fimExclusivo]
        )
    ]);

    return {
        resumo: resumo[0],
        vendasPorPeriodo,
        produtosMaisVendidos,
        vendas,
        agendamentos: {
            total: totalAgendamentos[0].total,
            porStatus: agendamentosPorStatus,
            servicosMaisAgendados
        }
    };
};

// ===============================
// PAINEL DO LOJISTA (home)
// ===============================

// Venda aprovada da loja, seja de pedido ou de agendamento. Parâmetros: lojaId, lojaId.
const VENDAS_APROVADAS_DA_LOJA = `
    FROM pagamentos pg
    LEFT JOIN pedidos pe
        ON pg.tipo_referencia = 'pedido' AND pg.referencia_id = pe.id AND pe.loja_id = ?
    LEFT JOIN agendamentos ag
        ON pg.tipo_referencia = 'agendamento' AND pg.referencia_id = ag.id AND ag.loja_id = ?
    WHERE pg.status = 'aprovado'
      AND (pe.id IS NOT NULL OR ag.id IS NOT NULL)`;

const STATUS_AGENDAMENTO_REALIZADO = "('confirmado', 'em_atendimento', 'concluido')";
const LIMITE_PROXIMOS_AGENDAMENTOS = 3;

/*
 * Números da home do lojista: período atual [inicio, fim) e o anterior
 * [inicioAnterior, inicio), de mesmo tamanho, para comparar.
 * agora e hoje estão no horário das lojas (os agendamentos são gravados assim).
 */
exports.obterPainelDaLoja = async (lojaId, { inicioAnterior, inicio, fim, agora, hoje }) => {
    const [vendasPorDia, agendamentos, novosClientes, proximosAgendamentos, pendencias] = await Promise.all([
        executar(
            `SELECT
                DATE_FORMAT(pg.updated_at, '%Y-%m-%d') AS data,
                COALESCE(SUM(pg.valor), 0) AS receita,
                COUNT(DISTINCT pe.id) AS pedidos
            ${VENDAS_APROVADAS_DA_LOJA}
              AND pg.updated_at >= ?
              AND pg.updated_at < ?
            GROUP BY data
            ORDER BY data ASC`,
            [lojaId, lojaId, inicioAnterior, fim]
        ),
        executar(
            `SELECT
                COALESCE(SUM(a.data_inicio >= ?), 0) AS atual,
                COALESCE(SUM(a.data_inicio < ?), 0) AS anterior
            FROM agendamentos a
            WHERE a.loja_id = ?
              AND a.status IN ${STATUS_AGENDAMENTO_REALIZADO}
              AND a.data_inicio >= ?
              AND a.data_inicio < ?`,
            [inicio, inicio, lojaId, inicioAnterior, fim]
        ),
        // Cliente novo: a primeira compra paga na loja caiu no período.
        executar(
            `SELECT
                COALESCE(SUM(primeira >= ?), 0) AS atual,
                COALESCE(SUM(primeira >= ? AND primeira < ?), 0) AS anterior
            FROM (
                SELECT cliente, MIN(data) AS primeira
                FROM (
                    SELECT pe.usuario_id AS cliente, pg.updated_at AS data
                    FROM pagamentos pg
                    INNER JOIN pedidos pe ON pg.tipo_referencia = 'pedido' AND pe.id = pg.referencia_id
                    WHERE pe.loja_id = ? AND pg.status = 'aprovado'
                    UNION ALL
                    SELECT ag.cliente_id AS cliente, pg.updated_at AS data
                    FROM pagamentos pg
                    INNER JOIN agendamentos ag ON pg.tipo_referencia = 'agendamento' AND ag.id = pg.referencia_id
                    WHERE ag.loja_id = ? AND pg.status = 'aprovado' AND ag.cliente_id IS NOT NULL
                ) compras
                GROUP BY cliente
            ) clientes
            WHERE primeira < ?`,
            [inicio, inicioAnterior, inicio, lojaId, lojaId, fim]
        ),
        executar(
            `SELECT
                a.id,
                DATE_FORMAT(a.data_inicio, '%Y-%m-%dT%H:%i:%s') AS data_inicio,
                s.nome AS servico,
                a.pet_nome,
                COALESCE(u.nome, a.cliente_nome_externo) AS cliente
            FROM agendamentos a
            INNER JOIN servicos s ON s.id = a.servico_id
            LEFT JOIN usuarios u ON u.id = a.cliente_id
            WHERE a.loja_id = ?
              AND a.status = 'confirmado'
              AND a.data_inicio >= ?
            ORDER BY a.data_inicio ASC
            LIMIT ${LIMITE_PROXIMOS_AGENDAMENTOS}`,
            [lojaId, agora]
        ),
        executar(
            `SELECT
                (SELECT COUNT(*) FROM pedidos WHERE loja_id = ? AND status = 'pago') AS pedidos_a_preparar,
                (SELECT COUNT(*) FROM agendamentos
                 WHERE loja_id = ? AND status = 'confirmado' AND DATE(data_inicio) = ?) AS agendamentos_hoje`,
            [lojaId, lojaId, hoje]
        )
    ]);

    return {
        vendasPorDia,
        agendamentos: agendamentos[0],
        novosClientes: novosClientes[0],
        proximosAgendamentos,
        pendencias: pendencias[0]
    };
};
