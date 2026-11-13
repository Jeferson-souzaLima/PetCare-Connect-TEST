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

    updateStatus: (id, status, callback) => {

        const sql = `
            UPDATE pagamentos
            SET status = ?
            WHERE id = ?
        `;

        db.query(sql, [status, id], callback);
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
