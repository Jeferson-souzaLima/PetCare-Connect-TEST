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

// =====================================================================
// LGPD: exportação e exclusão (anonimização) da própria conta
// =====================================================================
const { consultar } = require('../utils/transacao');

/** Todos os dados ligados ao usuário, para a exportação (portabilidade). */
exports.buscarDadosParaExportacao = async (id) => {
    const [usuario] = await consultar(
        `SELECT id, nome, email, telefone, tipo, cidade, uf, cep, logradouro, numero,
                complemento, bairro, latitude, longitude, data_criacao, email_verificado,
                termos_aceitos_em, termos_versao, privacidade_versao
         FROM usuarios WHERE id = ? LIMIT 1`,
        [id]
    );
    if (!usuario) return null;

    const [pets, favoritos, pedidos, itensPedidos, agendamentos, pagamentos, lojas] = await Promise.all([
        consultar('SELECT id, nome, especie, raca, idade, imagem, criado_em, atualizado_em FROM pets WHERE usuario_id = ?', [id]),
        consultar('SELECT tipo, referencia_id FROM favoritos WHERE usuario_id = ?', [id]),
        consultar('SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY id', [id]),
        consultar(
            `SELECT i.* FROM itenspedido i
             JOIN pedidos p ON p.id = i.pedido_id
             WHERE p.usuario_id = ? ORDER BY i.pedido_id, i.id`,
            [id]
        ),
        consultar(
            `SELECT a.*, s.nome AS servico_nome, l.nome_fantasia AS loja_nome
             FROM agendamentos a
             LEFT JOIN servicos s ON s.id = a.servico_id
             LEFT JOIN lojas l ON l.id = a.loja_id
             WHERE a.cliente_id = ? ORDER BY a.id`,
            [id]
        ),
        consultar(
            `SELECT id, tipo_referencia, referencia_id, gateway, status, valor, criado_em
             FROM pagamentos
             WHERE (tipo_referencia = 'pedido' AND referencia_id IN (SELECT id FROM pedidos WHERE usuario_id = ?))
                OR (tipo_referencia = 'agendamento' AND referencia_id IN (SELECT id FROM agendamentos WHERE cliente_id = ?))
             ORDER BY id`,
            [id, id]
        ),
        consultar('SELECT * FROM lojas WHERE usuario_id = ?', [id])
    ]);

    return { usuario, pets, favoritos, pedidos, itens_pedidos: itensPedidos, agendamentos, pagamentos, lojas };
};

exports.buscarCredenciais = async (id) => {
    const [usuario] = await consultar('SELECT id, tipo, senha_hash FROM usuarios WHERE id = ? LIMIT 1', [id]);
    return usuario || null;
};

const STATUS_PEDIDO_ENCERRADO = ['entregue', 'cancelado'];
const STATUS_AGENDAMENTO_ENCERRADO = ['concluido', 'cancelado_cliente', 'cancelado_loja'];

/** Pedidos e agendamentos ainda em andamento (a loja ainda precisa do contato). */
exports.contarPendencias = async (id) => {
    const [[pedidos], [agendamentos]] = await Promise.all([
        consultar('SELECT COUNT(*) AS total FROM pedidos WHERE usuario_id = ? AND status NOT IN (?)', [id, STATUS_PEDIDO_ENCERRADO]),
        consultar('SELECT COUNT(*) AS total FROM agendamentos WHERE cliente_id = ? AND status NOT IN (?)', [id, STATUS_AGENDAMENTO_ENCERRADO])
    ]);
    return { pedidos: Number(pedidos.total), agendamentos: Number(agendamentos.total) };
};

/*
 * Remove os dados pessoais e mantém pedidos e agendamentos sem identificação
 * (a loja precisa deles para fins fiscais e relatórios). Deve rodar dentro
 * de uma transação. Devolve as imagens dos pets, para apagar os arquivos.
 */
exports.anonimizarConta = async (id, senhaHashInutilizavel) => {
    const pets = await consultar('SELECT imagem FROM pets WHERE usuario_id = ?', [id]);

    await consultar('DELETE FROM favoritos WHERE usuario_id = ?', [id]);
    await consultar('DELETE FROM pets WHERE usuario_id = ?', [id]);
    await consultar(
        `UPDATE pedidos SET
            nome_contato = NULL, telefone_contato = NULL, cep_entrega = NULL,
            endereco_entrega = NULL, numero_entrega = NULL, complemento_entrega = NULL,
            bairro_entrega = NULL, observacao = NULL
         WHERE usuario_id = ?`,
        [id]
    );
    await consultar(
        `UPDATE agendamentos SET pet_nome = 'Pet removido', observacoes = NULL
         WHERE cliente_id = ?`,
        [id]
    );
    await consultar(
        `UPDATE usuarios SET
            nome = 'Conta excluída',
            email = CONCAT('excluido-', id, '@conta-removida.invalid'),
            senha_hash = ?,
            telefone = NULL, cidade = NULL, uf = NULL, cep = NULL, logradouro = NULL,
            numero = NULL, complemento = NULL, bairro = NULL, latitude = NULL, longitude = NULL,
            email_verificado = 0, email_verificacao_token_hash = NULL, email_verificacao_expira_em = NULL
         WHERE id = ?`,
        [senhaHashInutilizavel, id]
    );

    return pets.map((pet) => pet.imagem).filter(Boolean);
};
