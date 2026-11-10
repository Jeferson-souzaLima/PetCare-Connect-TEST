const db = require('../db');
const historicoStatusModel = require('./historicoStatusModel');

// Buscar todos os pedidos
exports.getAll = (callback) => {
    db.query('SELECT * FROM pedidos', callback);
};

// Atualizar o status do pedido
exports.updateStatus = (id, status, callback) => {
    const query = `
        UPDATE pedidos
        SET status = ?
        WHERE id = ?
    `;

    db.query(query, [status, id], (err, result) => {
        if (err) {
            return callback(err);
        }

        if (result.affectedRows === 0) {
            return callback(new Error('Pedido não encontrado.'));
        }

        historicoStatusModel.registrarStatus(
            {
                tipo: 'pedido',
                referencia_id: id,
                status
            },
            (err) => {
                if (err) {
                    return callback(err);
                }

                callback(null, result);
            }
        );
    });
};

// Deletar um pedido
exports.delete = (id, callback) => {
    const query = `
        DELETE FROM pedidos
        WHERE id = ?
    `;

    db.query(query, [id], callback);
};

// Buscar pedidos com base em filtros
exports.getByFilters = (query, values, callback) => {
    db.query(query, values, callback);
};

// Verificar se já existe pedido pendente de usuário para a loja
exports.getCarrinhoPendente = (usuario_id, loja_id, callback) => {
    const query = `
        SELECT *
        FROM pedidos
        WHERE usuario_id = ?
          AND loja_id = ?
          AND status = 'pendente'
        LIMIT 1
    `;

    db.query(query, [usuario_id, loja_id], callback);
};

// Ver carrinho atual
exports.getCarrinhoCompleto = (pedido_id, callback) => {
    const query = `
        SELECT
            p.*,
            i.*
        FROM pedidos p
        JOIN itenspedido i ON i.pedido_id = p.id
        WHERE p.id = ?
    `;

    db.query(query, [pedido_id], callback);
};

