const db = require('../db');
const emailService = require('./emailService');
const { gerarTokenConfirmacao } = require('../utils/tokenConfirmacaoEmail');
const { registrarErroInterno } = require('../utils/erroInterno');

const consultar = (sql, valores) => new Promise((resolve, reject) =>
    db.query(sql, valores, (err, resultado) => (err ? reject(err) : resolve(resultado))));

/*
 * Cadastro com e-mail que já tem conta (M5): a API responde como se fosse um
 * cadastro novo e quem recebe a notícia é o dono do e-mail.
 * - Conta ainda não confirmada: recebe um novo link de confirmação.
 * - Conta confirmada: recebe um aviso de que houve a tentativa.
 * Falhas só são registradas no log: a resposta ao cadastro não pode mudar.
 */
async function notificarCadastroExistente(email) {
    try {
        const [usuario] = await consultar('SELECT id, email_verificado FROM usuarios WHERE email = ? LIMIT 1', [email]);
        if (!usuario) return;

        if (usuario.email_verificado) {
            await emailService.enviarAvisoCadastroExistente(email);
            return;
        }

        const { token, tokenHash } = gerarTokenConfirmacao();
        await consultar(
            `UPDATE usuarios
             SET email_verificacao_token_hash = ?, email_verificacao_expira_em = DATE_ADD(NOW(), INTERVAL 24 HOUR)
             WHERE id = ? AND email_verificado = 0`,
            [tokenHash, usuario.id]
        );
        await emailService.enviarEmailConfirmacao(email, token);
    } catch (erro) {
        registrarErroInterno('cadastroExistenteService.notificarCadastroExistente', erro);
    }
}

module.exports = { notificarCadastroExistente };
