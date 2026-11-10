const multer = require('multer');
const { responderErroDoServico, MENSAGEM_ERRO_INTERNO } = require('../utils/erroInterno');

const MENSAGENS_UPLOAD = {
    LIMIT_FILE_SIZE: 'A imagem deve ter no máximo 5 MB.',
    LIMIT_FILE_COUNT: 'Envie no máximo 10 imagens por vez.',
    LIMIT_UNEXPECTED_FILE: 'Campo de arquivo inesperado.'
};

/*
 * Tratador de erros final: erros que escapam das rotas (upload recusado,
 * JSON malformado) viram resposta JSON com mensagem clara, e não a página
 * padrão do Express. O resto vira 500 genérico, com detalhe só no log.
 */
// eslint-disable-next-line no-unused-vars
function tratarErros(err, req, res, _next) {
    if (err instanceof multer.MulterError) {
        const mensagem = MENSAGENS_UPLOAD[err.code] || 'Não foi possível processar o arquivo enviado.';
        return res.status(400).json({ mensagem, erro: mensagem });
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ mensagem: 'Corpo da requisição inválido.' });
    }

    if (err.type === 'entity.too.large') {
        return res.status(413).json({ mensagem: 'Requisição grande demais.' });
    }

    // Erros 4xx de negócio (ex.: tipo de arquivo recusado) repassam a mensagem; o resto vira 500.
    return responderErroDoServico(res, err, `tratarErros ${req.method} ${req.path}`, MENSAGEM_ERRO_INTERNO);
}

module.exports = tratarErros;
