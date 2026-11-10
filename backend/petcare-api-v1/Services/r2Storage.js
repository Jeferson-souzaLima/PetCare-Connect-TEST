const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');

const signatures = [
    { mime: 'image/jpeg', extension: '.jpg', matches: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
    { mime: 'image/png', extension: '.png', matches: (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) }
];

// Pastas do bucket aceitas para envio e remoção de imagens.
const PASTAS = ['produtos', 'pets', 'lojas'];

function createR2Storage({ env = process.env, client } = {}) {
    const getConfig = () => {
        const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_ENDPOINT', 'R2_PUBLIC_URL'];
        const missing = required.filter((name) => !env[name]);
        if (missing.length) {
            const error = new Error(`Configuração do armazenamento indisponível: ${missing.join(', ')}.`);
            error.code = 'R2_CONFIG_MISSING';
            throw error;
        }
        return {
            bucket: env.R2_BUCKET_NAME,
            publicUrl: env.R2_PUBLIC_URL.replace(/\/+$/, ''),
            endpoint: env.R2_ENDPOINT,
            accountId: env.R2_ACCOUNT_ID,
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY
        };
    };

    let s3;
    const getClient = (config) => {
        if (!s3) s3 = client || new S3Client({
            region: 'auto',
            endpoint: config.endpoint,
            credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
        });
        return s3;
    };

    return {
        validateImage(file) {
            const detected = signatures.find(({ matches }) => matches(file.buffer));
            const suppliedExtension = path.extname(file.originalname || '').toLowerCase();
            if (!detected || detected.mime !== file.mimetype || !['.jpg', '.jpeg', '.png'].includes(suppliedExtension) ||
                (detected.mime === 'image/png' && suppliedExtension !== '.png') ||
                (detected.mime === 'image/jpeg' && !['.jpg', '.jpeg'].includes(suppliedExtension))) {
                const error = new Error('Conteúdo inválido. Envie uma imagem JPEG ou PNG válida.');
                error.code = 'INVALID_IMAGE_CONTENT';
                throw error;
            }
            return { contentType: detected.mime, extension: detected.extension };
        },
        async upload(file, pasta = 'produtos') {
            if (!PASTAS.includes(pasta)) throw new Error(`Pasta de imagens inválida: ${pasta}`);
            const config = getConfig();
            const { contentType, extension } = this.validateImage(file);
            const key = `${pasta}/${crypto.randomUUID()}${extension}`;
            await getClient(config).send(new PutObjectCommand({
                Bucket: config.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: contentType
            }));
            return { key, url: `${config.publicUrl}/${key}` };
        },
        async deleteByKey(key) {
            const config = getConfig();
            await getClient(config).send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
        },
        keyFromPublicUrl(url) {
            const config = getConfig();
            if (typeof url !== 'string' || !url.startsWith(`${config.publicUrl}/`)) return null;
            const key = url.slice(config.publicUrl.length + 1);
            if (!PASTAS.some((pasta) => key.startsWith(`${pasta}/`)) || key.includes('..')) return null;
            return key;
        },
        getStorageTarget(url) {
            let key = null;
            try {
                key = this.keyFromPublicUrl(url);
            } catch (error) {
                if (error.code !== 'R2_CONFIG_MISSING') throw error;
            }
            if (key) return { type: 'r2', key };
            const match = typeof url === 'string' && url.match(/^\/uploads\/([^/\\]+)$/);
            return match && match[1] !== '.' && match[1] !== '..'
                ? { type: 'local', filename: match[1] }
                : null;
        }
    };
}

module.exports = createR2Storage();
module.exports.createR2Storage = createR2Storage;
