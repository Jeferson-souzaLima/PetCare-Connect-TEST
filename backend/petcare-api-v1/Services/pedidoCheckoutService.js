const db = require('../db');

const executar = (sql, valores = []) => new Promise((resolve, reject) => {
    db.query(sql, valores, (erro, resultado) =>
        erro ? reject(erro) : resolve(resultado)
    );
});

const iniciarTransacao = () => new Promise((resolve, reject) => {
    db.beginTransaction(erro =>
        erro ? reject(erro) : resolve()
    );
});

const finalizar = () => new Promise((resolve, reject) => {
    db.commit(erro =>
        erro ? reject(erro) : resolve()
    );
});

const desfazer = () => new Promise(resolve =>
    db.rollback(resolve)
);

function distanciaKm(origemLat, origemLng, destinoLat, destinoLng) {
    const radianos = graus => graus * Math.PI / 180;
    const raioTerra = 6371;

    const dLat = radianos(destinoLat - origemLat);
    const dLng = radianos(destinoLng - origemLng);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(radianos(origemLat)) *
        Math.cos(radianos(destinoLat)) *
        Math.sin(dLng / 2) ** 2;

    return raioTerra *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );
}

async function calcularFrete({ lojaId, latitude, longitude }) {

    if (!Number.isInteger(Number(lojaId))) {
        const erro = new Error('Loja inválida.');
        erro.status = 400;
        throw erro;
    }

    if (
        !Number.isFinite(Number(latitude)) ||
        !Number.isFinite(Number(longitude))
    ) {
        const erro = new Error(
            'Localização do endereço inválida.'
        );
        erro.status = 400;
        throw erro;
    }

    const lojas = await executar(
        'SELECT * FROM lojas WHERE id = ? AND ativo = 1',
        [lojaId]
    );

    if (!lojas.length) {
        const erro = new Error('Loja indisponível.');
        erro.status = 404;
        throw erro;
    }

    const loja = lojas[0];

    if (
        !loja.entrega_ativa ||
        loja.latitude == null ||
        loja.longitude == null
    ) {
        const erro = new Error(
            'Esta loja não possui entrega disponível.'
        );
        erro.status = 400;
        throw erro;
    }

    const km = distanciaKm(
        Number(loja.latitude),
        Number(loja.longitude),
        Number(latitude),
        Number(longitude)
    );


    if (km > Number(loja.raio_entrega_km)) {
        const erro = new Error(
            'O endereço está fora do raio de entrega da loja.'
        );
        erro.status = 400;
        throw erro;
    }

    const frete =
        Number(loja.taxa_entrega_fixa) +
        km * Number(loja.taxa_entrega_por_km);

    return {
        disponivel: true,
        distancia_km: Number(km.toFixed(2)),
        frete: Number(frete.toFixed(2))
    };
}

