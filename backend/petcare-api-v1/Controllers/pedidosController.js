const pedidosModel = require('../Models/pedidosModel');
const db = require('../db');
const {
    criarPedidoReservado,
    calcularFrete
} = require('../Services/pedidoCheckoutService');
const { garantirLojaRecebeOnline, iniciarCobranca } = require('../Services/cobrancaService');
const { estornarVendaSePaga } = require('../Services/estornoService');

// Mesmo prazo da reserva de estoque (pedidos.reserva_expira_em).
const PRAZO_RESERVA_PEDIDO_MIN = 10;
const { responderErroInterno, responderErroDoServico, registrarErroInterno } = require('../utils/erroInterno');

// ===============================
// ADMIN — ver todos pedidos
// ===============================
exports.getAll = (req, res) => {
    const usuario = req.usuario;

    if (usuario.tipo !== 'admin') {
        return res.status(403).json({ mensagem: 'Acesso restrito ao administrador.' });
    }

    pedidosModel.getAll((err, results) => {
        if (err) return responderErroInterno(res, err, "pedidosController.getAll");
        res.json(results);
    });
};

// ===============================
// CLIENTE — ver apenas seus pedidos
// ===============================
exports.getMeusPedidos = (req, res) => {
    const usuario = req.usuario;

    if (usuario.tipo !== 'cliente') {
        return res.status(403).json({
            mensagem: 'Acesso permitido apenas para clientes.'
        });
    }

    pedidosModel.getMeusPedidosCompletos(usuario.id, (err, resultados) => {
        if (err) {
            registrarErroInterno('pedidosController: Erro ao buscar meus pedidos', err);
            return res.status(500).json({
                mensagem: 'Não foi possível carregar seus pedidos.'
            });
        }

        const pedidos = {};

        resultados.forEach(item => {
            if (!pedidos[item.id]) {
                pedidos[item.id] = {
                    id: item.id,
                    loja_id: item.loja_id,
                    nome_loja: item.nome_loja,
                    data_pedido: item.data_pedido,
                    status: item.status,
                    subtotal: Number(item.subtotal),
                    valor_entrega: Number(item.valor_entrega),
                    total: Number(item.total),
                    modalidade_entrega: item.modalidade_entrega,
                    itens: []
                };
            }

            pedidos[item.id].itens.push({
                item_id: item.item_id,
                tipo: item.tipo,
                produto_id: item.produto_id,
                nome_item: item.nome_item,
                preco_unitario: Number(item.preco_unitario),
                quantidade: item.quantidade
            });
        });

        res.json(Object.values(pedidos));
    });
};

// ===============================
// LOJISTA — ver pedidos da sua loja
// ===============================
exports.getPedidosLoja = (req, res) => {
    const usuario = req.usuario;

    if (usuario.tipo !== 'lojista') {
        return res.status(403).json({
            mensagem: 'Acesso permitido apenas para lojistas.'
        });
    }

    if (!usuario.loja_id) {
        return res.status(400).json({
            mensagem: 'Loja não identificada no token.'
        });
    }

    pedidosModel.getPedidosLojaCompletos(
        usuario.loja_id,
        (err, resultados) => {
            if (err) {
                registrarErroInterno('pedidosController: Erro ao buscar pedidos da loja', err);

                return res.status(500).json({
                    mensagem: 'Não foi possível carregar os pedidos.'
                });
            }

            const pedidos = {};

            resultados.forEach((item) => {
                if (!pedidos[item.id]) {
                    pedidos[item.id] = {
                        id: item.id,
                        usuario_id: item.usuario_id,
                        loja_id: item.loja_id,
                        data_pedido: item.data_pedido,
                        status: item.status,

                        subtotal: Number(item.subtotal),
                        valor_entrega: Number(item.valor_entrega),
                        total: Number(item.total),

                        modalidade_entrega:
                            item.modalidade_entrega,

                        nome_contato: item.nome_contato,
                        telefone_contato: item.telefone_contato,

                        cep_entrega: item.cep_entrega,
                        endereco_entrega: item.endereco_entrega,
                        numero_entrega: item.numero_entrega,
                        complemento_entrega:
                            item.complemento_entrega,
                        bairro_entrega: item.bairro_entrega,
                        cidade_entrega: item.cidade_entrega,
                        uf_entrega: item.uf_entrega,

                        observacao: item.observacao,

                        reserva_expira_em:
                            item.reserva_expira_em,

                        cancelado_em:
                            item.cancelado_em,

                        itens: []
                    };
                }

                pedidos[item.id].itens.push({
                    item_id: item.item_id,
                    tipo: item.item_tipo,
                    produto_id: item.produto_id,
                    nome_item: item.nome_item,
                    preco_unitario:
                        Number(item.preco_unitario),
                    quantidade: item.quantidade
                });
            });

            return res.json(Object.values(pedidos));
        }
    );
};

