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
function aceitarToken(token, req, res, next) {
    let decoded;
    try {
        decoded = verificar(token);
    } catch {
        return res.status(401).json({ mensagem: 'Token inválido.' });
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

module.exports = { aceitarToken };
