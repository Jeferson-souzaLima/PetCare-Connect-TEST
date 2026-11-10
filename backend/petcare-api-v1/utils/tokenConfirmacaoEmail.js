const crypto = require('crypto');

/** Hash guardado no banco: o token em si só existe no link enviado por e-mail. */
const hashTokenConfirmacao = (token) => crypto.createHash('sha256').update(token).digest('hex');

function gerarTokenConfirmacao() {
    const token = crypto.randomBytes(32).toString('hex');
    return { token, tokenHash: hashTokenConfirmacao(token) };
}

module.exports = { gerarTokenConfirmacao, hashTokenConfirmacao };
