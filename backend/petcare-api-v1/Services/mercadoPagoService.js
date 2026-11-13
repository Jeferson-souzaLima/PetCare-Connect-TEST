const {
    MercadoPagoConfig,
    Preference,
    Payment,
    PaymentRefund
} = require('mercadopago');
const {
    buildWebhookNotificationUrl
} = require('../utils/mercadoPagoNotificationUrl');

/*
 * Sem accessToken, usa a conta da PetCare (MP_ACCESS_TOKEN): só para
 * consultar pagamentos antigos, feitos antes do split.
 * Com o accessToken da loja, a cobrança é criada na conta do lojista e o
 * marketplace_fee (comissão) vai para a PetCare.
 */
const clientePlataforma = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

const configuracao = (accessToken) => (
    accessToken ? new MercadoPagoConfig({ accessToken }) : clientePlataforma
);

const MercadoPagoService = {

    criarPreferencia: async ({
        accessToken,
        marketplaceFee,
        referenciaExterna,
        itens,
        expiraEm
    }) => {

        const appUrl = process.env.APP_URL || 'http://localhost:5173';

        // O link de pagamento e o Pix/boleto gerados expiram junto com a reserva.
        const expiracao = expiraEm ? {
            expires: true,
            expiration_date_to: expiraEm.toISOString(),
            date_of_expiration: expiraEm.toISOString()
        } : {};

        return new Preference(configuracao(accessToken)).create({
            body: {
                items: itens,
                external_reference: referenciaExterna,
                marketplace_fee: marketplaceFee,
                ...expiracao,
                notification_url: buildWebhookNotificationUrl(process.env.MP_WEBHOOK_URL),
                back_urls: {
                    success: `${appUrl}/pagamento/sucesso`,
                    failure: `${appUrl}/pagamento/falha`,
                    pending: `${appUrl}/pagamento/pendente`
                }
            }
        });
    },

    buscarPagamento: async (paymentId, accessToken) => (
        new Payment(configuracao(accessToken)).get({ id: paymentId })
    ),

    /*
     * Estorno total. No split, o Mercado Pago devolve ao cliente o valor
     * inteiro, tirando da conta da loja e a comissão da PetCare.
     * A chave de idempotência evita estorno duplicado em pedidos repetidos.
     */
    estornarPagamento: async (paymentId, accessToken, idempotencyKey) => (
        new PaymentRefund(configuracao(accessToken)).create({
            payment_id: paymentId,
            body: {},
            requestOptions: { idempotencyKey }
        })
    )

};

module.exports = MercadoPagoService;
