const db = require('../db');
const { consultar } = require('../utils/transacao');

const PagamentosModel = {

    /*
     * Cancela as tentativas pendentes anteriores e cria a nova, já com a
     * comissão calculada. Usar dentro de uma transação.
     */
    substituirPendentes: async ({ tipoReferencia, referenciaId, valor, comissao }) => {

        await consultar(
            `UPDATE pagamentos
             SET status = 'cancelado'
             WHERE tipo_referencia = ? AND referencia_id = ? AND status = 'pendente'`,
            [tipoReferencia, referenciaId]
        );

        const resultado = await consultar(
            `INSERT INTO pagamentos (
                tipo_referencia, referencia_id, gateway, status, valor,
                comissao_percentual, valor_comissao
            )
            VALUES (?, ?, 'mercado_pago', 'pendente', ?, ?, ?)`,
            [tipoReferencia, referenciaId, valor, comissao.percentual, comissao.valor]
        );

        return resultado.insertId;
    },

    updatePreferenceId: (id, preferenceId) => consultar(
        'UPDATE pagamentos SET gateway_preference_id = ? WHERE id = ?',
        [preferenceId, id]
    ),

    updateTarifaGateway: (id, tarifa) => consultar(
        'UPDATE pagamentos SET tarifa_gateway = ? WHERE id = ?',
        [tarifa, id]
    ),

    /** Pagamento com a loja da venda (pedido ou agendamento). */
    getComLoja: async (id) => {
        const linhas = await consultar(
            `SELECT p.*, COALESCE(pe.loja_id, ag.loja_id) AS loja_id
             FROM pagamentos p
             LEFT JOIN pedidos pe
                ON p.tipo_referencia = 'pedido' AND pe.id = p.referencia_id
             LEFT JOIN agendamentos ag
                ON p.tipo_referencia = 'agendamento' AND ag.id = p.referencia_id
             WHERE p.id = ?
             LIMIT 1`,
            [id]
        );

        return linhas[0] || null;
    },

    getById: (id, callback) => {

        const sql = `
            SELECT *
            FROM pagamentos
            WHERE id = ?
        `;

        db.query(sql, [id], (err, results) => {

            if (err) return callback(err);

            callback(null, results[0] || null);

        });
    },

    getByReferencia: (tipo_referencia, referencia_id, callback) => {

        const sql = `
            SELECT *
            FROM pagamentos
            WHERE tipo_referencia = ?
            AND referencia_id = ?
            ORDER BY id DESC
        `;

        db.query(
            sql,
            [tipo_referencia, referencia_id],
            callback
        );
    },

    getByGatewayPaymentId: (gateway_payment_id, callback) => {

        const sql = `
            SELECT *
            FROM pagamentos
            WHERE gateway_payment_id = ?
            LIMIT 1
        `;

        db.query(
            sql,
            [gateway_payment_id],
            (err, results) => {

                if (err) return callback(err);

                callback(null, results[0] || null);

            }
        );
    },

    // Estornado (por nós ou pelo próprio Mercado Pago) deixa de ter estorno pendente.
    updateStatus: (id, status, callback) => {

        const sql = `
            UPDATE pagamentos
            SET status = ?,
                estorno_pendente_desde = CASE WHEN ? = 'estornado' THEN NULL ELSE estorno_pendente_desde END
            WHERE id = ?
        `;

        db.query(sql, [status, status, id], callback);
    },

    /*
     * Estorno recusado pelo Mercado Pago. "obrigatorio": a venda já não existe
     * e o dinheiro precisa voltar ao cliente; fica pendente para nova tentativa.
     */
    registrarFalhaEstorno: (id, erro, obrigatorio) => consultar(
        `UPDATE pagamentos
         SET estorno_ultima_falha_em = NOW(),
             estorno_ultimo_erro = ?,
             estorno_pendente_desde = CASE WHEN ? THEN COALESCE(estorno_pendente_desde, NOW()) ELSE estorno_pendente_desde END
         WHERE id = ?`,
        [String(erro).slice(0, 255), obrigatorio ? 1 : 0, id]
    ),

    idsComEstornoPendente: (limite) => consultar(
        `SELECT id FROM pagamentos
         WHERE status = 'aprovado' AND estorno_pendente_desde IS NOT NULL
         ORDER BY estorno_pendente_desde ASC
         LIMIT ?`,
        [limite]
    ),

    /** Painel do admin: estornos pendentes e estornos recusados nos últimos 7 dias. */
    listarEstornosComFalha: () => consultar(
        `SELECT p.id, p.tipo_referencia, p.referencia_id, p.valor,
                p.estorno_pendente_desde, p.estorno_ultima_falha_em, p.estorno_ultimo_erro,
                l.id AS loja_id, l.nome_fantasia AS loja
         FROM pagamentos p
         LEFT JOIN pedidos pe ON p.tipo_referencia = 'pedido' AND pe.id = p.referencia_id
         LEFT JOIN agendamentos ag ON p.tipo_referencia = 'agendamento' AND ag.id = p.referencia_id
         LEFT JOIN lojas l ON l.id = COALESCE(pe.loja_id, ag.loja_id)
         WHERE p.status = 'aprovado'
           AND (p.estorno_pendente_desde IS NOT NULL OR p.estorno_ultima_falha_em >= NOW() - INTERVAL 7 DAY)
         ORDER BY p.estorno_pendente_desde IS NULL, p.estorno_ultima_falha_em DESC
         LIMIT 100`
    ),

    /** Quem avisar quando um estorno falha: os administradores e o dono da loja. */
    contatosDoAlertaDeEstorno: async (lojaId) => {
        const [admins, lojas] = await Promise.all([
            consultar("SELECT email FROM usuarios WHERE tipo = 'admin'"),
            consultar(
                `SELECT l.nome_fantasia, u.email
                 FROM lojas l INNER JOIN usuarios u ON u.id = l.usuario_id
                 WHERE l.id = ?`,
                [lojaId]
            )
        ]);
        return { admins: admins.map(({ email }) => email), loja: lojas[0] || null };
    },

    updateGatewayPaymentId: (
        id,
        gateway_payment_id,
        callback
    ) => {

        const sql = `
            UPDATE pagamentos
            SET gateway_payment_id = ?
            WHERE id = ?
        `;

        db.query(
            sql,
            [gateway_payment_id, id],
            callback
        );
    }

};

module.exports = PagamentosModel;
