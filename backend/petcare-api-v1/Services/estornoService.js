const PagamentosModel = require('../Models/pagamentosModel');
const MercadoPagoService = require('./mercadoPagoService');
const MercadoPagoOAuthService = require('./mercadoPagoOAuthService');
const { erroParaUsuario } = require('../utils/erroInterno');

/*
 * Estorno total de pagamentos aprovados.
 * O estorno no Mercado Pago acontece ANTES de cancelar a venda: se ele
 * falhar, a venda continua como está e o usuário pode tentar de novo.
 */

const ehSplit = (pagamento) => pagamento.valor_comissao !== null && pagamento.valor_comissao !== undefined;


/**
 * Estorna um pagamento no Mercado Pago e marca como estornado.
 * Pagamento do split é estornado com o token da loja; os antigos, com o da PetCare.
 */
async function estornarPagamento({ pagamento, gatewayPaymentId }) {

    const paymentId = gatewayPaymentId || pagamento.gateway_payment_id;

    if (!paymentId) throw new Error(`Pagamento ${pagamento.id} sem gateway_payment_id para estornar.`);

    const accessToken = ehSplit(pagamento)
        ? await MercadoPagoOAuthService.obterAccessTokenDaLoja(pagamento.loja_id)
        : undefined;

    try {
        await MercadoPagoService.estornarPagamento(String(paymentId), accessToken, `estorno-pagamento-${pagamento.id}`);
    } catch (erro) {
        throw erroParaUsuario(502, 'Não foi possível estornar o pagamento agora. Tente novamente em instantes.', erro);
    }

    await new Promise((resolve, reject) =>
        PagamentosModel.updateStatus(pagamento.id, 'estornado', (erro) => (erro ? reject(erro) : resolve())));

    console.log('Pagamento estornado:', { pagamento_id: pagamento.id, gateway_payment_id: String(paymentId) });
}

const buscarPorReferencia = (tipo, id) => new Promise((resolve, reject) =>
    PagamentosModel.getByReferencia(tipo, id, (erro, linhas) => (erro ? reject(erro) : resolve(linhas))));

/**
 * Se a venda (pedido ou agendamento) foi paga, estorna o pagamento aprovado.
 * Venda sem pagamento online (ex.: agendamento manual do lojista) não estorna nada.
 * Retorna true quando houve estorno.
 */
async function estornarVendaSePaga(tipoReferencia, referenciaId) {

    const aprovado = (await buscarPorReferencia(tipoReferencia, referenciaId))
        .find(pagamento => pagamento.status === 'aprovado');

    if (!aprovado) return false;

    const pagamento = await PagamentosModel.getComLoja(aprovado.id);

    await estornarPagamento({ pagamento });

    return true;
}

module.exports = {
    estornarPagamento,
    estornarVendaSePaga
};
