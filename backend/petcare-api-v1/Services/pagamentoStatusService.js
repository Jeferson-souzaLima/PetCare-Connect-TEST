const PagamentosModel = require('../Models/pagamentosModel');
const PedidosModel = require('../Models/pedidosModel');
const AgendamentosModel = require('../Models/agendamentosModel');

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
    in_mediation: 'pendente'
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
function aplicarStatusNaReferencia(pagamentoInterno, novoStatus, concluir) {

    if (pagamentoInterno.tipo_referencia === 'pedido') {

        if (novoStatus === 'aprovado') {
            return PedidosModel.confirmarPagamento(pagamentoInterno.referencia_id, (erro, resultado) => {
                if (erro) console.error('Erro ao confirmar pedido após pagamento:', erro);
                if (!erro && resultado.affectedRows === 0) console.warn('Pedido não confirmado: reserva expirada ou status incompatível.', pagamentoInterno.referencia_id);
                return concluir();
            });
        }

        return concluir();
    }

    if (pagamentoInterno.tipo_referencia === 'agendamento') {

        // Pagamento aprovado → confirma o agendamento
        if (novoStatus === 'aprovado') {
            return AgendamentosModel.atualizarStatus(
                pagamentoInterno.referencia_id,
                'confirmado',
                (err) => {
                    if (err) {
                        console.error('Erro ao confirmar agendamento após pagamento:', err);
                        return concluir();
                    }

                    console.log('Agendamento confirmado após pagamento:', pagamentoInterno.referencia_id);
                    return concluir();
                }
            );
        }

        // Pagamento cancelado ou expirado
        // → cancela o agendamento e libera o horário
        if (novoStatus === 'cancelado' || novoStatus === 'expirado') {
            return AgendamentosModel.atualizarStatus(
                pagamentoInterno.referencia_id,
                'cancelado',
                (err) => {
                    if (err) {
                        console.error('Erro ao cancelar agendamento após pagamento:', err);
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
                console.error('Erro ao salvar gateway_payment_id:', err);
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
                        console.error('Erro ao atualizar status do pagamento:', err);
                        return concluir();
                    }

                    console.log('Pagamento atualizado com sucesso:', {
                        pagamento_id: pagamentoInterno.id,
                        gateway_payment_id: gatewayPaymentId,
                        status: novoStatus
                    });

                    return aplicarStatusNaReferencia(pagamentoInterno, novoStatus, concluir);
                }
            );
        }
    );
}

module.exports = {
    mapearStatusMercadoPago,
    valorConfere,
    aplicarStatusNaReferencia,
    registrarResultadoPagamento
};
