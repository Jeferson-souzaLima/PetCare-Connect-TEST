const db = require('../db');

/*
 * Quem pode ver um pedido, agendamento ou pagamento:
 * - admin;
 * - o cliente dono do registro;
 * - o lojista da loja do registro (loja buscada no banco pelo usuário,
 *   no mesmo padrão de agendamentosController.atualizarStatus).
 *
 * Quem não pode recebe 404, para não revelar que o registro existe.
 */

function podeAcessar(usuario, { donoId, lojaId }, callback) {
    if (!usuario) return callback(null, false);
    if (usuario.tipo === 'admin') return callback(null, true);
    if (donoId != null && Number(donoId) === Number(usuario.id)) return callback(null, true);
    if (usuario.tipo !== 'lojista' || lojaId == null) return callback(null, false);

    db.query('SELECT id FROM lojas WHERE usuario_id = ?', [usuario.id], (err, lojas) => {
        if (err) return callback(err);
        callback(null, lojas.some((loja) => Number(loja.id) === Number(lojaId)));
    });
}

const CONSULTAS_DONO = {
    pedido: 'SELECT usuario_id AS dono_id, loja_id FROM pedidos WHERE id = ? LIMIT 1',
    agendamento: 'SELECT cliente_id AS dono_id, loja_id FROM agendamentos WHERE id = ? LIMIT 1'
};

/** callback(err, existeEPodeAcessar) para um pedido ou agendamento pelo id. */
function podeAcessarReferencia(usuario, tipo, id, callback) {
    const sql = CONSULTAS_DONO[tipo];
    if (!sql) return callback(null, false);

    db.query(sql, [id], (err, linhas) => {
        if (err) return callback(err);
        if (!linhas.length) return callback(null, false);
        podeAcessar(usuario, { donoId: linhas[0].dono_id, lojaId: linhas[0].loja_id }, callback);
    });
}

module.exports = { podeAcessar, podeAcessarReferencia };
