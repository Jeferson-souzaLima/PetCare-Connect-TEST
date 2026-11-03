const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../db');
const { enviarEmailConfirmacao } = require('../Services/emailService');
const { responderErroInterno } = require('../utils/erroInterno');

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

function gerarTokenConfirmacao() {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    return { token, tokenHash };
}

exports.register = (req, res) => {
    const { nome, email, senha, confirmacaoSenha } = req.body;
    const nomeNormalizado = typeof nome === 'string' ? nome.trim() : '';
    const emailNormalizado = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!nomeNormalizado || !emailNormalizado || !senha || !confirmacaoSenha) {
        return res.status(400).json({ mensagem: 'Nome, e-mail, senha e confirmação de senha são obrigatórios.' });
    }

    if (nomeNormalizado.length > 100 || !EMAIL_REGEX.test(emailNormalizado)) {
        return res.status(400).json({ mensagem: 'Informe nome e e-mail válidos.' });
    }

    if (senha.length < 8) {
        return res.status(400).json({ mensagem: 'A senha deve ter pelo menos 8 caracteres.' });
    }

    if (senha !== confirmacaoSenha) {
        return res.status(400).json({ mensagem: 'A confirmação de senha não confere.' });
    }

    db.query('SELECT id FROM usuarios WHERE email = ?', [emailNormalizado], (selectErr, users) => {
        if (selectErr) return responderErroInterno(res, selectErr, "emailConfirmationController - consulta de usuário");
        if (users.length > 0) return res.status(409).json({ mensagem: 'E-mail já cadastrado.' });

        bcrypt.hash(senha, 10, (hashErr, senhaHash) => {
            if (hashErr) return responderErroInterno(res, hashErr, "emailConfirmationController.register - hash da senha");

            const { token, tokenHash } = gerarTokenConfirmacao();
            const sql = `INSERT INTO usuarios
                (nome, email, senha_hash, tipo, email_verificado, email_verificacao_token_hash, email_verificacao_expira_em)
                VALUES (?, ?, ?, 'cliente', 0, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`;

            db.query(sql, [nomeNormalizado, emailNormalizado, senhaHash, tokenHash], (insertErr) => {
                if (insertErr) return responderErroInterno(res, insertErr, "emailConfirmationController.register - inserção do usuário");

                enviarEmailConfirmacao(emailNormalizado, token)
                    .then(() => res.status(201).json({
                        mensagem: 'Cadastro realizado. Verifique seu e-mail para ativar a conta.'
                    }))
                    .catch((emailErr) => {
                        console.error('Erro ao enviar e-mail de confirmação:', emailErr);
                        res.status(503).json({
                            mensagem: 'Conta criada, mas não foi possível enviar o e-mail. Solicite um novo link de confirmação.'
                        });
                    });
            });
        });
    });
};

exports.confirmarEmail = (req, res) => {
    const { token } = req.query;

    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
        return res.status(400).json({ mensagem: 'Link de confirmação inválido.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const sql = `UPDATE usuarios
        SET email_verificado = 1,
            email_verificacao_token_hash = NULL,
            email_verificacao_expira_em = NULL
        WHERE email_verificacao_token_hash = ?
          AND email_verificacao_expira_em > NOW()
          AND email_verificado = 0`;

    db.query(sql, [tokenHash], (err, result) => {
        if (err) return responderErroInterno(res, err, "emailConfirmationController.confirmarEmail");
        if (result.affectedRows === 0) {
            return res.status(400).json({ mensagem: 'Link inválido, expirado ou já utilizado.' });
        }

        return res.json({ mensagem: 'E-mail confirmado com sucesso. Você já pode entrar.' });
    });
};

exports.reenviarConfirmacao = (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ mensagem: 'Informe um e-mail válido.' });
    }

    db.query(
        'SELECT id, email_verificado FROM usuarios WHERE email = ? AND tipo = ?',
        [email, 'cliente'],
        (selectErr, users) => {
            if (selectErr) return responderErroInterno(res, selectErr, "emailConfirmationController - consulta de usuário");
            if (users.length === 0) {
                return res.json({ mensagem: 'Se houver uma conta pendente para este e-mail, enviaremos um novo link.' });
            }
            if (users[0].email_verificado) {
                return res.json({ mensagem: 'Este e-mail já foi confirmado. Você já pode entrar.' });
            }

            const { token, tokenHash } = gerarTokenConfirmacao();
            db.query(
                `UPDATE usuarios
                 SET email_verificacao_token_hash = ?,
                     email_verificacao_expira_em = DATE_ADD(NOW(), INTERVAL 24 HOUR)
                 WHERE id = ?`,
                [tokenHash, users[0].id],
                (updateErr) => {
                    if (updateErr) return responderErroInterno(res, updateErr, "emailConfirmationController.reenviarConfirmacao - atualização do token");

                    enviarEmailConfirmacao(email, token)
                        .then(() => res.json({ mensagem: 'Enviamos um novo link de confirmação para seu e-mail.' }))
                        .catch((emailErr) => {
                            console.error('Erro ao reenviar confirmação de e-mail:', emailErr);
                            res.status(503).json({ mensagem: 'Não foi possível enviar o e-mail agora. Tente novamente mais tarde.' });
                        });
                }
            );
        }
    );
};

exports.validarEmailConfirmado = (req, res, next) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!EMAIL_REGEX.test(email)) return next();

    db.query(
        'SELECT email_verificado FROM usuarios WHERE email = ? AND tipo = ?',
        [email, 'cliente'],
        (err, users) => {
            if (err) return responderErroInterno(res, err, "emailConfirmationController.validarEmailConfirmado");
            if (users.length > 0 && !users[0].email_verificado) {
                return res.status(403).json({
                    codigo: 'EMAIL_NAO_VERIFICADO',
                    mensagem: 'Confirme seu e-mail antes de entrar.'
                });
            }

            return next();
        }
    );
};
