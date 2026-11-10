const fs = require('fs');
const path = require('path');
const r2Storage = require('../Services/r2Storage');
const { registrarErroInterno } = require('./erroInterno');

/*
 * Imagens enviadas pelos usuários ficam no Cloudflare R2: o disco do Render
 * é apagado a cada deploy. Caminhos antigos (/uploads/...) continuam sendo
 * reconhecidos para remoção.
 */

/**
 * Envia a imagem (já validada pelo conteúdo real do arquivo) e devolve a URL
 * pública. Conteúdo inválido vira erro 400 com mensagem para o usuário.
 */
async function enviarImagem(file, pasta) {
    try {
        const { url } = await r2Storage.upload(file, pasta);
        return url;
    } catch (erro) {
        if (erro.code === 'INVALID_IMAGE_CONTENT') erro.status = 400;
        throw erro;
    }
}

/** Remove a imagem do R2 ou de /uploads. Falhas só são registradas no log. */
async function removerImagem(url) {
    if (!url) return;

    try {
        const alvo = r2Storage.getStorageTarget(url);

        if (alvo?.type === 'r2') {
            await r2Storage.deleteByKey(alvo.key);
        } else if (alvo?.type === 'local') {
            await fs.promises.unlink(path.join(__dirname, '..', 'uploads', alvo.filename));
        }
    } catch (erro) {
        if (erro.code !== 'ENOENT') registrarErroInterno('imagens.removerImagem', erro);
    }
}

module.exports = { enviarImagem, removerImagem };
