const { aceitarToken } = require('./sessaoToken');

// Middleware de verificação do token
module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ mensagem: 'Token não fornecido.' });
    }

    // req.usuario fica com { id, tipo, loja_id }
    return aceitarToken(authHeader.split(' ')[1], req, res, next);
};