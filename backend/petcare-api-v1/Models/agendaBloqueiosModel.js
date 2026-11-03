const db = require('../db');

const AgendaBloqueios = {

    existeBloqueio: (loja_id, inicio, fim, callback) => {

        const sql = `
            SELECT COUNT(*) as total
            FROM agenda_bloqueios
            WHERE loja_id = ?
            AND (
                (data_inicio <= ? AND data_fim > ?) OR
                (data_inicio < ? AND data_fim >= ?) OR
                (data_inicio >= ? AND data_fim <= ?)
            )
        `;

        db.query(sql, [
            loja_id,
            inicio, inicio,
            fim, fim,
            inicio, fim
        ], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0].total > 0);
        });
    },

    getByLoja: (loja_id, callback) => {
        const sql = `
            SELECT *
            FROM agenda_bloqueios
            WHERE loja_id = ?
            ORDER BY data_inicio
        `;

        db.query(sql, [loja_id], callback);
    },

    getByDataPromise: (loja_id, data) => {

        return new Promise((resolve, reject) => {

            const sql = `
            SELECT *
            FROM agenda_bloqueios
            WHERE loja_id = ?
            AND DATE(data_inicio) = ?
        `;

            db.query(sql, [loja_id, data], (err, results) => {

                if (err) {
                    return reject(err);
                }

                resolve(results);

            });

        });

    },

    create: (data, callback) => {
        const sql = `
            INSERT INTO agenda_bloqueios
            (loja_id, data_inicio, data_fim, motivo)
            VALUES (?, ?, ?, ?)
        `;

        db.query(sql, [
            data.loja_id,
            data.data_inicio,
            data.data_fim,
            data.motivo
        ], callback);
    },

    // Sempre filtra pela loja: um lojista só apaga registros da própria loja.
    delete: (id, loja_id, callback) => {
        const sql = `
            DELETE FROM agenda_bloqueios
            WHERE id = ? AND loja_id = ?
        `;

        db.query(sql, [id, loja_id], callback);
    }

};

module.exports = AgendaBloqueios;