async function criarPedidoReservado({ usuarioId, dados }) {

    const {
        loja_id: lojaId,
        itens,
        modalidade_entrega: modalidade,
        contato,
        endereco,
        observacao
    } = dados;

    if (
        !Number.isInteger(Number(lojaId)) ||
        !Array.isArray(itens) ||
        !itens.length
    ) {
        const erro = new Error(
            'Informe uma loja e ao menos um produto.'
        );
        erro.status = 400;
        throw erro;
    }

    if (!['retirada', 'entrega'].includes(modalidade)) {
        const erro = new Error(
            'Modalidade de entrega inválida.'
        );
        erro.status = 400;
        throw erro;
    }

    if (
        !contato?.nome?.trim() ||
        !contato?.telefone?.trim()
    ) {
        const erro = new Error(
            'Nome e telefone de contato são obrigatórios.'
        );
        erro.status = 400;
        throw erro;
    }

    if (
        modalidade === 'entrega' &&
        !endereco?.cep
            ?.replace(/\D/g, '')
            ?.match(/^\d{8}$/)
    ) {
        const erro = new Error(
            'Informe um CEP de entrega válido.'
        );
        erro.status = 400;
        throw erro;
    }

    await iniciarTransacao();

    try {

        const lojas = await executar(
            'SELECT * FROM lojas WHERE id = ? AND ativo = 1 FOR UPDATE',
            [lojaId]
        );

        if (!lojas.length) {
            const erro = new Error('Loja indisponível.');
            erro.status = 404;
            throw erro;
        }

        const loja = lojas[0];

        const ids = itens.map(item =>
            Number(item.produto_id)
        );

        if (
            ids.some(id => !Number.isInteger(id)) ||
            new Set(ids).size !== ids.length
        ) {
            const erro = new Error('Itens inválidos.');
            erro.status = 400;
            throw erro;
        }

        const placeholders = ids
            .map(() => '?')
            .join(',');

        const produtos = await executar(
            `SELECT id, nome, preco, estoque
             FROM produtos
             WHERE loja_id = ?
             AND ativo = 1
             AND id IN (${placeholders})
             FOR UPDATE`,
            [lojaId, ...ids]
        );

        if (produtos.length !== ids.length) {
            const erro = new Error(
                'Um ou mais produtos não estão disponíveis.'
            );
            erro.status = 400;
            throw erro;
        }

        let subtotal = 0;

        const itensConfirmados = itens.map(item => {

            const quantidade =
                Number(item.quantidade);

            const produto = produtos.find(
                p => p.id === Number(item.produto_id)
            );

            if (
                !Number.isInteger(quantidade) ||
                quantidade < 1 ||
                quantidade > 99 ||
                produto.estoque < quantidade
            ) {
                const erro = new Error(
                    `Estoque insuficiente para ${
                        produto?.nome || 'o produto'
                    }.`
                );

                erro.status = 409;
                throw erro;
            }

            subtotal +=
                Number(produto.preco) *
                quantidade;

            return {
                produto,
                quantidade
            };
        });

        let frete = 0;

        if (modalidade === 'entrega') {

            const resultadoFrete =
                await calcularFrete({
                    lojaId,
                    latitude: endereco.latitude,
                    longitude: endereco.longitude
                });

            frete = resultadoFrete.frete;
        }

        const total = Number(
            (subtotal + frete).toFixed(2)
        );

        const resultado = await executar(
            `INSERT INTO pedidos (
                usuario_id,
                loja_id,
                subtotal,
                valor_entrega,
                total,
                status,
                modalidade_entrega,
                nome_contato,
                telefone_contato,
                cep_entrega,
                endereco_entrega,
                numero_entrega,
                complemento_entrega,
                bairro_entrega,
                cidade_entrega,
                uf_entrega,
                observacao,
                reserva_expira_em
            )
            VALUES (
                ?, ?, ?, ?, ?,
                'aguardando_pagamento',
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                DATE_ADD(NOW(), INTERVAL 10 MINUTE)
            )`,
            [
                usuarioId,
                lojaId,
                subtotal,
                frete,
                total,
                modalidade,
                contato.nome.trim(),
                contato.telefone.trim(),
                endereco?.cep || null,
                endereco?.logradouro || null,
                endereco?.numero || null,
                endereco?.complemento || null,
                endereco?.bairro || null,
                endereco?.cidade || null,
                endereco?.uf?.toUpperCase() || null,
                observacao?.trim() || null
            ]
        );

        const pedidoId = resultado.insertId;

        await executar(
            `INSERT INTO itenspedido (
                pedido_id,
                tipo,
                item_id,
                nome_item,
                preco_unitario,
                quantidade
            )
            VALUES ?`,
            [
                itensConfirmados.map(
                    ({ produto, quantidade }) => [
                        pedidoId,
                        'produto',
                        produto.id,
                        produto.nome,
                        produto.preco,
                        quantidade
                    ]
                )
            ]
        );

        for (const {
            produto,
            quantidade
        } of itensConfirmados) {

            await executar(
                `UPDATE produtos
                 SET estoque = estoque - ?
                 WHERE id = ?
                 AND estoque >= ?`,
                [
                    quantidade,
                    produto.id,
                    quantidade
                ]
            );
        }

        await executar(
            `INSERT INTO historico_status (
                tipo,
                referencia_id,
                status
            )
            VALUES ('pedido', ?, 'aguardando_pagamento')`,
            [pedidoId]
        );

        await finalizar();

        return {
            pedidoId,
            subtotal: Number(subtotal.toFixed(2)),
            total,
            itens: itensConfirmados.map(
                ({ produto, quantidade }) => ({
                    id: produto.id,
                    nome: produto.nome,
                    quantidade,
                    preco: Number(produto.preco)
                })
            ),
            frete: Number(frete.toFixed(2))
        };

    } catch (erro) {

        await desfazer();
        throw erro;
    }
}

module.exports = {
    criarPedidoReservado,
    calcularFrete
};