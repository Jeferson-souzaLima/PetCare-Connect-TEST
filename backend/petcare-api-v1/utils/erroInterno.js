const MENSAGEM_ERRO_INTERNO = 'Erro interno do servidor. Tente novamente em instantes.';

/**
 * Resumo do erro seguro para log.
 * Erros do MySQL podem trazer o SQL e valores (e-mail, nome) em `sql`,
 * `sqlMessage` e `message`; deles registramos só código, errno e sqlState.
 */
function resumirErro(err) {
    if (!err || typeof err !== 'object') {
        return { tipo: typeof err };
    }

    const ehErroDeBanco = Boolean(err.sql || err.sqlMessage || err.sqlState);

    if (ehErroDeBanco) {
        return { codigo: err.code, errno: err.errno, sqlState: err.sqlState };
    }

    // Erros do nodemailer trazem o e-mail do destinatário em message/response/rejected.
    const ehErroDeSmtp = Boolean(err.responseCode || err.command || err.rejected);

    if (ehErroDeSmtp) {
        return { nome: err.name, codigo: err.code, comando: err.command, codigoResposta: err.responseCode };
    }

    return { nome: err.name, codigo: err.code, mensagem: err.message, stack: err.stack };
}

function registrarErroInterno(contexto, err) {
    console.error(`[erro interno] ${contexto}`, resumirErro(err));
}

/** Responde 500 com mensagem genérica e registra o detalhe (sem dados sensíveis) no log. */
function responderErroInterno(res, err, contexto) {
    registrarErroInterno(contexto, err);

    return res.status(500).json({
        mensagem: MENSAGEM_ERRO_INTERNO,
        message: MENSAGEM_ERRO_INTERNO
    });
}

/**
 * Para erros lançados pelos services: os que têm `status` 4xx carregam uma
 * mensagem de negócio pensada para o usuário e são repassados; os demais
 * viram 500 com a mensagem padrão informada.
 */
function responderErroDoServico(res, erro, contexto, mensagemPadrao) {
    if (Number.isInteger(erro?.status) && erro.status >= 400 && erro.status < 500) {
        return res.status(erro.status).json({ mensagem: erro.message });
    }

    registrarErroInterno(contexto, erro);

    return res.status(500).json({ mensagem: mensagemPadrao });
}

module.exports = {
    MENSAGEM_ERRO_INTERNO,
    resumirErro,
    registrarErroInterno,
    responderErroInterno,
    responderErroDoServico
};
