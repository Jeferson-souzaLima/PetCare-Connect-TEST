const { aceitarToken } = require('./sessaoToken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Sem token: usuário visitante, continua normalmente
    if (!authHeader) {
        return next();
    }

    // Se enviou Authorization, precisa estar no formato esperado
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            mensagem: 'Token inválido.'
        });
    }

    // Mantém o mesmo padrão do authMiddleware existente
    return aceitarToken(authHeader.split(' ')[1], req, res, next);
};