// ===============================
// LOJISTA — atualizar status
// ===============================
exports.updateStatus = (req, res) => {
    const usuario = req.usuario;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ mensagem: 'Status é obrigatório.' });
    }

    pedidosModel.getByIdSimples(id, (err, pedido) => {
        if (err) return responderErroInterno(res, err, "pedidosController.updateStatus");
        if (!pedido) {
            return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
        }

        // ADMIN pode tudo
        if (usuario.tipo === 'admin') {
            return atualizar();
        }

        // LOJISTA só altera pedidos da própria loja
        if (usuario.tipo === 'lojista') {
            if (pedido.loja_id !== usuario.loja_id) {
                return res.status(403).json({ mensagem: 'Você não pode alterar pedidos de outra loja.' });
            }
            return atualizar();
        }

        // Cliente nunca altera status
        return res.status(403).json({ mensagem: 'Apenas lojistas podem alterar o status.' });

        function atualizar() {

            // ?? Proteção opcional: impedir alteração se já finalizado
            if (pedido.status === 'cancelado' || pedido.status === 'entregue') {
                return res.status(400).json({ mensagem: 'Pedido já finalizado e não pode ser alterado.' });
            }
            const transicoes = {
                pago: ['em_preparo'],
                em_preparo: ['pronto_para_retirada', 'em_entrega'],
                pronto_para_retirada: ['entregue'],
                em_entrega: ['entregue']
            };
            if (usuario.tipo === 'lojista' && !transicoes[pedido.status]?.includes(status)) {
                return res.status(400).json({ mensagem: 'Transição de status inválida para este pedido.' });
            }

            const gravarStatus = (mensagem) => pedidosModel.updateStatus(id, status, (err) => {
                if (err) return responderErroInterno(res, err, "pedidosController.atualizar");

                res.json({ mensagem });
            });

            // Cancelamento (só o admin pode) de pedido pago: estorna antes de cancelar.
            if (status === 'cancelado') {
                return estornarVendaSePaga('pedido', Number(id))
                    .then((estornou) => gravarStatus(estornou
                        ? 'Pedido cancelado e pagamento estornado.'
                        : 'Status atualizado com sucesso!'))
                    .catch((erro) => responderErroDoServico(res, erro, 'pedidosController.atualizar', 'Não foi possível cancelar o pedido.'));
            }

            gravarStatus('Status atualizado com sucesso!');
        }
    });
};

// ===============================
// LOJISTA — relatório da própria loja
// ===============================
exports.relatorioPedidos = (req, res) => {
    const usuario = req.usuario;

    if (usuario.tipo !== 'lojista') {
        return res.status(403).json({ mensagem: 'Acesso permitido apenas para lojistas.' });
    }

    const { status, data_inicial, data_final } = req.query;

    let query = 'SELECT * FROM pedidos WHERE loja_id = ?';
    let values = [usuario.loja_id];

    if (status) {
        query += ' AND status = ?';
        values.push(status);
    }

    if (data_inicial && data_final) {
        query += ' AND data_pedido BETWEEN ? AND ?';
        values.push(data_inicial, data_final);
    }

    pedidosModel.getByFilters(query, values, (err, results) => {
        if (err) return responderErroInterno(res, err, "pedidosController.relatorioPedidos");
        res.json(results);
    });
};

// ===============================
// ADMIN — deletar pedido
// ===============================
exports.deletarPedido = (req, res) => {
    const usuario = req.usuario;
    const { id } = req.params;

    if (usuario.tipo !== 'admin') {
        return res.status(403).json({ mensagem: 'Apenas admin pode deletar pedidos.' });
    }

    pedidosModel.delete(id, (err, result) => {
        if (err) return responderErroInterno(res, err, "pedidosController.deletarPedido");

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
        }

        res.json({ mensagem: 'Pedido deletado com sucesso!' });
    });
};

