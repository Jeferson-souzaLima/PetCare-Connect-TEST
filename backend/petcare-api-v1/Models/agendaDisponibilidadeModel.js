const db = require('../db');

const AgendaDisponibilidade = {

    getByLojaEDia: (loja_id, dia_semana, callback) => {
        const sql = `
            SELECT * 
            FROM agenda_disponibilidade
            WHERE loja_id = ?
            AND dia_semana = ?
        `;

        db.query(sql, [loja_id, dia_semana], callback);
    },

    getByLojaEDiaPromise: (loja_id, dia_semana) => {

        return new Promise((resolve, reject) => {

            const sql = `
            SELECT *
            FROM agenda_disponibilidade
            WHERE loja_id = ?
            AND dia_semana = ?
        `;

            db.query(sql, [loja_id, dia_semana], (err, results) => {

                if (err) {
                    return reject(err);
                }

                resolve(results);

            });

        });

    },

    getByLoja: (loja_id, callback) => {
        const sql = `
            SELECT *
            FROM agenda_disponibilidade
            WHERE loja_id = ?
            ORDER BY dia_semana, hora_inicio
        `;

        db.query(sql, [loja_id], callback);
    },

    create: (data, callback) => {
        const sql = `
            INSERT INTO agenda_disponibilidade
            (
                loja_id,
                dia_semana,
                hora_inicio,
                hora_fim,
                intervalo_inicio,
                intervalo_fim
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [

            data.loja_id,
            data.dia_semana,

            data.hora_inicio,
            data.hora_fim,

            data.intervalo_inicio ?? null,
            data.intervalo_fim ?? null

        ], callback);
    },

    // Sempre filtra pela loja: um lojista só apaga registros da própria loja.
    delete: (id, loja_id, callback) => {
        const sql = `
            DELETE FROM agenda_disponibilidade
            WHERE id = ? AND loja_id = ?
        `;

        db.query(sql, [id, loja_id], callback);
    },

    deleteByLoja: (loja_id, callback) => {
        const sql = `
        DELETE FROM agenda_disponibilidade
        WHERE loja_id = ?
    `;

        db.query(sql, [loja_id], callback);
    }

};

module.exports = AgendaDisponibilidade;