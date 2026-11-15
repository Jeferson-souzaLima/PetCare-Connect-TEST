const RecuperacaoSenhaService = require('../Services/recuperacaoSenhaService');
const { normalizarEmail, emailValido, erroDaSenha } = require('../utils/validacaoUsuario');
const { responderErroDoServico } = require('../utils/erroInterno');

// Mesma resposta exista ou não a conta, para não revelar quais e-mails estão cadastrados.
const MENSAGEM_SOLICITACAO = 'Se houver uma conta com este e-mail, enviaremos um link para criar uma nova senha.';

exports.solicitar = (req, res) => {
    const email = normalizarEmail(req.body?.email);

    if (!emailValido(email)) {
        return res.status(400).json({ mensagem: 'Informe um e-mail válido.' });
    }

    // Responde antes de consultar o banco: o tempo de resposta não revela se a conta existe.
    res.json({ mensagem: MENSAGEM_SOLICITACAO });
    RecuperacaoSenhaService.solicitarRedefinicao(email);
};

exports.redefinir = async (req, res) => {
    const { token, senha, confirmacaoSenha } = req.body || {};

    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
        return res.status(400).json({ mensagem: 'Link inválido. Solicite um novo.' });
    }

    const erroSenha = erroDaSenha(senha, confirmacaoSenha);
    if (erroSenha) return res.status(400).json({ mensagem: erroSenha });

    try {
        await RecuperacaoSenhaService.redefinirSenha(token, senha);
        return res.json({ mensagem: 'Senha alterada. Você já pode entrar com a nova senha.' });
    } catch (erro) {
        return responderErroDoServico(res, erro, 'recuperacaoSenhaController.redefinir', 'Não foi possível alterar a senha.');
    }
};
