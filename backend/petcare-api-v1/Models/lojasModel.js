const db = require('../db');

/*
 * Campos que qualquer visitante pode ver. Ficam de fora usuario_id, CNPJ,
 * razão social, telefone, coordenadas e o status interno (ativo).
 */
const CAMPOS_PUBLICOS = `
    id, nome_fantasia, descricao, imagem, endereco, cep, cidade, uf,
    entrega_ativa, taxa_entrega_fixa, taxa_entrega_por_km, raio_entrega_km
`;

exports.getPublicaPorId = (id, callback) => {
    db.query(`SELECT ${CAMPOS_PUBLICOS} FROM lojas WHERE id = ? LIMIT 1`, [id], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0] || null);
    });
};

// filtros (opcional): { soComEntrega: boolean, termo: { sql, valores } }
exports.getPaginados = (page, limit, filtros, callback) => {

    if (typeof filtros === 'function') {
        callback = filtros;
        filtros = {};
    }

    const offset = (page - 1) * limit;
    const termo = filtros.termo ?? { sql: '', valores: [] };
    const condicoes = `ativo = 1${filtros.soComEntrega ? ' AND entrega_ativa = 1' : ''}${termo.sql}`;

    const queryTotal = `
        SELECT COUNT(*) AS total
        FROM lojas
        WHERE ${condicoes}
    `;

    db.query(queryTotal, termo.valores, (err, totalResults) => {

        if (err) {
            return callback(err);
        }

        const total = Number(totalResults[0].total);

        const queryLojas = `
            SELECT ${CAMPOS_PUBLICOS}
            FROM lojas
            WHERE ${condicoes}
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `;

        db.query(
            queryLojas,
            [...termo.valores, limit, offset],
            (err, results) => {

                if (err) {
                    return callback(err);
                }

                const temMais =
                    offset + results.length < total;

                callback(null, {
                    dados: results,
                    pagina: page,
                    limite: limit,
                    total,
                    temMais
                });
            }
        );
    });
};

exports.update = (id, dados, callback) => {
    const { nome_fantasia, cnpj, descricao, cidade, uf, endereco, ativo, imagem } = dados;
    const sql = `
        UPDATE lojas
        SET nome_fantasia = ?, cnpj = ?, descricao = ?, cidade = ?, uf = ?, endereco = ?, ativo = ?, imagem = ?
        WHERE id = ?
    `;
    db.query(sql, [nome_fantasia, cnpj, descricao, cidade, uf, endereco, ativo, imagem, id], callback);
};

exports.delete = (id, callback) => {
    db.query('DELETE FROM lojas WHERE id = ?', [id], callback);
};

//
// ===============================
// VERIFICAR SE EXISTE POR ID
// ===============================
exports.existePorId = (id, callback) => {
    const sql = `
        SELECT id
        FROM lojas
        WHERE id = ?
        LIMIT 1
    `;
    db.query(sql, [id], callback);
};
