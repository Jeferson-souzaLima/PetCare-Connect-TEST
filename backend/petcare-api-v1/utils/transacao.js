const db = require('../db');

/** db.query em forma de Promise. */
const consultar = (sql, valores) => new Promise((resolve, reject) =>
    db.query(sql, valores, (err, resultado) => (err ? reject(err) : resolve(resultado))));

/*
 * Executa trabalho() numa transação e chama callback(err, resultado).
 * As consultas precisam começar dentro do callback de beginTransaction:
 * é ali que db.js associa a conexão da transação (AsyncLocalStorage).
 */
function emTransacao(trabalho, callback) {
    db.beginTransaction((erro) => {
        if (erro) return callback(erro);
        trabalho().then(
            (resultado) => db.commit((erroCommit) =>
                (erroCommit ? db.rollback(() => callback(erroCommit)) : callback(null, resultado))),
            (falha) => db.rollback(() => callback(falha))
        );
    });
}

/** Erro de regra de negócio com status HTTP 4xx e mensagem para o usuário. */
function erroDeNegocio(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

module.exports = { consultar, emTransacao, erroDeNegocio };
