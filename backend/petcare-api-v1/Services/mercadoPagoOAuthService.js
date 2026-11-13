const crypto = require('crypto');
const { MercadoPagoConfig, OAuth } = require('mercadopago');
const LojasMercadoPagoModel = require('../Models/lojasMercadoPagoModel');
const { cifrar, decifrar } = require('../utils/criptografiaToken');
const { registrarErroInterno } = require('../utils/erroInterno');
const { erroDeNegocio } = require('../utils/transacao');
const { COMISSAO_PERCENTUAL } = require('../Config/financeiro');

/*
 * Conexão da conta Mercado Pago do lojista (OAuth), usada no split:
 * a cobrança é criada em nome da loja e a comissão vai para a PetCare.
 */

const VALIDADE_STATE_MS = 10 * 60 * 1000;

const oauthClient = new OAuth(new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
}));

function configuracaoOAuth() {
    const config = {
        clientId: process.env.MP_CLIENT_ID,
        clientSecret: process.env.MP_CLIENT_SECRET,
        redirectUri: process.env.MP_OAUTH_REDIRECT_URI
    };

    if (!config.clientId || !config.clientSecret || !config.redirectUri) {
        throw erroDeNegocio(503, 'A conexão com o Mercado Pago ainda não está disponível.');
    }

    return config;
}

/*
 * O state identifica a loja no retorno do Mercado Pago, que chega sem o login
 * do lojista. É assinado com uma chave própria (derivada do JWT_SECRET) para
 * não poder ser usado como token de login, e expira em 10 minutos.
 */
function chaveState() {
    return crypto.createHmac('sha256', process.env.JWT_SECRET).update('mercadopago-oauth-state').digest();
}

function assinarState(dados) {
    const conteudo = Buffer.from(JSON.stringify(dados)).toString('base64url');
    const assinatura = crypto.createHmac('sha256', chaveState()).update(conteudo).digest('base64url');
    return `${conteudo}.${assinatura}`;
}

function lerState(state) {
    const [conteudo, assinatura] = String(state || '').split('.');

    if (!conteudo || !assinatura) return null;

    const esperada = crypto.createHmac('sha256', chaveState()).update(conteudo).digest();
    const recebida = Buffer.from(assinatura, 'base64url');

    if (recebida.length !== esperada.length || !crypto.timingSafeEqual(recebida, esperada)) {
        return null;
    }

    try {
        const dados = JSON.parse(Buffer.from(conteudo, 'base64url').toString('utf8'));
        if (!Number.isInteger(dados.loja) || !Number.isInteger(dados.usuario) || !(dados.expira > Date.now())) {
            return null;
        }
        return dados;
    } catch {
        return null;
    }
}

/** Monta a URL de autorização do Mercado Pago para a loja do lojista. */
function gerarUrlConexao({ lojaId, usuarioId }) {
    const { clientId, redirectUri } = configuracaoOAuth();

    const state = assinarState({
        loja: lojaId,
        usuario: usuarioId,
        expira: Date.now() + VALIDADE_STATE_MS,
        nonce: crypto.randomBytes(8).toString('hex')
    });

    return oauthClient.getAuthorizationURL({
        options: { client_id: clientId, redirect_uri: redirectUri, state }
    });
}

/** Converte a resposta de token do Mercado Pago no registro cifrado da loja. */
function montarRegistro(resposta) {
    if (!resposta?.access_token || !resposta?.refresh_token || !resposta?.user_id) {
        throw new Error('Resposta OAuth do Mercado Pago incompleta.');
    }

    const segundos = Number(resposta.expires_in) || 0;

    return {
        mp_user_id: String(resposta.user_id),
        access_token_cifrado: cifrar(resposta.access_token),
        refresh_token_cifrado: cifrar(resposta.refresh_token),
        token_expira_em: new Date(Date.now() + segundos * 1000)
    };
}

/**
 * Conclui a conexão no retorno do Mercado Pago: valida o state, confere que a
 * loja ainda pertence ao usuário, troca o código pelos tokens e grava cifrado.
 */
