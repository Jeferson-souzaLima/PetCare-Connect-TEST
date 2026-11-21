const { verificar } = require('../Config/jwt');
const { consultar } = require('../utils/transacao');
const { responderErroInterno } = require('../utils/erroInterno');

/*
 * Valida o token e preenche req.usuario.
 *
 * Tokens de "manter conectado" (30 dias) trazem a versão da sessão (sv). Ela
 * precisa ser igual à da conta: redefinir a senha ou excluir a conta aumenta
 * a versão e derruba esses logins. Tokens comuns (1 dia) não consultam o banco.
 */
/*
 * Admin gerenciando uma loja (token com admin_id, emitido em
 * POST /admin/lojas/:id/gerenciar): só as áreas da loja. Ficam de fora a conta
 * Mercado Pago e os pagamentos (dados bancários), a conta pessoal do lojista
 * (senha, e-mail, exclusão) e a exclusão da loja.
 */
const AREAS_DO_GERENCIAMENTO = ['/lojas', '/produtos', '/servicos', '/pedidos', '/agenda-lojista', '/agendamentos', '/relatorios', '/busca', '/cep', '/geolocalizacao'];

function permitidoNoGerenciamento(req) {
    const caminho = String(req.originalUrl || '').split('?')[0];
    const naArea = AREAS_DO_GERENCIAMENTO.some((area) => caminho === area || caminho.startsWith(`${area}/`));
    const excluirLoja = req.method === 'DELETE' && caminho.startsWith('/lojas/');
    return naArea && !excluirLoja;
}

function aceitarToken(token, req, res, next) {
    let decoded;
    try {
        decoded = verificar(token);
    } catch {
        return res.status(401).json({ mensagem: 'Token inválido.' });
    }

    if (decoded.admin_id !== undefined && !permitidoNoGerenciamento(req)) {
        return res.status(403).json({ mensagem: 'Esta área não fica disponível quando o administrador gerencia a loja.' });
    }

    if (decoded.sv === undefined) {
        req.usuario = decoded;
        return next();
    }

    return consultar('SELECT sessao_versao FROM usuarios WHERE id = ?', [decoded.id])
        .then(([conta]) => {
            if (!conta || Number(conta.sessao_versao) !== Number(decoded.sv)) {
                return res.status(401).json({ mensagem: 'Sua sessão foi encerrada. Entre novamente.' });
            }
            req.usuario = decoded;
            return next();
        })
        .catch((erro) => responderErroInterno(res, erro, 'sessaoToken.aceitarToken'));
}

module.exports = { aceitarToken, permitidoNoGerenciamento };
