const assert = require('node:assert/strict');
const { AsyncResource } = require('node:async_hooks');
const test = require('node:test');

/*
 * Pool falso que imita o mysql2: os callbacks rodam no contexto assíncrono em
 * que a conexão foi criada (o "socket"), e não no de quem fez a consulta.
 * Foi esse comportamento que fazia as transações perderem a conexão, o commit
 * falhar e o pool travar.
 */
const consultas = [];
const livres = [];
let emUso = 0;
let criadas = 0;

const contextoDoPool = new AsyncResource('pool-falso');
const responder = (contexto, callback, ...args) =>
    setImmediate(() => contexto.runInAsyncScope(callback, null, ...args));

function criarConexao() {
    const contextoDoSocket = new AsyncResource('socket-falso');
    const id = ++criadas;
    const conexao = {
        id,
        query(sql, _valores, callback) {
            consultas.push({ conexao: id, sql });
            responder(contextoDoSocket, callback, null, [{ conexao: id }]);
        },
        beginTransaction: (callback) => responder(contextoDoSocket, callback, null),
        commit: (callback) => responder(contextoDoSocket, callback, null),
        rollback: (callback) => responder(contextoDoSocket, callback, null),
        release() {
            emUso--;
            livres.push(conexao);
        }
    };
    return conexao;
}

const poolFalso = {
    getConnection(callback) {
        const conexao = livres.pop() || contextoDoPool.runInAsyncScope(criarConexao);
        emUso++;
        responder(contextoDoPool, callback, null, conexao);
    },
    query(sql, _valores, callback) {
        consultas.push({ conexao: 'pool', sql });
        responder(contextoDoPool, callback, null, [{ conexao: 'pool' }]);
    }
};

require('mysql2').createPool = () => poolFalso;
const db = require('../db');
const { consultar, transacao } = require('../utils/transacao');

test.beforeEach(() => { consultas.length = 0; });

test('consultas de emTransacao usam a conexão da transação e ela é devolvida', async () => {
    for (let i = 0; i < 20; i++) {
        const resultado = await transacao(async () => {
            const [primeira] = await consultar('SELECT 1');
            const [segunda] = await consultar('SELECT 2');
            return [primeira.conexao, segunda.conexao];
        });
        assert.notEqual(resultado[0], 'pool');
        assert.equal(resultado[0], resultado[1]);
    }

    assert.equal(emUso, 0, 'nenhuma conexão presa');
    assert.equal(criadas, 1, 'a mesma conexão é reaproveitada');
});

test('callbacks aninhados continuam na transação; depois do commit, voltam ao pool', async () => {
    const conexoes = await new Promise((resolve, reject) => db.beginTransaction((erro) => {
        if (erro) return reject(erro);
        db.query('SELECT 1', (e1, r1) => db.query('SELECT 2', (e2, r2) => db.commit((e3) => {
            if (e1 || e2 || e3) return reject(e1 || e2 || e3);
            db.query('SELECT 3', (e4, r3) => (e4 ? reject(e4) : resolve([r1[0].conexao, r2[0].conexao, r3[0].conexao])));
        })));
    }));

    assert.notEqual(conexoes[0], 'pool');
    assert.equal(conexoes[0], conexoes[1]);
    assert.equal(conexoes[2], 'pool');
    assert.equal(emUso, 0);
});

test('falha no trabalho desfaz a transação e devolve a conexão', async () => {
    await assert.rejects(
        transacao(async () => {
            await consultar('UPDATE algo');
            throw new Error('falhou no meio');
        }),
        /falhou no meio/
    );

    assert.equal(emUso, 0);
    assert.notEqual(consultas[0].conexao, 'pool');
});