async function concluirConexao({ code, state }) {
    const dados = lerState(state);

    if (!dados) {
        throw erroDeNegocio(400, 'Link de conexão inválido ou expirado. Tente conectar novamente.');
    }

    if (!code) {
        throw erroDeNegocio(400, 'A autorização no Mercado Pago não foi concluída.');
    }

    const pertence = await LojasMercadoPagoModel.lojaPertenceAoUsuario(dados.loja, dados.usuario);

    if (!pertence) {
        throw erroDeNegocio(403, 'Loja não encontrada para este usuário.');
    }

    const { clientId, clientSecret, redirectUri } = configuracaoOAuth();

    const resposta = await oauthClient.create({
        body: {
            client_id: clientId,
            client_secret: clientSecret,
            code: String(code),
            redirect_uri: redirectUri
        }
    });

    await LojasMercadoPagoModel.salvar(dados.loja, montarRegistro(resposta));

    return { lojaId: dados.loja };
}

const MARGEM_RENOVACAO_MS = 7 * 24 * 60 * 60 * 1000;

const LOJA_SEM_PAGAMENTO_ONLINE = 'Esta loja ainda não está recebendo pagamentos online. Tente novamente mais tarde.';

async function renovarToken(lojaId, conta) {
    const { clientId, clientSecret } = configuracaoOAuth();

    const resposta = await oauthClient.refresh({
        body: {
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: decifrar(conta.refresh_token_cifrado)
        }
    });

    await LojasMercadoPagoModel.salvar(lojaId, montarRegistro(resposta));

    return resposta.access_token;
}

/**
 * Access token da loja para cobrar em nome dela. Renova quando faltam menos
 * de 7 dias para expirar; se a renovação falhar, usa o atual enquanto valer.
 * Loja sem conta conectada (ou com a autorização vencida) gera erro 409.
 */
async function obterAccessTokenDaLoja(lojaId) {
    const conta = await LojasMercadoPagoModel.getByLojaId(lojaId);

    if (!conta) throw erroDeNegocio(409, LOJA_SEM_PAGAMENTO_ONLINE);

    const expiraEm = new Date(conta.token_expira_em).getTime();

    if (expiraEm - Date.now() > MARGEM_RENOVACAO_MS) {
        return decifrar(conta.access_token_cifrado);
    }

    try {
        return await renovarToken(lojaId, conta);
    } catch (erro) {
        registrarErroInterno('mercadoPagoOAuthService: renovar token da loja', erro);

        if (expiraEm > Date.now()) return decifrar(conta.access_token_cifrado);

        throw erroDeNegocio(409, LOJA_SEM_PAGAMENTO_ONLINE);
    }
}

/** Loja dona da conta Mercado Pago (usado pelo webhook). */
async function obterContaPorUsuarioMercadoPago(mpUserId) {
    if (mpUserId === undefined || mpUserId === null || mpUserId === '') return null;

    const conta = await LojasMercadoPagoModel.getByMpUserId(String(mpUserId));

    return conta ? { lojaId: conta.loja_id } : null;
}

/** Situação da conexão e taxas da PetCare, sem nenhum dado sensível. */
async function obterStatus(lojaId) {
    const conta = await LojasMercadoPagoModel.getStatus(lojaId);

    if (!conta) return { conectado: false, comissao_percentual: COMISSAO_PERCENTUAL };

    return {
        conectado: true,
        comissao_percentual: COMISSAO_PERCENTUAL,
        conectado_em: conta.conectado_em,
        expirado: new Date(conta.token_expira_em) <= new Date()
    };
}

async function desconectar(lojaId) {
    await LojasMercadoPagoModel.remover(lojaId);
}

module.exports = {
    gerarUrlConexao,
    concluirConexao,
    obterStatus,
    desconectar,
    obterAccessTokenDaLoja,
    obterContaPorUsuarioMercadoPago,
    assinarState,
    lerState
};
