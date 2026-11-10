const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;

if (!secret) {
    throw new Error('A variável de ambiente JWT_SECRET é obrigatória.');
}

// Segredo curto pode ser descoberto por força bruta e permitir forjar tokens (B2).
const TAMANHO_MINIMO_SEGREDO = 32;

if (secret.length < TAMANHO_MINIMO_SEGREDO) {
    throw new Error(`JWT_SECRET deve ter pelo menos ${TAMANHO_MINIMO_SEGREDO} caracteres.`);
}

// Algoritmo fixo na assinatura e na verificação: o token não escolhe o algoritmo.
const ALGORITMO = 'HS256';

const assinar = (payload) => jwt.sign(payload, secret, { algorithm: ALGORITMO, expiresIn: '1d' });
const verificar = (token) => jwt.verify(token, secret, { algorithms: [ALGORITMO] });

module.exports = { assinar, verificar };
