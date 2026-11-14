const test = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('node:zlib');
const { cifrar, decifrar, nomeDoBackup, chavesVencidas, argumentosDoDump } = require('../scripts/backupBanco');

test('backup cifrado só abre com a senha certa e volta idêntico', () => {
    const sql = Buffer.from('CREATE TABLE lojas (id INT);\nINSERT INTO lojas VALUES (1);\n'.repeat(200));
    const pacote = cifrar(zlib.gzipSync(sql), 'senha-do-backup');
    assert.ok(!pacote.includes('CREATE TABLE'), 'o conteúdo não fica legível');
    assert.deepEqual(zlib.gunzipSync(decifrar(pacote, 'senha-do-backup')), sql);
    assert.throws(() => decifrar(pacote, 'senha-errada'));
    const adulterado = Buffer.from(pacote); adulterado[adulterado.length - 1] ^= 1;
    assert.throws(() => decifrar(adulterado, 'senha-do-backup'), 'arquivo alterado é recusado');
});

test('nome do backup pela data (UTC) e limpeza só do que passou da retenção', () => {
    const agora = new Date('2026-11-14T06:00:00Z');
    assert.equal(nomeDoBackup('petcare', agora), 'banco/petcare-2026-11-14T06-00-00Z.sql.gz.enc');
    const objetos = [
        { Key: 'banco/petcare-2026-11-13T06-00-00Z.sql.gz.enc', LastModified: new Date('2026-11-13T06:00:10Z') },
        { Key: 'banco/petcare-2026-10-10T06-00-00Z.sql.gz.enc', LastModified: new Date('2026-10-10T06:00:10Z') },
        { Key: 'outra-pasta/arquivo.txt', LastModified: new Date('2020-01-01T00:00:00Z') }
    ];
    assert.deepEqual(chavesVencidas(objetos, 30, agora), ['banco/petcare-2026-10-10T06-00-00Z.sql.gz.enc']);
});

test('o dump não leva a senha na linha de comando e não trava o banco', () => {
    const args = argumentosDoDump({ DB_HOST: 'h', DB_PORT: '3306', DB_USER: 'u', DB_PASSWORD: 'segredo', DB_NAME: 'b', DB_SSL_CA_PATH: './ca.pem' });
    assert.ok(!args.join(' ').includes('segredo'));
    assert.ok(args.includes('--single-transaction') && args.includes('--set-gtid-purged=OFF') && args.at(-1) === 'b');
});
