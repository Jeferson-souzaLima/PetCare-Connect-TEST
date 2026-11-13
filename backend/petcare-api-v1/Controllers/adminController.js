const AdminModel = require('../Models/adminModel');
const pedidosModel = require('../Models/pedidosModel');
const { estornarVendaSePaga } = require('../Services/estornoService');
const { responderErroInterno, responderErroDoServico, registrarErroInterno } = require('../utils/erroInterno');

/*
 * Painel do administrador. As rotas já exigem tipo 'admin'
 * (authorizeRoles), então aqui só validamos a entrada.
 */

function idValido(valor) {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
}

exports.listarLojas = async (req, res) => {
    const filtro = req.query.status || 'pendentes';

    if (!AdminModel.FILTROS_LOJAS.includes(filtro)) {
        return res.status(400).json({ mensagem: 'Filtro de lojas inválido.' });
    }

    try {
        const lojas = await AdminModel.listarLojas(filtro);
        return res.json(lojas.map((loja) => ({
            ...loja,
            ativo: Boolean(loja.ativo),
            email_verificado: Boolean(loja.email_verificado),
            recebe_online: Boolean(loja.recebe_online)
        })));
    } catch (erro) {
        return responderErroInterno(res, erro, 'adminController.listarLojas');
    }
};

exports.definirSituacaoLoja = async (req, res) => {
    const lojaId = idValido(req.params.id);
    const { ativo } = req.body || {};

    if (!lojaId) return res.status(400).json({ mensagem: 'Loja inválida.' });
    if (typeof ativo !== 'boolean') {
        return res.status(400).json({ mensagem: 'Informe ativo como true ou false.' });
    }

    try {
        const alterou = await AdminModel.definirLojaAtiva(lojaId, ativo);
        if (!alterou) return res.status(404).json({ mensagem: 'Loja não encontrada.' });

        return res.json({ mensagem: ativo ? 'Loja aprovada e visível na plataforma.' : 'Loja suspensa e oculta da plataforma.' });
    } catch (erro) {
        return responderErroInterno(res, erro, 'adminController.definirSituacaoLoja');
    }
};

exports.listarUsuarios = async (req, res) => {
    const tipo = req.query.tipo || null;
    const busca = typeof req.query.busca === 'string' ? req.query.busca.trim() : '';

    if (tipo && !AdminModel.TIPOS_USUARIO.includes(tipo)) {
        return res.status(400).json({ mensagem: 'Tipo de usuário inválido.' });
    }

    if (busca.length > 100) {
        return res.status(400).json({ mensagem: 'Busca muito longa.' });
    }

    try {
        const usuarios = await AdminModel.listarUsuarios({ tipo, busca });
        return res.json(usuarios.map((usuario) => ({
            ...usuario,
            email_verificado: Boolean(usuario.email_verificado)
        })));
    } catch (erro) {
        return responderErroInterno(res, erro, 'adminController.listarUsuarios');
    }
};

exports.listarPedidos = async (req, res) => {
    try {
        return res.json(await AdminModel.listarPedidos());
    } catch (erro) {
        return responderErroInterno(res, erro, 'adminController.listarPedidos');
    }
};

// Pedidos que já saíram da loja (em entrega ou entregues) não são cancelados aqui.
const STATUS_CANCELAVEIS_PELO_ADMIN = ['aguardando_pagamento', 'pago', 'em_preparo', 'pronto_para_retirada'];

exports.cancelarPedido = (req, res) => {
    const pedidoId = idValido(req.params.id);
    if (!pedidoId) return res.status(400).json({ mensagem: 'Pedido inválido.' });

    pedidosModel.getByIdSimples(pedidoId, (erro, pedido) => {
        if (erro) return responderErroInterno(res, erro, 'adminController.cancelarPedido');
        if (!pedido) return res.status(404).json({ mensagem: 'Pedido não encontrado.' });

        if (!STATUS_CANCELAVEIS_PELO_ADMIN.includes(pedido.status)) {
            return res.status(400).json({ mensagem: 'Este pedido já saiu para entrega, foi entregue ou já está cancelado.' });
        }

        // Estorna antes de cancelar; o cancelamento devolve o estoque.
        estornarVendaSePaga('pedido', pedidoId)
            .then((estornou) => pedidosModel.cancelarPeloAdmin(pedidoId, (cancelErr, cancelou) => {
                if (cancelErr || !cancelou) {
                    registrarErroInterno(`adminController.cancelarPedido: pedido ${pedidoId} não cancelado`, cancelErr || new Error('status mudou durante o cancelamento'));
                    return res.status(500).json({
                        mensagem: estornou
                            ? 'O pagamento foi estornado, mas não foi possível concluir o cancelamento. Verifique o pedido.'
                            : 'Não foi possível cancelar o pedido.'
                    });
                }
                return res.json({
                    mensagem: estornou ? 'Pedido cancelado e pagamento estornado.' : 'Pedido cancelado.'
                });
            }))
            .catch((erroEstorno) => responderErroDoServico(res, erroEstorno, 'adminController.cancelarPedido', 'Não foi possível cancelar o pedido.'));
    });
};
