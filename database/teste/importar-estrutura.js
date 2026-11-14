#!/usr/bin/env node
/*
 * Importa no MySQL local de teste (docker-compose desta pasta) a ESTRUTURA exportada da produção
 * com `mysqldump --no-data`. Recusa o arquivo se ele tiver registros e, depois de importar,
 * confere que todas as tabelas estão vazias.
 *
 * Uso (na raiz do repositório):  node database/teste/importar-estrutura.js database/teste/estrutura.sql
 * O alvo é sempre o container "mysql" deste docker-compose: o script não usa nenhuma credencial remota.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const PASTA = __dirname;
const COMPOSE = ['compose', '-f', path.join(PASTA, 'docker-compose.yml')];

/** { erros, avisos, tabelas } do conteúdo do arquivo exportado. */
function validarEstrutura(sql) {
    const erros = [];
    const avisos = [];
    // Formato dos dados do mysqldump: linhas que começam com LOCK TABLES / INSERT INTO `t` / REPLACE INTO.
    // (INSERT dentro do corpo de gatilhos vem indentado e não é registro.)
    if (/^(LOCK TABLES |INSERT INTO `|REPLACE INTO |LOAD DATA )/im.test(sql)) {
        erros.push('O arquivo tem registros (INSERT/LOCK TABLES). Exporte de novo com --no-data: o teste não recebe dados de produção.');
    }
    const tabelas = (sql.match(/^CREATE TABLE /gim) || []).length;
    if (!tabelas) erros.push('Nenhum CREATE TABLE encontrado: confira se é o arquivo do mysqldump --no-data.');
    if (/^(CREATE DATABASE|USE )/im.test(sql)) {
        erros.push('O arquivo troca de banco (CREATE DATABASE/USE). Exporte sem --databases, só com o nome do banco.');
    }
    if (/DEFINER=/i.test(sql)) avisos.push('Há DEFINER de usuário da produção em gatilhos/views; no teste eles são importados como root.');
    return { erros, avisos, tabelas };
}

/** Tira as linhas que só valem no servidor de origem (GTID do Aiven e SQL_LOG_BIN). */
function prepararEstrutura(sql) {
    return sql
        .replace(/SET @@GLOBAL\.GTID_PURGED=[^;]*;\s*/g, '')
        .replace(/SET @@SESSION\.SQL_LOG_BIN\s*=[^;]*;\s*/g, '')
        .replace(/SET @MYSQLDUMP_TEMP_LOG_BIN[^;]*;\s*/g, '');
}

function docker(args, opcoes = {}) {
    return execFileSync('docker', [...COMPOSE, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...opcoes });
}

// Comando rodado dentro do container com o root local (a senha fica só no container).
const mysqlRoot = (sql) => ['exec', '-T', 'mysql', 'sh', '-c', `mysql -N -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "${sql}" 2>/dev/null`];

function esperarMysql() {
    for (let i = 0; i < 60; i += 1) {
        try {
            docker(['exec', '-T', 'mysql', 'sh', '-c', 'mysqladmin ping -h 127.0.0.1 -uroot -p"$MYSQL_ROOT_PASSWORD" --silent 2>/dev/null']);
            return;
        } catch {
            execFileSync(process.execPath, ['-e', 'setTimeout(() => {}, 2000)']);
        }
    }
    throw new Error('O MySQL local não respondeu. Rode "docker compose up -d" em database/teste e tente de novo.');
}

function main() {
    const arquivo = path.resolve(process.argv[2] || path.join(PASTA, 'estrutura.sql'));
    if (!fs.existsSync(arquivo)) throw new Error(`Arquivo não encontrado: ${arquivo}`);
    const sql = fs.readFileSync(arquivo, 'utf8');
    const { erros, avisos, tabelas } = validarEstrutura(sql);
    avisos.forEach((a) => console.warn(`Aviso: ${a}`));
    if (erros.length) throw new Error(`Importação cancelada:\n- ${erros.join('\n- ')}`);

    const preparado = path.join(PASTA, '.estrutura-preparada.sql');
    fs.writeFileSync(preparado, prepararEstrutura(sql));
    try {
        esperarMysql();
        console.log(`Importando ${tabelas} tabelas no banco de teste local...`);
        docker(['cp', preparado, 'mysql:/tmp/estrutura.sql']);
        docker(['exec', '-T', 'mysql', 'sh', '-c', 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < /tmp/estrutura.sql 2>&1 | grep -v "Using a password" ; rm -f /tmp/estrutura.sql']);
    } finally {
        fs.rmSync(preparado, { force: true });
    }

    const lista = docker(mysqlRoot("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'"))
        .split('\n').map((t) => t.trim()).filter(Boolean);
    if (!lista.length) throw new Error('Nenhuma tabela foi criada: confira as mensagens do MySQL acima.');
    const contagem = lista.map((t) => `SELECT COUNT(*) FROM \\\`${t}\\\``).join(' UNION ALL ');
    const registros = docker(mysqlRoot(`SELECT SUM(n) FROM (${contagem.replace(/SELECT COUNT\(\*\)/g, 'SELECT COUNT(*) AS n')}) AS c`)).trim();
    if (registros !== '0') throw new Error(`Atenção: o banco de teste ficou com ${registros} registro(s). Apague com "docker compose down -v" e use um arquivo --no-data.`);
    console.log(`Pronto: ${lista.length} tabelas no banco de teste local, todas vazias.`);
}

if (require.main === module) {
    try {
        main();
    } catch (erro) {
        console.error(erro.message);
        process.exit(1);
    }
}

module.exports = { validarEstrutura, prepararEstrutura };
