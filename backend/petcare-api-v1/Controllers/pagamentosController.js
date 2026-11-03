const PagamentosModel = require('../Models/pagamentosModel');
const { responderErroInterno, registrarErroInterno } = require('../utils/erroInterno');
const { podeAcessarReferencia } = require('../utils/acessoRegistro');
const PedidosModel = require('../Models/pedidosModel');
const AgendamentosModel = require('../Models/agendamentosModel');
const MercadoPagoService = require('../Services/mercadoPagoService');
const {
    mapearStatusMercadoPago,
    valorConfere,
    registrarResultadoPagamento
} = require('../Services/pagamentoStatusService');

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

exports.iniciarPagamentoAgendamento = (req, res) => {

    const usuario = req.usuario;
    const { agendamento_id } = req.params;

    if (!agendamento_id) {
        return res.status(400).json({
            mensagem: 'ID do agendamento é obrigatório.'
        });
    }

    AgendamentosModel.getByIdParaPagamento(
        agendamento_id,
        (err, agendamento) => {

            if (err) {
                registrarErroInterno('pagamentosController: Erro ao buscar agendamento', err);

                return res.status(500).json({
                    mensagem: 'Erro ao buscar agendamento.'
                });
            }

            if (!agendamento) {
                return res.status(404).json({
                    mensagem: 'Agendamento não encontrado.'
                });
            }

            // O agendamento precisa pertencer
            // ao cliente autenticado.
            if (
                usuario.tipo !== 'cliente' ||
                agendamento.cliente_id !== usuario.id
            ) {
                return res.status(403).json({
                    mensagem:
                        'Você não pode iniciar o pagamento deste agendamento.'
                });
            }

            // Somente agendamentos aguardando
            // pagamento podem iniciar cobrança.
            if (agendamento.status !== 'aguardando_pagamento') {
                return res.status(400).json({
                    mensagem:
                        'Este agendamento não está aguardando pagamento.'
                });
            }

            PagamentosModel.getByReferencia(
                'agendamento',
                agendamento.id,
                (err, pagamentosExistentes) => {

                    if (err) {
                        registrarErroInterno('pagamentosController: Erro ao verificar pagamento existente', err);

                        return res.status(500).json({
                            mensagem: 'Erro ao verificar pagamento.'
                        });
                    }

                    const pagamentoPendente =
                        pagamentosExistentes.find(
                            pagamento =>
                                pagamento.status === 'pendente'
                        );

                    if (pagamentoPendente) {
                        return res.status(409).json({
                            mensagem:
                                'Este agendamento já possui um pagamento pendente.',
                            pagamento_id:
                                pagamentoPendente.id
                        });
                    }

                    MercadoPagoService.criarPreferencia({
                        titulo: `Serviço PetCare Connect - Agendamento #${agendamento.id}`,
                        valor: agendamento.valor,
                        referencia_id: agendamento.id
                    })
                        .then((preference) => {

                            PagamentosModel.create(
                                {
                                    tipo_referencia: 'agendamento',
                                    referencia_id: agendamento.id,
                                    gateway: 'mercado_pago',
                                    gateway_preference_id: preference.id,
                                    gateway_payment_id: null,
                                    status: 'pendente',
                                    valor: agendamento.valor
                                },
                                (err, result) => {

                                    if (err) {
                                        registrarErroInterno('pagamentosController: Erro ao criar pagamento', err);

                                        return res.status(500).json({
                                            mensagem: 'Erro ao criar pagamento.'
                                        });
                                    }

                                    return res.status(201).json({
                                        mensagem: 'Pagamento iniciado com sucesso.',
                                        pagamento_id: result.insertId,
                                        agendamento_id: agendamento.id,
                                        valor: agendamento.valor,
                                        status: 'pendente',
                                        preference_id: preference.id,
                                        checkout_url: preference.init_point
                                    });
                                }
                            );
                        })
                        .catch((error) => {

                            registrarErroInterno('pagamentosController: Erro ao criar preferência no Mercado Pago', error);

                            return res.status(502).json({
                                mensagem: 'Não foi possível iniciar o pagamento.'
                            });

                        });
                }
            );
        }
    );
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

        console.log('Webhook Mercado Pago autenticado.');

    } catch (error) {

        if (error instanceof InvalidWebhookSignatureError) {

            console.error('Detalhes da falha de assinatura:', {
                motivo: error.reason,
                request_id: error.requestId,
                timestamp: error.timestamp,
                data_id_query: req.query?.['data.id'],
                data_id_body: req.body?.data?.id,
                manifesto_hmac: getSignatureManifest(req)
            });

            console.error(
                'Assinatura do webhook Mercado Pago inválida.'
            );

            return res.status(401).json({
                mensagem: 'Assinatura do webhook inválida.'
            });
        }

        registrarErroInterno('pagamentosController: Erro ao validar assinatura do webhook', error);

        return res.sendStatus(500);
    }

    const tipoEvento = req.body?.type;
    const acao = req.body?.action;

    console.log('Tipo do evento:', tipoEvento);
    console.log('Ação:', acao);
    console.log('Payment ID recebido:', dataId);

    // Processamos somente eventos de pagamento.
    if (tipoEvento !== 'payment') {
        console.log(
            'Evento ignorado. Tipo não é payment:',
            tipoEvento
        );

        return res.sendStatus(200);
    }

    try {

        // Consulta o pagamento diretamente na API do Mercado Pago.
        const pagamentoMercadoPago =
            await MercadoPagoService.buscarPagamento(dataId);

        if (!pagamentoMercadoPago) {
            console.error(
                'Mercado Pago não retornou o pagamento:',
                dataId
            );

            return res.sendStatus(200);
        }

        const statusMercadoPago =
            pagamentoMercadoPago.status;

        const externalReference =
            pagamentoMercadoPago.external_reference;

        const valorPagoMercadoPago =
            Number(pagamentoMercadoPago.transaction_amount);

        console.log(
            'Status Mercado Pago:',
            statusMercadoPago
        );

        console.log(
            'External Reference:',
            externalReference
        );

        /*
         * Neste primeiro momento, usamos a external_reference
         * para localizar o pagamento interno.
         *
         * Para agendamento, a referência é o ID do agendamento.
         */
        if (!externalReference) {

            console.error(
                'Pagamento sem external_reference:',
                dataId
            );

            return res.sendStatus(200);
        }

        const referencia = String(externalReference);
        const referenciaComTipo = referencia.match(/^(pedido|agendamento):(\d+)$/);
        const tipoReferencia = referenciaComTipo ? referenciaComTipo[1] : 'agendamento';
        const referenciaId = Number(referenciaComTipo ? referenciaComTipo[2] : referencia);

        if (!Number.isInteger(referenciaId)) {

            console.error(
                'external_reference inválida:',
                externalReference
            );

            return res.sendStatus(200);
        }

        /*
         * Procura o pagamento interno pelo tipo/referência.
         *
         * Neste momento o webhook está sendo usado
         * para pagamentos de agendamento.
         */
        PagamentosModel.getByReferencia(
            tipoReferencia,
            referenciaId,
            (err, pagamentos) => {

                if (err) {

                    registrarErroInterno('pagamentosController: Erro ao localizar pagamento interno', err);

                    return res.sendStatus(200);
                }

                if (!pagamentos || pagamentos.length === 0) {

                    console.error(
                        'Nenhum pagamento interno encontrado para o agendamento:',
                        referenciaId
                    );

                    return res.sendStatus(200);
                }

                /*
                 * Pegamos o pagamento pendente mais recente.
                 */
                const pagamentoInterno =
                    pagamentos.find(
                        pagamento =>
                            pagamento.status === 'pendente'
                    ) || pagamentos[0];

                const valorEsperado =
                    Number(pagamentoInterno.valor);

                if (!valorConfere(valorPagoMercadoPago, valorEsperado)) {
                    console.error(
                        'Valor do pagamento divergente:',
                        {
                            pagamento_id: pagamentoInterno.id,
                            referencia_id: pagamentoInterno.referencia_id,
                            valor_esperado: valorEsperado,
                            valor_pago: valorPagoMercadoPago,
                            gateway_payment_id: pagamentoMercadoPago.id
                        }
                    );

                    return res.sendStatus(200);
                }

                const novoStatus = mapearStatusMercadoPago(statusMercadoPago);

                if (!novoStatus) {
                    console.warn(
                        'Status Mercado Pago não mapeado:',
                        statusMercadoPago
                    );

                    return res.sendStatus(200);
                }

                return registrarResultadoPagamento(
                    pagamentoInterno,
                    pagamentoMercadoPago.id,
                    novoStatus,
                    () => res.sendStatus(200)
                );
            }
        );

    } catch (error) {

        registrarErroInterno('pagamentosController: Erro ao processar pagamento do Mercado Pago', error);

        /*
         * O Webhook foi autenticado corretamente.
         * Respondemos 200 para evitar que o endpoint fique
         * preso em timeout enquanto investigamos um erro interno.
         */
        return res.sendStatus(200);
    }
};
