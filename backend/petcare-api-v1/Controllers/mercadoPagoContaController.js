const MercadoPagoOAuthService = require('../Services/mercadoPagoOAuthService');
const { responderErroDoServico, registrarErroInterno } = require('../utils/erroInterno');

/*
 * Conta Mercado Pago do lojista. As rotas autenticadas usam a loja do token
 * (req.usuario.loja_id), nunca um ID enviado pelo frontend.
 */

const PAGINA_RETORNO = '/lojista/perfil';

function urlRetornoFrontend(resultado) {
    const base = process.env.APP_URL || 'http://localhost:5173';
    return `${base}${PAGINA_RETORNO}?mercadopago=${resultado}`;
}

function exigirLoja(req, res) {
    if (!req.usuario.loja_id) {
        res.status(400).json({ mensagem: 'Cadastre sua loja antes de conectar o Mercado Pago.' });
        return null;
    }
    return req.usuario.loja_id;
}

exports.status = async (req, res) => {
    const lojaId = exigirLoja(req, res);
    if (!lojaId) return;

    try {
        return res.json(await MercadoPagoOAuthService.obterStatus(lojaId));
    } catch (erro) {
        return responderErroDoServico(res, erro, 'mercadoPagoContaController.status', 'Não foi possível consultar a conta Mercado Pago.');
    }
};

exports.conectar = (req, res) => {
    const lojaId = exigirLoja(req, res);
    if (!lojaId) return;

    try {
        const url = MercadoPagoOAuthService.gerarUrlConexao({ lojaId, usuarioId: req.usuario.id });
        return res.json({ url });
    } catch (erro) {
        return responderErroDoServico(res, erro, 'mercadoPagoContaController.conectar', 'Não foi possível iniciar a conexão com o Mercado Pago.');
    }
};

exports.desconectar = async (req, res) => {
    const lojaId = exigirLoja(req, res);
    if (!lojaId) return;

    try {
        await MercadoPagoOAuthService.desconectar(lojaId);
        return res.status(204).end();
    } catch (erro) {
        return responderErroDoServico(res, erro, 'mercadoPagoContaController.desconectar', 'Não foi possível desconectar a conta Mercado Pago.');
    }
};

/*
 * Retorno do Mercado Pago após o lojista autorizar (ou recusar).
 * É aberto pelo navegador, sem login: a loja vem do state assinado.
 * Sempre redireciona para o painel com o resultado.
 */
exports.retorno = async (req, res) => {
    try {
        await MercadoPagoOAuthService.concluirConexao({
            code: req.query.code,
            state: req.query.state
        });
        return res.redirect(urlRetornoFrontend('conectado'));
    } catch (erro) {
        if (!(Number.isInteger(erro?.status) && erro.status < 500)) {
            registrarErroInterno('mercadoPagoContaController.retorno', erro);
        }
        return res.redirect(urlRetornoFrontend('erro'));
    }
};
