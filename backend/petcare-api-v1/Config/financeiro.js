/*
 * Comissão da PetCare por tipo de venda, em percentual.
 * Pedido: aplicada só sobre os produtos (o frete fica todo com a loja).
 * Agendamento: aplicada sobre o valor do serviço.
 * A tarifa do Mercado Pago é descontada da parte da loja.
 */
module.exports = {

    COMISSAO_PERCENTUAL: {
        pedido: 8,
        agendamento: 10
    },

    /*
     * Tempo para o cliente pagar um agendamento. Depois disso o link de
     * pagamento expira; o horário é liberado após a margem abaixo, que cobre
     * avisos de pagamento (ex.: Pix) que chegam com atraso.
     */
    PRAZO_PAGAMENTO_AGENDAMENTO_MIN: 30,
    MARGEM_LIBERACAO_HORARIO_MIN: 5

};