exports.getByIdSimples = (id, callback) => {
    const sql = `
        SELECT
            id,
            usuario_id,
            loja_id,
            total,
            status
        FROM pedidos
        WHERE id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) return callback(err);

        callback(null, results[0]);
    });
};

exports.confirmarPagamento = (id, callback) => {
    db.query("UPDATE pedidos SET status = 'pago', reserva_expira_em = NULL WHERE id = ? AND status = 'aguardando_pagamento' AND reserva_expira_em >= NOW()", [id], callback);
};

exports.cancelarReservasExpiradas = (callback) => {
    db.query("SELECT id FROM pedidos WHERE status = 'aguardando_pagamento' AND reserva_expira_em < NOW()", (erro, pedidos) => {
        if (erro) return callback(erro);
        let pendentes = pedidos.length;
        if (!pendentes) return callback(null, 0);
        let concluidos = 0;
        pedidos.forEach(pedido => exports.cancelarReservaExpirada(pedido.id, (err, cancelado) => {
            if (!err && cancelado) concluidos++;
            if (--pendentes === 0) callback(null, concluidos);
        }));
    });
};

exports.cancelarReservaExpirada = (id, callback) => {
    db.beginTransaction((erro) => {
        if (erro) return callback(erro);
        db.query("SELECT id FROM pedidos WHERE id = ? AND status = 'aguardando_pagamento' AND reserva_expira_em < NOW() FOR UPDATE", [id], (err, pedidos) => {
            if (err || !pedidos.length) return db.rollback(() => callback(err, false));
            db.query('SELECT item_id, quantidade FROM itenspedido WHERE pedido_id = ? AND tipo = \'produto\'', [id], (itensErr, itens) => {
                if (itensErr) return db.rollback(() => callback(itensErr));
                const devolver = itens.reduce((promessa, item) => promessa.then(() => new Promise((resolve, reject) => db.query('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [item.quantidade, item.item_id], erroAtualizacao => erroAtualizacao ? reject(erroAtualizacao) : resolve()))), Promise.resolve());
                devolver.then(() => {
                    db.query("UPDATE pedidos SET status = 'cancelado', cancelado_em = NOW() WHERE id = ?", [id], updateErr => {
                        if (updateErr) return db.rollback(() => callback(updateErr));
                        db.query("INSERT INTO historico_status (tipo, referencia_id, status) VALUES ('pedido', ?, 'cancelado')", [id], historicoErr => {
                            if (historicoErr) return db.rollback(() => callback(historicoErr));
                            db.commit(commitErr => commitErr ? db.rollback(() => callback(commitErr)) : callback(null, true));
                        });
                    });
                }).catch(falha => db.rollback(() => callback(falha)));
            });
        });
    });
};

exports.cancelarReserva = (id, callback) => {
    db.beginTransaction((erro) => {
        if (erro) return callback(erro);
        db.query("SELECT id FROM pedidos WHERE id = ? AND status = 'aguardando_pagamento' FOR UPDATE", [id], (err, pedidos) => {
            if (err || !pedidos.length) return db.rollback(() => callback(err, false));
            db.query("SELECT item_id, quantidade FROM itenspedido WHERE pedido_id = ? AND tipo = 'produto'", [id], (itensErr, itens) => {
                if (itensErr) return db.rollback(() => callback(itensErr));
                const devolver = itens.reduce((promessa, item) => promessa.then(() => new Promise((resolve, reject) => db.query('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [item.quantidade, item.item_id], atualizacaoErr => atualizacaoErr ? reject(atualizacaoErr) : resolve()))), Promise.resolve());
                devolver.then(() => {
                    db.query("UPDATE pedidos SET status = 'cancelado', cancelado_em = NOW() WHERE id = ?", [id], updateErr => {
                        if (updateErr) return db.rollback(() => callback(updateErr));
                        db.query("INSERT INTO historico_status (tipo, referencia_id, status) VALUES ('pedido', ?, 'cancelado')", [id], historicoErr => {
                            if (historicoErr) return db.rollback(() => callback(historicoErr));
                            db.commit(commitErr => commitErr ? db.rollback(() => callback(commitErr)) : callback(null, true));
                        });
                    });
                }).catch(falha => db.rollback(() => callback(falha)));
            });
        });
    });
};

exports.getMeusPedidosCompletos = (usuario_id, callback) => {
    const query = `
        SELECT
            p.id,
            p.loja_id,
            l.nome_fantasia AS nome_loja,
            p.data_pedido,
            p.status,
            p.subtotal,
            p.valor_entrega,
            p.total,
            p.modalidade_entrega,
            i.id AS item_id,
            i.tipo,
            i.item_id AS produto_id,
            i.nome_item,
            i.preco_unitario,
            i.quantidade
        FROM pedidos p
        INNER JOIN lojas l
            ON l.id = p.loja_id
        INNER JOIN itenspedido i
            ON i.pedido_id = p.id
        WHERE p.usuario_id = ?
        ORDER BY p.data_pedido DESC, p.id DESC
    `;

    db.query(query, [usuario_id], callback);
};

// Buscar pedidos completos da loja, incluindo os itens
exports.getPedidosLojaCompletos = (loja_id, callback) => {
    const query = `
        SELECT
            p.id,
            p.usuario_id,
            p.loja_id,
            p.data_pedido,
            p.status,
            p.subtotal,
            p.valor_entrega,
            p.total,
            p.modalidade_entrega,

            p.nome_contato,
            p.telefone_contato,

            p.cep_entrega,
            p.endereco_entrega,
            p.numero_entrega,
            p.complemento_entrega,
            p.bairro_entrega,
            p.cidade_entrega,
            p.uf_entrega,

            p.observacao,
            p.reserva_expira_em,
            p.cancelado_em,

            i.id AS item_id,
            i.tipo AS item_tipo,
            i.item_id AS produto_id,
            i.nome_item,
            i.preco_unitario,
            i.quantidade

        FROM pedidos p

        INNER JOIN itenspedido i
            ON i.pedido_id = p.id

        WHERE p.loja_id = ?

        ORDER BY p.data_pedido DESC, p.id DESC
    `;

    db.query(query, [loja_id], callback);
};