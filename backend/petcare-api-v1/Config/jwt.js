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

// Sessão comum: 1 dia. "Manter conectado": 30 dias (o token leva a versão da sessão).
const DURACAO_SESSAO = '1d';
const DURACAO_MANTER_CONECTADO = '30d';

const assinar = (payload, { manterConectado = false } = {}) => jwt.sign(payload, secret, {
    algorithm: ALGORITMO,
    expiresIn: manterConectado ? DURACAO_MANTER_CONECTADO : DURACAO_SESSAO
});
// Admin gerenciando uma loja: acesso curto, sem "manter conectado".
const DURACAO_GERENCIAMENTO = '2h';
const assinarGerenciamento = (payload) => jwt.sign(payload, secret, { algorithm: ALGORITMO, expiresIn: DURACAO_GERENCIAMENTO });

const verificar = (token) => jwt.verify(token, secret, { algorithms: [ALGORITMO] });

module.exports = { assinar, assinarGerenciamento, verificar };
