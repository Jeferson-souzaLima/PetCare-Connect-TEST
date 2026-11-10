const db = require('../db');

const Pet = {

    criar: (dados, callback) => {
        const sql = `
            INSERT INTO pets (usuario_id, nome, especie, raca, idade, imagem)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        return db.query(sql, [
            dados.usuario_id,
            dados.nome,
            dados.especie,
            dados.raca || null,
            dados.idade || null,
            dados.imagem || null
        ], callback);
    },

    listarPorUsuario: (usuario_id, callback) => {
        const sql = 'SELECT * FROM pets WHERE usuario_id = ? ORDER BY id DESC';
        return db.query(sql, [usuario_id], callback);
    },

    // Só devolve o pet se ele for do usuário (null caso contrário).
    buscarDoUsuario: (id, usuario_id, callback) => {
        const sql = 'SELECT * FROM pets WHERE id = ? AND usuario_id = ? LIMIT 1';
        return db.query(sql, [id, usuario_id], (err, pets) => callback(err, pets?.[0] || null));
    },

    // ⭐ AGORA ATUALIZA APENAS OS CAMPOS ENVIADOS
    atualizar: (id, usuario_id, dados, callback) => {
        let campos = [];
        let valores = [];

        if (dados.nome !== undefined) {
            campos.push("nome = ?");
            valores.push(dados.nome);
        }

        if (dados.especie !== undefined) {
            campos.push("especie = ?");
            valores.push(dados.especie);
        }

        if (dados.raca !== undefined) {
            campos.push("raca = ?");
            valores.push(dados.raca);
        }

        if (dados.idade !== undefined) {
            campos.push("idade = ?");
            valores.push(dados.idade);
        }

        if (dados.imagem !== undefined) {
            campos.push("imagem = ?");
            valores.push(dados.imagem);
        }

        if (campos.length === 0) {
            return callback(null, { affectedRows: 0 }); // nada pra atualizar
        }

        const sql = `
            UPDATE pets
            SET ${campos.join(", ")}
            WHERE id = ?
            AND usuario_id = ?
        `;

        valores.push(id);
        valores.push(usuario_id);

        return db.query(sql, valores, callback);
    },


    deletar: (id, usuario_id, callback) => {
        const sql = 'DELETE FROM pets WHERE id = ? AND usuario_id = ?';
        return db.query(sql, [id, usuario_id], callback);
    }
};

module.exports = Pet;