exports.cancelarPeloCliente = (req, res) => {
    const pedidoId = Number(req.params.id);
    pedidosModel.getByIdSimples(pedidoId, (erro, pedido) => {
        if (erro) return res.status(500).json({ mensagem: 'Erro ao buscar pedido.' });
        if (!pedido || pedido.usuario_id !== req.usuario.id) return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
        if (!['aguardando_pagamento', 'pago'].includes(pedido.status)) return res.status(400).json({ mensagem: 'Este pedido já está em preparação ou entrega e não pode ser cancelado pelo cliente.' });
        if (pedido.status === 'aguardando_pagamento') {
            return pedidosModel.cancelarReserva(pedidoId, (cancelErr) => {
                if (cancelErr) return res.status(500).json({ mensagem: 'Erro ao cancelar pedido.' });
                return res.json({ mensagem: 'Pedido cancelado e estoque liberado.' });
            });
        }
        // Pedido pago e ainda não preparado: estorna primeiro, depois cancela e devolve o estoque.
        estornarVendaSePaga('pedido', pedidoId)
            .then((estornou) => pedidosModel.cancelarPago(pedidoId, (cancelErr, cancelou) => {
                if (cancelErr || !cancelou) {
                    registrarErroInterno(`pedidosController.cancelarPeloCliente: pedido ${pedidoId} estornado mas não cancelado`, cancelErr || new Error('status mudou durante o cancelamento'));
                    return res.status(500).json({ mensagem: 'O pagamento foi estornado, mas não foi possível concluir o cancelamento. Nossa equipe vai verificar.' });
                }
                return res.json({
                    mensagem: estornou
                        ? 'Pedido cancelado. O valor será devolvido pelo Mercado Pago na mesma forma de pagamento.'
                        : 'Pedido cancelado.'
                });
            }))
            .catch((erro) => responderErroDoServico(res, erro, 'pedidosController.cancelarPeloCliente', 'Não foi possível cancelar o pedido.'));
    });
};

exports.calcularFrete = async (req, res) => {
    try {
        const { loja_id, latitude, longitude } = req.body;

        const resultado = await calcularFrete({
            lojaId: loja_id,
            latitude,
            longitude
        });

        return res.json(resultado);

    } catch (erro) {
        return responderErroDoServico(res, erro, 'pedidosController.calcularFrete', 'Não foi possível calcular o frete.');
    }
};

exports.checkout = async (req, res) => {
    try {
        // Antes de reservar estoque: a loja precisa conseguir receber online.
        // (loja inválida é recusada com 400 por criarPedidoReservado)
        if (Number.isInteger(Number(req.body?.loja_id))) {
            await garantirLojaRecebeOnline(Number(req.body.loja_id));
        }

        const pedido = await criarPedidoReservado({ usuarioId: req.usuario.id, dados: req.body });
        const expiraEm = new Date(Date.now() + PRAZO_RESERVA_PEDIDO_MIN * 60 * 1000);
        const itensMercadoPago = pedido.itens.map(item => ({
            id: String(item.id),
            title: item.nome,
            quantity: item.quantidade,
            currency_id: 'BRL',
            unit_price: Number(item.preco)
        }));

        if (Number(pedido.frete) > 0) {
            itensMercadoPago.push({
                id: `frete:${pedido.pedidoId}`,
                title: 'Frete',
                quantity: 1,
                currency_id: 'BRL',
                unit_price: Number(pedido.frete)
            });
        }

        // Comissão só sobre os produtos: o frete fica todo com a loja.
        const cobranca = await iniciarCobranca({
            tipoReferencia: 'pedido',
            referenciaId: pedido.pedidoId,
            lojaId: Number(req.body.loja_id),
            valor: pedido.total,
            baseComissao: pedido.subtotal,
            itens: itensMercadoPago,
            expiraEm
        });

        return res.status(201).json({ pedido_id: pedido.pedidoId, pagamento_id: cobranca.pagamentoId, total: pedido.total, valor_entrega: pedido.frete, checkout_url: cobranca.checkoutUrl, expira_em_minutos: PRAZO_RESERVA_PEDIDO_MIN });
    } catch (erro) {
        return responderErroDoServico(res, erro, 'pedidosController.checkout', 'Não foi possível iniciar o checkout.');
    }
};