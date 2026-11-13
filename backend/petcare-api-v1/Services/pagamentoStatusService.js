const PagamentosModel = require('../Models/pagamentosModel');
const PedidosModel = require('../Models/pedidosModel');
const AgendamentosModel = require('../Models/agendamentosModel');
const MercadoPagoService = require('./mercadoPagoService');
const MercadoPagoOAuthService = require('./mercadoPagoOAuthService');
const EstornoService = require('./estornoService');
const { registrarErroInterno } = require('../utils/erroInterno');

/*
 * Converte os status do Mercado Pago
 * para os status aceitos pelo banco.
 */
const STATUS_MERCADO_PAGO = {
    approved: 'aprovado',
    rejected: 'recusado',
    cancelled: 'cancelado',
    expired: 'expirado',
    pending: 'pendente',
    in_process: 'pendente',
    in_mediation: 'pendente',
    refunded: 'estornado'
};

/** Retorna o status interno equivalente, ou null quando o status não é mapeado. */
function mapearStatusMercadoPago(statusMercadoPago) {
    return Object.prototype.hasOwnProperty.call(STATUS_MERCADO_PAGO, statusMercadoPago)
        ? STATUS_MERCADO_PAGO[statusMercadoPago]
        : null;
}

/** Verifica se o valor pago confere com o esperado (tolerância de 1 centavo). */
function valorConfere(valorPago, valorEsperado) {
    return (
        Number.isFinite(valorPago) &&
        Number.isFinite(valorEsperado) &&
        Math.abs(valorPago - valorEsperado) <= 0.01
    );
}

/**
 * Reflete o novo status do pagamento no pedido ou agendamento de origem.
 * Sempre chama `concluir()` ao final, com ou sem erro (os erros são registrados em log).
 */
/*
 * Pagamento aprovado que não confirmou a venda (prazo vencido, ou o cliente
 * pagou duas tentativas): o dinheiro não pode ficar com a loja sem a venda.
 * Estorna automaticamente; se falhar, fica registrado para ação manual.
 */
function estornarPagamentoSemVenda(pagamentoInterno, motivo, concluir) {
    console.warn(`${motivo} Estornando pagamento.`, {
        pagamento_id: pagamentoInterno.id,
        referencia_id: pagamentoInterno.referencia_id
    });

    EstornoService.estornarPagamento({ pagamento: pagamentoInterno })
        .catch(erro => registrarErroInterno(`pagamentoStatusService: ESTORNO MANUAL NECESSÁRIO (pagamento ${pagamentoInterno.id})`, erro))
        .finally(concluir);
}

function aplicarStatusNaReferencia(pagamentoInterno, novoStatus, concluir) {

    if (pagamentoInterno.tipo_referencia === 'pedido') {

        if (novoStatus === 'aprovado') {
            return PedidosModel.confirmarPagamento(pagamentoInterno.referencia_id, (erro, resultado) => {
                if (erro) {
                    registrarErroInterno('pagamentoStatusService: confirmar pedido após pagamento', erro);
                    return concluir();
                }
                if (resultado.affectedRows === 0) {
                    return estornarPagamentoSemVenda(pagamentoInterno, 'Pedido não confirmado: reserva expirada ou pedido já pago/cancelado.', concluir);
                }
                return concluir();
            });
        }

        return concluir();
    }

    if (pagamentoInterno.tipo_referencia === 'agendamento') {

        // Pagamento aprovado → confirma o agendamento
        if (novoStatus === 'aprovado') {
            return AgendamentosModel.confirmarPagamento(
                pagamentoInterno.referencia_id,
                (err, resultado) => {
                    if (err) {
                        registrarErroInterno('pagamentoStatusService: confirmar agendamento após pagamento', err);
                        return concluir();
                    }

                    if (resultado.affectedRows === 0) {
                        return estornarPagamentoSemVenda(pagamentoInterno, 'Agendamento não confirmado: prazo de pagamento vencido ou agendamento já pago/cancelado.', concluir);
                    }

                    console.log('Agendamento confirmado após pagamento:', pagamentoInterno.referencia_id);
                    return concluir();
                }
            );
        }

        // Pagamento cancelado ou expirado
        // → cancela o agendamento e libera o horário
        if (novoStatus === 'cancelado' || novoStatus === 'expirado') {
            return AgendamentosModel.cancelarPorFaltaDePagamento(
                pagamentoInterno.referencia_id,
                (err) => {
                    if (err) {
                        registrarErroInterno('pagamentoStatusService: cancelar agendamento após pagamento', err);
                        return concluir();
                    }

                    console.log('Agendamento cancelado após pagamento:', {
                        agendamento_id: pagamentoInterno.referencia_id,
                        motivo: novoStatus
                    });
                    return concluir();
                }
            );
        }

        /*
         * rejected → pagamento recusado.
         *
         * O agendamento permanece aguardando_pagamento para permitir
         * uma nova tentativa.
         *
         * pending / in_process / in_mediation
         * também não alteram o agendamento.
         */
        return concluir();
    }

    return concluir();
}

/**
 * Grava o ID do pagamento no gateway, atualiza o status do pagamento interno
 * e aplica o resultado no pedido/agendamento. Chama `concluir()` ao final.
 */
