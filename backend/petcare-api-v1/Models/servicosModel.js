const db = require('../db');
const {
    RAIO_PADRAO_KM,
    LIMITE_RESULTADOS
} = require('../Config/geolocalizacaoConfig');

exports.getAll = (callback) => {

    const sql = `
        SELECT
            s.id,
            s.loja_id,
            s.nome,
            s.descricao,
            s.preco,
            s.duracao_min,
            s.ativo,

            l.nome_fantasia AS loja_nome,
            l.imagem AS loja_imagem

        FROM servicos s
        INNER JOIN lojas l
            ON l.id = s.loja_id

        WHERE s.ativo = 1
        ORDER BY s.id DESC
    `;

    db.query(sql, callback);
};

exports.getPaginados = (page, limit, callback) => {
    const offset = (page - 1) * limit;

    db.query('SELECT COUNT(*) AS total FROM servicos s INNER JOIN lojas l ON l.id = s.loja_id WHERE s.ativo = 1 AND l.ativo = 1', (countErr, countResults) => {
        if (countErr) return callback(countErr);

        const total = Number(countResults[0].total);
        const sql = `
            SELECT s.id, s.loja_id, s.nome, s.descricao, s.preco, s.duracao_min, s.ativo,
                   l.nome_fantasia AS loja_nome, l.imagem AS loja_imagem
            FROM servicos s
            INNER JOIN lojas l ON l.id = s.loja_id
            WHERE s.ativo = 1 AND l.ativo = 1
            ORDER BY s.id DESC
            LIMIT ? OFFSET ?
        `;

        db.query(sql, [limit, offset], (err, results) => {
            if (err) return callback(err);
            callback(null, {
                dados: results,
                pagina: page,
                limite: limit,
                total,
                temMais: offset + results.length < total
            });
        });
    });
};

exports.getById = (id, callback) => {
    db.query('SELECT * FROM servicos WHERE id = ?', [id], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0]); // retorna s� 1 servi�o
    });
};

/** Serviço que um cliente pode agendar: de loja aprovada (ativa). */
exports.getAgendavel = (id, callback) => {
    db.query(
        'SELECT s.* FROM servicos s INNER JOIN lojas l ON l.id = s.loja_id AND l.ativo = 1 WHERE s.id = ?',
        [id],
        (err, results) => (err ? callback(err) : callback(null, results[0]))
    );
};

exports.getByLojaId = (lojaId, callback) => {
    db.query('SELECT * FROM servicos WHERE loja_id = ?', [lojaId], callback);
};

exports.create = (servico, callback) => {
    const { loja_id, nome, descricao, preco, duracao_min, ativo } = servico;
    const sql = `
        INSERT INTO servicos (loja_id, nome, descricao, preco, duracao_min, ativo)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [loja_id, nome, descricao, preco, duracao_min, ativo ?? true];
    db.query(sql, values, callback);
};

exports.update = (id, dados, callback) => {
    const { nome, descricao, preco, duracao_min, ativo } = dados;
    const sql = `
        UPDATE servicos
        SET nome = ?, descricao = ?, preco = ?, duracao_min = ?, ativo = ?
        WHERE id = ?
    `;
    const values = [nome, descricao, preco, duracao_min, ativo, id];
    db.query(sql, values, callback);
};

exports.delete = (id, callback) => {
    db.query('DELETE FROM servicos WHERE id = ?', [id], callback);
};

//
// ===============================
// VERIFICAR SE EXISTE POR ID
// ===============================
exports.existePorId = (id, callback) => {

    const sql = `
        SELECT id
        FROM servicos
        WHERE
            id = ?
            AND ativo = 1
        LIMIT 1
    `;

    db.query(
        sql,
        [id],
        callback
    );
};

exports.buscarServicos = (
    latitude,
    longitude,
    callback
) => {

    const sql = `

    SELECT

        s.id,
        s.loja_id,
        s.nome,
        s.descricao,
        s.preco,
        s.duracao_min,
        s.ativo,

        l.nome_fantasia AS loja_nome,
        l.imagem AS loja_imagem,

        (

            6371 *
            ACOS(

                COS(RADIANS(?))
                *
                COS(RADIANS(l.latitude))
                *
                COS(
                    RADIANS(l.longitude)
                    -
                    RADIANS(?)
                )
                +
                SIN(RADIANS(?))
                *
                SIN(RADIANS(l.latitude))

            )

        ) AS distancia

    FROM servicos s

    INNER JOIN lojas l
        ON l.id = s.loja_id

    WHERE

        s.ativo = 1

        AND l.ativo = 1

        AND l.latitude IS NOT NULL

        AND l.longitude IS NOT NULL

    HAVING distancia <= ?

    ORDER BY

        distancia ASC,

        s.id DESC

    LIMIT ?

`;

    db.query(

    sql,

    [

        latitude,
        longitude,
        latitude,

        RAIO_PADRAO_KM,
        LIMITE_RESULTADOS

    ],

    callback

);

};
