const { verificar } = require('../Config/jwt');

// Middleware de verificação do token
module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ mensagem: 'Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verificar(token);
        req.usuario = decoded; // Aqui fica { id, tipo, loja_id }
        next();
    } catch (err) {
        res.status(401).json({ mensagem: 'Token inválido.' });
    }
};