function registrarResultadoPagamento(pagamentoInterno, gatewayPaymentId, novoStatus, concluir) {

    /*
     * Primeiro salvamos o ID real do pagamento
     * gerado pelo Mercado Pago.
     */
    PagamentosModel.updateGatewayPaymentId(
        pagamentoInterno.id,
        String(gatewayPaymentId),
        (err) => {

            if (err) {
                registrarErroInterno('pagamentoStatusService: salvar gateway_payment_id', err);
                return concluir();
            }

            /*
             * Depois atualizamos o status.
             */
            PagamentosModel.updateStatus(
                pagamentoInterno.id,
                novoStatus,
                (err) => {

                    if (err) {
                        registrarErroInterno('pagamentoStatusService: atualizar status do pagamento', err);
                        return concluir();
                    }

                    console.log('Pagamento atualizado com sucesso:', {
                        pagamento_id: pagamentoInterno.id,
                        gateway_payment_id: gatewayPaymentId,
                        status: novoStatus
                    });

                    return aplicarStatusNaReferencia(
                        { ...pagamentoInterno, gateway_payment_id: String(gatewayPaymentId) },
                        novoStatus,
                        concluir
                    );
                }
            );
        }
    );
}

/** Tarifa cobrada pelo Mercado Pago (sem a comissão da PetCare). */
function calcularTarifaGateway(pagamentoMercadoPago) {
    const tarifas = (pagamentoMercadoPago.fee_details || [])
        .filter(item => item.type === 'mercadopago_fee')
        .reduce((total, item) => total + Math.round(Number(item.amount || 0) * 100), 0);

    return tarifas / 100;
}

const buscarPorReferencia = (tipo, id) => new Promise((resolve, reject) =>
    PagamentosModel.getByReferencia(tipo, id, (erro, linhas) => (erro ? reject(erro) : resolve(linhas))));

/*
 * Localiza o pagamento interno a partir da external_reference.
 * Novo formato (split): "pagamento:<id>".
 * Formatos antigos (antes do split): "pedido:<id>" ou só o ID do agendamento.
 */
async function localizarPagamentoInterno(externalReference) {
    const referencia = String(externalReference || '');

    const novo = referencia.match(/^pagamento:(\d+)$/);
    if (novo) return PagamentosModel.getComLoja(Number(novo[1]));

    const antigo = referencia.match(/^(?:(pedido|agendamento):)?(\d+)$/);
    if (!antigo) return null;

    const pagamentos = await buscarPorReferencia(antigo[1] || 'agendamento', Number(antigo[2]));

    return pagamentos.find(p => p.status === 'pendente') || pagamentos[0] || null;
}

/**
 * Processa o aviso de pagamento do Mercado Pago (webhook já autenticado).
 * No split, o pagamento pertence à conta da loja: ele é consultado com o
 * token dela, e o pagamento interno precisa ser de uma venda dessa loja.
 * Pagamentos antigos (conta da PetCare) seguem com o token da plataforma.
 */
async function processarNotificacaoPagamento({ paymentId, mpUserId }) {

    const conta = await MercadoPagoOAuthService.obterContaPorUsuarioMercadoPago(mpUserId);
    const accessToken = conta ? await MercadoPagoOAuthService.obterAccessTokenDaLoja(conta.lojaId) : undefined;

    const pagamentoMercadoPago = await MercadoPagoService.buscarPagamento(paymentId, accessToken);

    if (!pagamentoMercadoPago) {
        console.error('Mercado Pago não retornou o pagamento:', paymentId);
        return;
    }

    const pagamentoInterno = await localizarPagamentoInterno(pagamentoMercadoPago.external_reference);

    if (!pagamentoInterno) {
        console.error('Pagamento interno não encontrado:', {
            gateway_payment_id: pagamentoMercadoPago.id,
            external_reference: pagamentoMercadoPago.external_reference
        });
        return;
    }

    // Pagamento do split só vale se veio da conta da própria loja da venda.
    const ehSplit = pagamentoInterno.valor_comissao !== null && pagamentoInterno.valor_comissao !== undefined;
    const contaConfere = conta ? Number(pagamentoInterno.loja_id) === Number(conta.lojaId) : !ehSplit;

    if (!contaConfere) {
        console.error('Pagamento recebido por conta Mercado Pago que não é a da loja da venda:', {
            pagamento_id: pagamentoInterno.id,
            gateway_payment_id: pagamentoMercadoPago.id
        });
        return;
    }

    if (!valorConfere(Number(pagamentoMercadoPago.transaction_amount), Number(pagamentoInterno.valor))) {
        console.error('Valor do pagamento divergente:', {
            pagamento_id: pagamentoInterno.id,
            valor_esperado: Number(pagamentoInterno.valor),
            valor_pago: Number(pagamentoMercadoPago.transaction_amount),
            gateway_payment_id: pagamentoMercadoPago.id
        });
        return;
    }

    const novoStatus = mapearStatusMercadoPago(pagamentoMercadoPago.status);

    if (!novoStatus) {
        console.warn('Status Mercado Pago não mapeado:', pagamentoMercadoPago.status);
        return;
    }

    /*
     * O Mercado Pago avisa o mesmo pagamento mais de uma vez. Aviso repetido
     * não é reprocessado (senão um aprovado repetido seria tratado como
     * pagamento sem venda), e estornado é definitivo.
     */
    if (pagamentoInterno.status === novoStatus || pagamentoInterno.status === 'estornado') {
        return;
    }

    if (novoStatus === 'aprovado') {
        await PagamentosModel.updateTarifaGateway(pagamentoInterno.id, calcularTarifaGateway(pagamentoMercadoPago));
    }

    await new Promise(resolve =>
        registrarResultadoPagamento(pagamentoInterno, pagamentoMercadoPago.id, novoStatus, resolve));
}

module.exports = {
    mapearStatusMercadoPago,
    valorConfere,
    aplicarStatusNaReferencia,
    registrarResultadoPagamento,
    calcularTarifaGateway,
    processarNotificacaoPagamento
};
