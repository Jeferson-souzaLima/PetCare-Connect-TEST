const PagamentosModel = require('../Models/pagamentosModel');
const { responderErroInterno, registrarErroInterno, responderErroDoServico } = require('../utils/erroInterno');
const { podeAcessarReferencia } = require('../utils/acessoRegistro');
const AgendamentosModel = require('../Models/agendamentosModel');
const { iniciarCobranca } = require('../Services/cobrancaService');
const { processarNotificacaoPagamento } = require('../Services/pagamentoStatusService');
const { PRAZO_PAGAMENTO_AGENDAMENTO_MIN } = require('../Config/financeiro');

const {
    getSignatureManifest,
    validateWebhookSignature,
    InvalidWebhookSignatureError
} = require('../utils/mercadoPagoWebhook');

exports.getById = (req, res) => {

    const { id } = req.params;
    const naoEncontrado = () => res.status(404).json({ mensagem: 'Pagamento não encontrado.' });

    PagamentosModel.getById(id, (err, pagamento) => {

        if (err) return responderErroInterno(res, err, 'pagamentosController.getById');

        if (!pagamento) return naoEncontrado();

        podeAcessarReferencia(req.usuario, pagamento.tipo_referencia, pagamento.referencia_id, (erroAcesso, pode) => {
            if (erroAcesso) return responderErroInterno(res, erroAcesso, 'pagamentosController.getById');
            if (!pode) return naoEncontrado();
            res.json(pagamento);
        });
    });
};

exports.getByReferencia = (req, res) => {

    const { tipo, referencia_id } = req.params;

    if (!tipo || !referencia_id) {
        return res.status(400).json({
            mensagem: 'Tipo e referência são obrigatórios.'
        });
    }

    if (!['pedido', 'agendamento'].includes(tipo)) {
        return res.status(400).json({
            mensagem: 'Tipo de referência inválido.'
        });
    }

    podeAcessarReferencia(req.usuario, tipo, referencia_id, (erroAcesso, pode) => {
        if (erroAcesso) return responderErroInterno(res, erroAcesso, 'pagamentosController.getByReferencia');

        if (!pode) {
            return res.status(404).json({ mensagem: 'Referência não encontrada.' });
        }

        PagamentosModel.getByReferencia(tipo, referencia_id, (err, pagamentos) => {
            if (err) return responderErroInterno(res, err, 'pagamentosController.getByReferencia');
            res.json(pagamentos);
        });
    });
};

const buscarAgendamentoParaPagamento = (id) => new Promise((resolve, reject) =>
    AgendamentosModel.getByIdParaPagamento(id, (erro, agendamento) => (erro ? reject(erro) : resolve(agendamento))));

/*
 * Inicia (ou reinicia) o pagamento de um agendamento. Uma nova tentativa
 * substitui a anterior, para o cliente nunca ficar sem conseguir pagar.
 */
exports.iniciarPagamentoAgendamento = async (req, res) => {

    const usuario = req.usuario;
    const agendamentoId = Number(req.params.agendamento_id);

    if (!Number.isInteger(agendamentoId) || agendamentoId < 1) {
        return res.status(400).json({ mensagem: 'ID do agendamento inválido.' });
    }

    try {
        const agendamento = await buscarAgendamentoParaPagamento(agendamentoId);

        // O agendamento precisa existir e pertencer ao cliente autenticado.
        if (!agendamento) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
        }

        if (usuario.tipo !== 'cliente' || agendamento.cliente_id !== usuario.id) {
            return res.status(403).json({ mensagem: 'Você não pode iniciar o pagamento deste agendamento.' });
        }

        if (agendamento.status !== 'aguardando_pagamento') {
            return res.status(400).json({ mensagem: 'Este agendamento não está aguardando pagamento.' });
        }

        const expiraEm = new Date(new Date(agendamento.created_at).getTime() + PRAZO_PAGAMENTO_AGENDAMENTO_MIN * 60 * 1000);

        if (expiraEm <= new Date()) {
            return res.status(400).json({ mensagem: 'O prazo para pagar este agendamento terminou. Faça um novo agendamento.' });
        }

        const valor = Number(agendamento.valor);

        const cobranca = await iniciarCobranca({
            tipoReferencia: 'agendamento',
            referenciaId: agendamento.id,
            lojaId: agendamento.loja_id,
            valor,
            baseComissao: valor,
            expiraEm,
            itens: [{
                id: `servico:${agendamento.servico_id}`,
                title: agendamento.servico_nome || `Agendamento #${agendamento.id}`,
                quantity: 1,
                currency_id: 'BRL',
                unit_price: valor
            }]
        });

        return res.status(201).json({
            mensagem: 'Pagamento iniciado com sucesso.',
            pagamento_id: cobranca.pagamentoId,
            agendamento_id: agendamento.id,
            valor,
            status: 'pendente',
            preference_id: cobranca.preferenceId,
            checkout_url: cobranca.checkoutUrl
        });

    } catch (erro) {
        return responderErroDoServico(res, erro, 'pagamentosController.iniciarPagamentoAgendamento', 'Não foi possível iniciar o pagamento.');
    }
};

// ===============================
// MERCADO PAGO – WEBHOOK
// ===============================

exports.webhook = async (req, res) => {

    const dataId = req.query['data.id'];

    if (!dataId) {
        return res.status(400).json({
            mensagem: 'ID do pagamento não informado.'
        });
    }

    try {

        validateWebhookSignature(req, process.env.MP_WEBHOOK_SECRET);

    } catch (error) {

        if (error instanceof InvalidWebhookSignatureError) {

            console.error('Assinatura do webhook Mercado Pago inválida:', {
                motivo: error.reason,
                request_id: error.requestId,
                timestamp: error.timestamp,
                data_id_query: req.query?.['data.id'],
                data_id_body: req.body?.data?.id,
                manifesto_hmac: getSignatureManifest(req)
            });

            return res.status(401).json({
                mensagem: 'Assinatura do webhook inválida.'
            });
        }

        registrarErroInterno('pagamentosController: Erro ao validar assinatura do webhook', error);

        return res.sendStatus(500);
    }

    // Processamos somente eventos de pagamento.
    if (req.body?.type !== 'payment') {
        return res.sendStatus(200);
    }

    try {
        await processarNotificacaoPagamento({
            paymentId: dataId,
            // Conta Mercado Pago dona do pagamento (a loja, no split).
            mpUserId: req.body?.user_id
        });
    } catch (error) {
        registrarErroInterno('pagamentosController: Erro ao processar pagamento do Mercado Pago', error);
    }

    /*
     * O webhook foi autenticado. Respondemos 200 mesmo com erro interno para
     * o Mercado Pago não reenviar em loop; o erro fica registrado no log.
     */
    return res.sendStatus(200);
};
