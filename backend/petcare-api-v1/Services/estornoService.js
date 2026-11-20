const PagamentosModel = require('../Models/pagamentosModel');
const MercadoPagoService = require('./mercadoPagoService');
const MercadoPagoOAuthService = require('./mercadoPagoOAuthService');
const EmailService = require('./emailService');
const { erroParaUsuario, registrarErroInterno } = require('../utils/erroInterno');

/*
 * Estorno total de pagamentos aprovados.
 *
 * Cancelamento pedido por alguém (cliente, loja ou admin): o estorno acontece
 * ANTES de cancelar a venda; se falhar, a venda continua como está.
 *
 * Estorno "obrigatório" (pagamento aprovado sem venda, ex.: pago fora do prazo):
 * se falhar, fica pendente e é tentado de novo a cada 30 minutos.
 *
 * Nos dois casos a falha fica registrada no pagamento e os administradores e
 * o dono da loja são avisados por e-mail. A causa mais comum é a loja estar
 * sem saldo no Mercado Pago: no split, o estorno sai da conta da loja.
 */

// Mesmo pagamento falhando várias vezes não gera um e-mail a cada tentativa.
const INTERVALO_ENTRE_ALERTAS_MS = 6 * 60 * 60 * 1000;
const LIMITE_POR_REPROCESSAMENTO = 20;

const ehSplit = (pagamento) => pagamento.valor_comissao !== null && pagamento.valor_comissao !== undefined;

/** Texto curto do erro do Mercado Pago, para o painel e o e-mail. */
function descreverErro(erro) {
    const detalhe = erro?.cause?.[0]?.description || erro?.cause?.message || erro?.message || 'erro desconhecido';
    const status = erro?.status || erro?.statusCode;
    return status ? `${detalhe} (HTTP ${status})` : detalhe;
}

async function avisarFalha(pagamento, erro, obrigatorio) {
    const contatos = await PagamentosModel.contatosDoAlertaDeEstorno(pagamento.loja_id);
    const dados = {
        pagamentoId: pagamento.id,
        tipo: pagamento.tipo_referencia,
        referenciaId: pagamento.referencia_id,
        valor: pagamento.valor,
        loja: contatos.loja?.nome_fantasia,
        erro,
        obrigatorio
    };

    const envios = [EmailService.enviarAlertaEstornoAdmin(contatos.admins, dados)];
    if (contatos.loja?.email) {
        envios.push(EmailService.enviarAvisoEstornoLoja(contatos.loja.email, { ...dados, nomeLoja: contatos.loja.nome_fantasia }));
    }
    await Promise.all(envios);
}

async function registrarFalha(pagamento, erroMercadoPago, obrigatorio) {
    const erro = descreverErro(erroMercadoPago);
    registrarErroInterno(`estornoService: estorno do pagamento ${pagamento.id} recusado${obrigatorio ? ' (pendente)' : ''}`, erroMercadoPago);

    try {
        await PagamentosModel.registrarFalhaEstorno(pagamento.id, erro, obrigatorio);
    } catch (falhaAoRegistrar) {
        registrarErroInterno(`estornoService: ESTORNO MANUAL NECESSÁRIO (pagamento ${pagamento.id}); falha ao registrar`, falhaAoRegistrar);
    }

    const ultimaFalha = pagamento.estorno_ultima_falha_em ? new Date(pagamento.estorno_ultima_falha_em).getTime() : 0;
    if (Date.now() - ultimaFalha >= INTERVALO_ENTRE_ALERTAS_MS) {
        avisarFalha(pagamento, erro, obrigatorio)
            .catch((falhaNoAviso) => registrarErroInterno(`estornoService: aviso do estorno ${pagamento.id} não enviado`, falhaNoAviso));
    }
}

/**
 * Estorna um pagamento no Mercado Pago e marca como estornado.
 * Pagamento do split é estornado com o token da loja; os antigos, com o da PetCare.
 */
async function estornarPagamento({ pagamento, gatewayPaymentId, obrigatorio = false }) {

    const paymentId = gatewayPaymentId || pagamento.gateway_payment_id;

    if (!paymentId) throw new Error(`Pagamento ${pagamento.id} sem gateway_payment_id para estornar.`);

    try {
        // Dentro do try: loja que desconectou o Mercado Pago também é uma falha de estorno.
        const accessToken = ehSplit(pagamento)
            ? await MercadoPagoOAuthService.obterAccessTokenDaLoja(pagamento.loja_id)
            : undefined;

        await MercadoPagoService.estornarPagamento(String(paymentId), accessToken, `estorno-pagamento-${pagamento.id}`);
    } catch (erro) {
        await registrarFalha(pagamento, erro, obrigatorio);
        throw erroParaUsuario(
            502,
            'Não foi possível devolver o pagamento agora. Nossa equipe foi avisada e vai acompanhar. Tente novamente mais tarde.',
            erro
        );
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

/**
 * Tenta de novo os estornos pendentes, um de cada vez.
 * As falhas já ficam registradas (e avisadas) por estornarPagamento.
 */
async function reprocessarEstornosPendentes() {
    const pendentes = await PagamentosModel.idsComEstornoPendente(LIMITE_POR_REPROCESSAMENTO);
    const resultado = { estornados: 0, falhas: 0 };

    for (const { id } of pendentes) {
        const pagamento = await PagamentosModel.getComLoja(id);
        const deuCerto = await estornarPagamento({ pagamento, obrigatorio: true }).then(() => true, () => false);
        resultado[deuCerto ? 'estornados' : 'falhas'] += 1;
    }

    return resultado;
}

module.exports = {
    estornarPagamento,
    estornarVendaSePaga,
    reprocessarEstornosPendentes
};
