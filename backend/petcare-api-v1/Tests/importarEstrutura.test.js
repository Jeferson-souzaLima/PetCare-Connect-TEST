const test = require('node:test');
const assert = require('node:assert/strict');
const { validarEstrutura, prepararEstrutura } = require('../../../database/teste/importar-estrutura');

const CABECALHO = `-- MySQL dump 10.13
SET @@SESSION.SQL_LOG_BIN= 0;
SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'a1b2:1-100,
c3d4:1-20';
DROP TABLE IF EXISTS \`lojas\`;
CREATE TABLE \`lojas\` (\`id\` int NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`)) ENGINE=InnoDB;
`;
const GATILHO = `/*!50003 CREATE*/ /*!50017 DEFINER=\`avnadmin\`@\`%\`*/ /*!50003 TRIGGER \`t\` AFTER INSERT ON \`lojas\` FOR EACH ROW BEGIN
    INSERT INTO log (loja_id) VALUES (NEW.id);
END */;;
`;

test('estrutura sem registros é aceita (gatilho com INSERT no corpo não conta como dado)', () => {
    const r = validarEstrutura(CABECALHO + GATILHO);
    assert.deepEqual(r.erros, []);
    assert.equal(r.tabelas, 1);
    assert.match(r.avisos.join(' '), /DEFINER/);
});

test('arquivo com registros, sem tabelas ou trocando de banco é recusado', () => {
    assert.match(validarEstrutura(`${CABECALHO}LOCK TABLES \`lojas\` WRITE;\nINSERT INTO \`lojas\` VALUES (1);\nUNLOCK TABLES;\n`).erros.join(' '), /registros/);
    assert.match(validarEstrutura('INSERT INTO `lojas` VALUES (1);').erros.join(' '), /registros/);
    assert.match(validarEstrutura('REPLACE INTO `lojas` VALUES (1);').erros.join(' '), /registros/);
    assert.match(validarEstrutura('-- vazio').erros.join(' '), /CREATE TABLE/);
    assert.match(validarEstrutura(`CREATE DATABASE x;\nUSE \`x\`;\n${CABECALHO}`).erros.join(' '), /--databases/);
});

test('preparação tira as linhas de GTID e SQL_LOG_BIN (exclusivas do servidor de origem)', () => {
    const sql = prepararEstrutura(CABECALHO + GATILHO);
    assert.doesNotMatch(sql, /GTID_PURGED|SQL_LOG_BIN/);
    assert.match(sql, /CREATE TABLE `lojas`/);
    assert.match(sql, /INSERT INTO log/);
});
