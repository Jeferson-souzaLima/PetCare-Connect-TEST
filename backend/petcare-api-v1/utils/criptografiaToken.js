const crypto = require('crypto');

/*
 * Criptografia dos tokens OAuth das lojas (AES-256-GCM).
 * A chave vem de MP_TOKEN_KEY: 32 bytes em base64.
 * Formato gravado: v1:<iv>:<tag>:<conteúdo>, cada parte em base64.
 * O GCM também detecta qualquer alteração do valor gravado.
 */
const VERSAO = 'v1';
const ALGORITMO = 'aes-256-gcm';
const TAMANHO_IV = 12;

function obterChave() {
    const chave = Buffer.from(process.env.MP_TOKEN_KEY || '', 'base64');

    if (chave.length !== 32) {
        const erro = new Error('MP_TOKEN_KEY ausente ou inválida (precisa ter 32 bytes em base64).');
        erro.code = 'MP_TOKEN_KEY_INVALIDA';
        throw erro;
    }

    return chave;
}

function cifrar(texto) {
    const iv = crypto.randomBytes(TAMANHO_IV);
    const cifra = crypto.createCipheriv(ALGORITMO, obterChave(), iv);
    const conteudo = Buffer.concat([cifra.update(String(texto), 'utf8'), cifra.final()]);

    return [VERSAO, iv, cifra.getAuthTag(), conteudo]
        .map(parte => (Buffer.isBuffer(parte) ? parte.toString('base64') : parte))
        .join(':');
}

function decifrar(valor) {
    const [versao, iv, tag, conteudo] = String(valor).split(':');

    if (versao !== VERSAO || !iv || !tag || conteudo === undefined) {
        throw new Error('Token cifrado em formato desconhecido.');
    }

    const decifra = crypto.createDecipheriv(ALGORITMO, obterChave(), Buffer.from(iv, 'base64'));
    decifra.setAuthTag(Buffer.from(tag, 'base64'));

    return Buffer.concat([
        decifra.update(Buffer.from(conteudo, 'base64')),
        decifra.final()
    ]).toString('utf8');
}

module.exports = { cifrar, decifrar };
