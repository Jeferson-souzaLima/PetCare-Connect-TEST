const { consultar } = require('../utils/transacao');

/*
 * Conta Mercado Pago conectada de cada loja (tokens OAuth cifrados).
 * Os tokens nunca devem sair do backend: use getStatus para respostas da API.
 */

exports.getByLojaId = async (lojaId) => {
    const linhas = await consultar(
        `SELECT loja_id, mp_user_id, access_token_cifrado, refresh_token_cifrado, token_expira_em
         FROM lojas_mercadopago
         WHERE loja_id = ?
         LIMIT 1`,
        [lojaId]
    );

    return linhas[0] || null;
};

exports.getByMpUserId = async (mpUserId) => {
    const linhas = await consultar(
        'SELECT loja_id FROM lojas_mercadopago WHERE mp_user_id = ? LIMIT 1',
        [mpUserId]
    );

    return linhas[0] || null;
};

exports.getStatus = async (lojaId) => {
    const linhas = await consultar(
        `SELECT token_expira_em, created_at AS conectado_em
         FROM lojas_mercadopago
         WHERE loja_id = ?
         LIMIT 1`,
        [lojaId]
    );

    return linhas[0] || null;
};

exports.salvar = (lojaId, dados) => consultar(
    `INSERT INTO lojas_mercadopago
        (loja_id, mp_user_id, access_token_cifrado, refresh_token_cifrado, token_expira_em)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
        mp_user_id = VALUES(mp_user_id),
        access_token_cifrado = VALUES(access_token_cifrado),
        refresh_token_cifrado = VALUES(refresh_token_cifrado),
        token_expira_em = VALUES(token_expira_em)`,
    [
        lojaId,
        dados.mp_user_id,
        dados.access_token_cifrado,
        dados.refresh_token_cifrado,
        dados.token_expira_em
    ]
);

exports.remover = (lojaId) => consultar(
    'DELETE FROM lojas_mercadopago WHERE loja_id = ?',
    [lojaId]
);

/** Confirma que a loja existe e pertence ao usuário (ownership). */
exports.lojaPertenceAoUsuario = async (lojaId, usuarioId) => {
    const linhas = await consultar(
        'SELECT id FROM lojas WHERE id = ? AND usuario_id = ? LIMIT 1',
        [lojaId, usuarioId]
    );

    return linhas.length > 0;
};
