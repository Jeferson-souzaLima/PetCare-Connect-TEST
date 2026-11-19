const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const { AsyncLocalStorage, AsyncResource } = require('async_hooks');

require('dotenv').config();

const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length) {
    throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missingEnvVars.join(', ')}`);
}

const dbPort = Number(process.env.DB_PORT || 3306);
if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) {
    throw new Error('DB_PORT deve ser um número de porta válido.');
}

const caPath = process.env.DB_SSL_CA_PATH
    ? path.resolve(process.env.DB_SSL_CA_PATH)
    : path.join(__dirname, 'ca.pem');
if (!fs.existsSync(caPath)) {
    throw new Error('Certificado CA do banco não encontrado. Configure DB_SSL_CA_PATH ou inclua ca.pem.');
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: dbPort,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    ssl: {
        ca: fs.readFileSync(caPath),
        rejectUnauthorized: true
    }
});

/*
 * Conexão da transação em andamento, guardada por fluxo assíncrono.
 *
 * O mysql2 executa os callbacks no contexto do socket da conexão, e não no de
 * quem fez a consulta. Por isso todo callback é devolvido ao contexto de quem
 * chamou (AsyncResource). Sem isso, as consultas de uma transação caíam no
 * pool, o commit falhava ("Nenhuma transação ativa") e a conexão nunca era
 * devolvida, até o pool inteiro travar.
 */
const transactionContext = new AsyncLocalStorage();

const noContextoDeQuemChamou = (callback) =>
    (typeof callback === 'function' ? AsyncResource.bind(callback) : callback);

/** Executa callback no contexto capturado, já sem a transação (conexão devolvida). */
const foraDaTransacao = (contexto, callback, ...args) =>
    contexto.runInAsyncScope(() => transactionContext.exit(() => callback?.(...args)));

const db = {
    query(sql, values, callback) {
        if (typeof values === 'function') {
            callback = values;
            values = undefined;
        }
        const connection = transactionContext.getStore();
        return (connection || pool).query(sql, values, noContextoDeQuemChamou(callback));
    },
    beginTransaction(callback) {
        const contexto = new AsyncResource('db.beginTransaction');
        pool.getConnection((acquireError, connection) => {
            if (acquireError) return contexto.runInAsyncScope(callback, null, acquireError);
            connection.beginTransaction((error) => {
                if (error) {
                    connection.release();
                    return contexto.runInAsyncScope(callback, null, error);
                }
                contexto.runInAsyncScope(() => transactionContext.run(connection, () => callback(null)));
            });
        });
    },
    commit(callback) {
        const connection = transactionContext.getStore();
        if (!connection) return callback(new Error('Nenhuma transação ativa.'));
        const contexto = new AsyncResource('db.commit');
        connection.commit((error) => {
            // Com erro, a transação continua ativa para quem chamou poder desfazê-la.
            if (error) return contexto.runInAsyncScope(callback, null, error);
            connection.release();
            foraDaTransacao(contexto, callback, null);
        });
    },
    rollback(callback) {
        const connection = transactionContext.getStore();
        if (!connection) return callback?.(new Error('Nenhuma transação ativa.'));
        const contexto = new AsyncResource('db.rollback');
        connection.rollback((error) => {
            connection.release();
            foraDaTransacao(contexto, callback, error);
        });
    },
    ping(callback) {
        callback = noContextoDeQuemChamou(callback);
        pool.getConnection((error, connection) => {
            if (error) return callback(error);
            connection.ping((pingError) => {
                connection.release();
                callback(pingError);
            });
        });
    },
    end(callback) {
        pool.end(callback);
    }
};

module.exports = db;
