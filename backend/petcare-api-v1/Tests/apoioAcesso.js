// Apoio aos testes de controle de acesso: sobe as rotas reais num servidor
// local, sem banco (db.query é substituído em cada teste).
const express = require('express');
const jwt = require('jsonwebtoken');

for (const nome of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET']) {
    process.env[nome] = process.env[nome] || (nome === 'JWT_SECRET' ? 'segredo-de-teste-com-mais-de-32-caracteres' : 'test');
}

async function comServidor(prefixo, rotas, fn) {
    const app = express();
    app.use(express.json());
    app.use(prefixo, rotas);
    const server = app.listen(0);
    try {
        return await fn(`http://127.0.0.1:${server.address().port}`);
    } finally {
        server.close();
    }
}

const token = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5m' });

const USUARIOS = {
    cliente: { id: 10, tipo: 'cliente' },
    outroCliente: { id: 11, tipo: 'cliente' },
    lojista: { id: 20, tipo: 'lojista', loja_id: 2 },
    outroLojista: { id: 30, tipo: 'lojista', loja_id: 3 },
    admin: { id: 1, tipo: 'admin' }
};

async function pedir(base, metodo, rota, usuario, corpo) {
    const headers = { 'Content-Type': 'application/json' };
    if (usuario) headers.Authorization = `Bearer ${token(usuario)}`;
    const resposta = await fetch(`${base}${rota}`, {
        method: metodo,
        headers,
        body: corpo ? JSON.stringify(corpo) : undefined
    });
    let body = null;
    try { body = await resposta.json(); } catch { /* sem corpo */ }
    return { status: resposta.status, body };
}

/**
 * Substitui db.query por um roteador de SQL: cada regra é [regex, resposta],
 * onde resposta é um valor ou função (values) => valor. Registra as consultas.
 */
function simularBanco(t, db, regras) {
    const consultas = [];
    t.mock.method(db, 'query', (sql, values, cb) => {
        if (typeof values === 'function') { cb = values; values = []; }
        consultas.push({ sql: sql.replace(/\s+/g, ' ').trim(), values });
        const regra = regras.find(([re]) => re.test(sql));
        if (!regra) return cb(new Error(`SQL inesperado no teste: ${sql}`));
        const resposta = typeof regra[1] === 'function' ? regra[1](values) : regra[1];
        return cb(null, resposta);
    });
    // Transações: registradas como BEGIN/COMMIT/ROLLBACK, sem conexão real.
    t.mock.method(db, 'beginTransaction', (cb) => { consultas.push({ sql: 'BEGIN' }); cb(null); });
    t.mock.method(db, 'commit', (cb) => { consultas.push({ sql: 'COMMIT' }); cb(null); });
    t.mock.method(db, 'rollback', (cb) => { consultas.push({ sql: 'ROLLBACK' }); cb?.(null); });
    return consultas;
}

module.exports = { comServidor, token, pedir, simularBanco, USUARIOS };
