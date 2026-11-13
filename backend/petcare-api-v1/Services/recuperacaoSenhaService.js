const bcrypt = require('bcrypt');
const emailService = require('./emailService');
const { consultar, erroDeNegocio } = require('../utils/transacao');
const { gerarTokenConfirmacao, hashTokenConfirmacao } = require('../utils/tokenConfirmacaoEmail');
const { registrarErroInterno } = require('../utils/erroInterno');
const { CUSTO_BCRYPT } = require('../Config/senha');

const VALIDADE_LINK_MINUTOS = 60;

/*
 * Gera o link de redefinição e envia por e-mail, se houver conta com o
 * e-mail. Roda depois da resposta à requisição (que é sempre a mesma),
 * então falhas só vão para o log.
 */
async function solicitarRedefinicao(email) {
    try {
        const [usuario] = await consultar('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [email]);
        if (!usuario) return;

        const { token, tokenHash } = gerarTokenConfirmacao();
        await consultar(
            `UPDATE usuarios
             SET senha_reset_token_hash = ?, senha_reset_expira_em = DATE_ADD(NOW(), INTERVAL ${VALIDADE_LINK_MINUTOS} MINUTE)
             WHERE id = ?`,
            [tokenHash, usuario.id]
        );
        await emailService.enviarEmailRedefinicaoSenha(email, token, VALIDADE_LINK_MINUTOS);
    } catch (erro) {
        registrarErroInterno('recuperacaoSenhaService.solicitarRedefinicao', erro);
    }
}

/*
 * Troca a senha se o link for válido. O link vale uma vez só. Como só o dono
 * do e-mail recebe o link, a conta também fica com o e-mail confirmado.
 */
async function redefinirSenha(token, novaSenha) {
    const senhaHash = await bcrypt.hash(novaSenha, CUSTO_BCRYPT);

    const resultado = await consultar(
        `UPDATE usuarios
         SET senha_hash = ?,
             senha_reset_token_hash = NULL,
             senha_reset_expira_em = NULL,
             email_verificado = 1,
             email_verificacao_token_hash = NULL,
             email_verificacao_expira_em = NULL
         WHERE senha_reset_token_hash = ?
           AND senha_reset_expira_em > NOW()`,
        [senhaHash, hashTokenConfirmacao(token)]
    );

    if (resultado.affectedRows === 0) {
        throw erroDeNegocio(400, 'Link inválido, expirado ou já utilizado. Solicite um novo.');
    }
}

module.exports = { solicitarRedefinicao, redefinirSenha, VALIDADE_LINK_MINUTOS };
