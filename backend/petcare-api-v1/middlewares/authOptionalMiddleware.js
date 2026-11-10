const { verificar } = require('../Config/jwt');

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

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verificar(token);

        // Mantém o mesmo padrão do authMiddleware existente
        req.usuario = decoded;

        next();
    } catch (err) {
        return res.status(401).json({
            mensagem: 'Token inválido.'
        });
    }
};