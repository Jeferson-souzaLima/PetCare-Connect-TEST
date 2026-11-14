/*
 * Backup diário do banco: mysqldump -> gzip -> cifra (AES-256-GCM) -> bucket PRIVADO do R2,
 * apagando os backups mais antigos que a retenção. Agendado em .github/workflows/backup-banco.yml.
 *
 *   node scripts/backupBanco.js                                  faz o backup e a limpeza
 *   node scripts/backupBanco.js --restaurar <chave> <saida.sql>  baixa, decifra e grava o .sql
 *
 * Variáveis: DB_* (usuário SÓ DE LEITURA), BACKUP_SENHA (guarde fora do GitHub também: sem ela
 * o backup não abre), BACKUP_R2_BUCKET, BACKUP_RETENCAO_DIAS (padrão 30) e as R2_* de acesso.
 * Guia: docs/backup-do-banco.md
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const zlib = require('node:zlib');
const { spawn } = require('node:child_process');

const MARCA = Buffer.from('PCBK1'); // formato: marca | sal(16) | iv(12) | tag(16) | conteúdo cifrado
const chave = (senha, sal) => crypto.scryptSync(senha, sal, 32);

function cifrar(conteudo, senha) {
    const sal = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const cifra = crypto.createCipheriv('aes-256-gcm', chave(senha, sal), iv);
    const corpo = Buffer.concat([cifra.update(conteudo), cifra.final()]);
    return Buffer.concat([MARCA, sal, iv, cifra.getAuthTag(), corpo]);
}

function decifrar(pacote, senha) {
    if (!pacote.subarray(0, MARCA.length).equals(MARCA)) throw new Error('Arquivo não é um backup do PetCare Connect.');
    const inicio = MARCA.length;
    const sal = pacote.subarray(inicio, inicio + 16);
    const iv = pacote.subarray(inicio + 16, inicio + 28);
    const tag = pacote.subarray(inicio + 28, inicio + 44);
    const decifra = crypto.createDecipheriv('aes-256-gcm', chave(senha, sal), iv);
    decifra.setAuthTag(tag);
    return Buffer.concat([decifra.update(pacote.subarray(inicio + 44)), decifra.final()]);
}

function nomeDoBackup(banco, agora = new Date()) {
    const carimbo = agora.toISOString().replace(/\.\d+Z$/, 'Z').replace(/:/g, '-');
    return `banco/${banco}-${carimbo}.sql.gz.enc`;
}

/** Chaves de backup (pasta banco/) mais antigas que a retenção. */
function chavesVencidas(objetos, dias, agora = new Date()) {
    const limite = agora.getTime() - dias * 24 * 60 * 60 * 1000;
    return objetos.filter((o) => o.Key.startsWith('banco/') && new Date(o.LastModified).getTime() < limite).map((o) => o.Key);
}

/** Argumentos do mysqldump; a senha vai pela variável MYSQL_PWD, nunca na linha de comando. */
function argumentosDoDump(env) {
    const args = ['-h', env.DB_HOST, '-P', String(env.DB_PORT || 3306), '-u', env.DB_USER,
        '--single-transaction', '--routines', '--triggers', '--set-gtid-purged=OFF', '--no-tablespaces'];
    if (env.DB_SSL_CA_PATH) args.push('--ssl-mode=VERIFY_CA', `--ssl-ca=${env.DB_SSL_CA_PATH}`);
    else args.push('--ssl-mode=REQUIRED');
    return [...args, env.DB_NAME];
}

function exigir(env, nomes) {
    const faltando = nomes.filter((nome) => !env[nome]);
    if (faltando.length) throw new Error(`Variáveis faltando: ${faltando.join(', ')}.`);
}

function fazerDump(env) {
    return new Promise((resolve, reject) => {
        const processo = spawn('mysqldump', argumentosDoDump(env), { env: { ...process.env, MYSQL_PWD: env.DB_PASSWORD } });
        const partes = [];
        let erros = '';
        processo.stdout.on('data', (parte) => partes.push(parte));
        processo.stderr.on('data', (parte) => { erros += parte; });
        processo.on('error', reject);
        processo.on('close', (codigo) => {
            const sql = Buffer.concat(partes);
            if (codigo !== 0) return reject(new Error(`mysqldump falhou (código ${codigo}): ${erros.trim().split('\n').pop()}`));
            if (!/Dump completed/.test(sql.subarray(-200).toString())) return reject(new Error('Dump incompleto: o arquivo não termina com "Dump completed".'));
            return resolve(sql);
        });
    });
}

function clienteR2(env) {
    const { S3Client } = require('@aws-sdk/client-s3');
    return new S3Client({ region: 'auto', endpoint: env.R2_ENDPOINT, credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY } });
}

async function backup(env) {
    const { PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
    const sql = await fazerDump(env);
    const pacote = cifrar(zlib.gzipSync(sql), env.BACKUP_SENHA);
    const s3 = clienteR2(env);
    const Key = nomeDoBackup(env.DB_NAME);
    await s3.send(new PutObjectCommand({ Bucket: env.BACKUP_R2_BUCKET, Key, Body: pacote, ContentType: 'application/octet-stream' }));
    console.log(`Backup enviado: ${Key} (${(pacote.length / 1024).toFixed(0)} KB cifrados, ${(sql.length / 1024).toFixed(0)} KB de SQL).`);

    const lista = await s3.send(new ListObjectsV2Command({ Bucket: env.BACKUP_R2_BUCKET, Prefix: 'banco/' }));
    const vencidas = chavesVencidas(lista.Contents || [], Number(env.BACKUP_RETENCAO_DIAS) || 30);
    if (vencidas.length) {
        await s3.send(new DeleteObjectsCommand({ Bucket: env.BACKUP_R2_BUCKET, Delete: { Objects: vencidas.map((k) => ({ Key: k })) } }));
        console.log(`${vencidas.length} backup(s) antigo(s) apagado(s).`);
    }
}

async function restaurar(env, Key, saida) {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const resposta = await clienteR2(env).send(new GetObjectCommand({ Bucket: env.BACKUP_R2_BUCKET, Key }));
    const pacote = Buffer.from(await resposta.Body.transformToByteArray());
    fs.writeFileSync(saida, zlib.gunzipSync(decifrar(pacote, env.BACKUP_SENHA)));
    console.log(`Backup decifrado em ${saida}. Importe num banco de TESTE para conferir.`);
}

async function main() {
    const env = process.env;
    const [acao, chaveObjeto, saida] = process.argv.slice(2);
    exigir(env, ['BACKUP_SENHA', 'BACKUP_R2_BUCKET', 'R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']);
    if (env.BACKUP_R2_BUCKET === env.R2_BUCKET_NAME) throw new Error('BACKUP_R2_BUCKET precisa ser um bucket privado, diferente do bucket público das imagens.');
    if (acao === '--restaurar') {
        if (!chaveObjeto || !saida) throw new Error('Uso: --restaurar <chave do backup> <arquivo de saída .sql>');
        return restaurar(env, chaveObjeto, saida);
    }
    exigir(env, ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']);
    return backup(env);
}

if (require.main === module) {
    main().catch((erro) => {
        console.error(erro.message);
        process.exit(1);
    });
}

module.exports = { cifrar, decifrar, nomeDoBackup, chavesVencidas, argumentosDoDump };
