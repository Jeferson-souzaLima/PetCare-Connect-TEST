const PagamentosModel = require('../Models/pagamentosModel');
const MercadoPagoService = require('./mercadoPagoService');
const MercadoPagoOAuthService = require('./mercadoPagoOAuthService');
const { calcularComissao } = require('./comissaoService');
const { consultar, emTransacao } = require('../utils/transacao');
const { registrarErroInterno } = require('../utils/erroInterno');

/*
 * Cria a cobrança de um pedido ou agendamento na conta Mercado Pago da loja,
 * com a comissão da PetCare como marketplace_fee.
 *
 * O registro do pagamento é criado antes da preferência para que a
 * external_reference aponte para ele ("pagamento:<id>"): o webhook encontra
 * exatamente esta tentativa, mesmo que o cliente tente pagar mais de uma vez.
 */

const transacao = (trabalho) => new Promise((resolve, reject) =>
    emTransacao(trabalho, (erro, resultado) => (erro ? reject(erro) : resolve(resultado))));

/** Confirma antes de reservar algo que a loja consegue receber online. */
async function garantirLojaRecebeOnline(lojaId) {
    await MercadoPagoOAuthService.obterAccessTokenDaLoja(lojaId);
}

async function iniciarCobranca({ tipoReferencia, referenciaId, lojaId, valor, baseComissao, itens, expiraEm }) {

    const accessToken = await MercadoPagoOAuthService.obterAccessTokenDaLoja(lojaId);
    const comissao = calcularComissao(tipoReferencia, baseComissao);

    const pagamentoId = await transacao(() => PagamentosModel.substituirPendentes({
        tipoReferencia,
        referenciaId,
        valor,
        comissao
    }));

    try {
        const preferencia = await MercadoPagoService.criarPreferencia({
            accessToken,
            marketplaceFee: comissao.valor,
            referenciaExterna: `pagamento:${pagamentoId}`,
            itens,
            expiraEm
        });

        await PagamentosModel.updatePreferenceId(pagamentoId, preferencia.id);

        return {
            pagamentoId,
            preferenceId: preferencia.id,
            checkoutUrl: preferencia.init_point
        };

    } catch (erro) {
        // A tentativa não chegou ao cliente: não deve ficar pendente.
        await consultar("UPDATE pagamentos SET status = 'cancelado' WHERE id = ?", [pagamentoId])
            .catch(falha => registrarErroInterno('cobrancaService: cancelar tentativa sem preferência', falha));
        throw erro;
    }
}

module.exports = {
    garantirLojaRecebeOnline,
    iniciarCobranca
};
