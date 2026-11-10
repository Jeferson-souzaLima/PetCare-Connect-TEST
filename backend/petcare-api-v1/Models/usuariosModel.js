const db = require('../db');

exports.getById = (id, callback) => {
    const sql = `
        SELECT
            id,
            nome,
            email,
            telefone,
            cidade,
            uf,
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            latitude,
            longitude,
            tipo
        FROM usuarios
        WHERE id = ?
        LIMIT 1
    `;

    db.query(sql, [id], (err, results) => {
        if (err) return callback(err);

        callback(null, results[0] || null);
    });
};

exports.updatePerfil = (id, dados, callback) => {
    const {
        nome,
        telefone,
        cidade,
        uf,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        latitude,
        longitude
    } = dados;

    const sql = `
        UPDATE usuarios
        SET
            nome = ?,
            telefone = ?,
            cidade = ?,
            uf = ?,
            cep = ?,
            logradouro = ?,
            numero = ?,
            complemento = ?,
            bairro = ?,
            latitude = ?,
            longitude = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            nome,
            telefone,
            cidade,
            uf,
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            latitude,
            longitude,
            id
        ],
        callback
    );
};