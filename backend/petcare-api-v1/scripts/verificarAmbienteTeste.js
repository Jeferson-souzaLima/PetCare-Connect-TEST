/*
 * Confere o ambiente de teste local: a trava (nada de produção), a conexão SSL da API com o MySQL
 * local (o mesmo db.js da API) e quantas tabelas e registros existem.
 * Uso: npm run teste:verificar   (lê .env.teste)
 */
const { exigirAmbienteTeste } = require('./ambienteTeste');

async function main() {
    exigirAmbienteTeste();
    const db = require('../db');
    const consultar = (sql, valores) => new Promise((ok, falha) => db.query(sql, valores, (e, r) => (e ? falha(e) : ok(r))));
    try {
        const [ssl] = await consultar("SHOW SESSION STATUS LIKE 'Ssl_cipher'");
        const tabelas = await consultar("SELECT table_name AS nome FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'");
        let registros = 0;
        for (const { nome } of tabelas) registros += (await consultar('SELECT COUNT(*) AS n FROM ??', [nome]))[0].n;
        console.log(`Conectado ao banco de teste ${process.env.DB_NAME} em ${process.env.DB_HOST}:${process.env.DB_PORT} (SSL: ${ssl?.Value || 'não'}).`);
        console.log(`${tabelas.length} tabelas, ${registros} registros.`);
    } finally {
        db.end(() => {});
    }
}

main().catch((erro) => {
    console.error(erro.message);
    process.exit(1);
});
