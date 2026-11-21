const produtosModel = require('../Models/produtosModel');
const r2Storage = require('./r2Storage');
const { enviarImagem, removerImagem } = require('../utils/imagens');
const { registrarErroInterno } = require('../utils/erroInterno');
const { consultar } = require('../utils/transacao');

/*
 * Envio de imagens do catálogo (produtos e logo da loja), usado pelo lojista
 * e pelo administrador. Quem chama já validou quem pode alterar o registro.
 */

const erroComStatus = (status, mensagem) => Object.assign(new Error(mensagem), { status });

const salvarImagens = (imagens) => new Promise((resolve, reject) => {
    produtosModel.saveImagens(imagens, (erro, resultado) => (erro ? reject(erro) : resolve(resultado)));
});

async function removerObjetosR2(objetos) {
    const resultados = await Promise.allSettled(objetos.map(({ key }) => r2Storage.deleteByKey(key)));
    resultados.forEach((resultado) => {
        if (resultado.status === 'rejected') {
            console.error('Falha ao remover objeto de imagem do R2:', resultado.reason?.name || 'R2_DELETE_ERROR');
        }
    });
}

/**
 * Envia as imagens ao R2 e grava no produto. Tudo ou nada: se um envio ou o
 * banco falhar, os arquivos já enviados são apagados.
 * A primeira imagem de um produto sem imagens vira a principal (produtosModel).
 */
async function adicionarImagensAoProduto(produtoId, arquivos) {
    if (!arquivos?.length) throw erroComStatus(400, 'Nenhuma imagem enviada.');

    const envios = await Promise.allSettled(arquivos.map((arquivo) => r2Storage.upload(arquivo)));
    const enviados = envios.filter((envio) => envio.status === 'fulfilled').map((envio) => envio.value);
    const falha = envios.find((envio) => envio.status === 'rejected');

    if (falha) {
        await removerObjetosR2(enviados);
        if (falha.reason?.code === 'INVALID_IMAGE_CONTENT') throw erroComStatus(400, falha.reason.message);
        console.error('Falha no upload de imagem de produto:', falha.reason?.name || 'R2_UPLOAD_ERROR');
        throw erroComStatus(500, 'Não foi possível enviar as imagens.');
    }

    const imagens = enviados.map((objeto) => ({ produto_id: produtoId, caminho: objeto.url }));

    try {
        await salvarImagens(imagens);
    } catch (erro) {
        await removerObjetosR2(enviados);
        registrarErroInterno('imagensCatalogoService.adicionarImagensAoProduto', erro);
        throw erroComStatus(500, 'Não foi possível salvar as imagens.');
    }

    return imagens;
}

/**
 * Troca a imagem (logo) da loja. Com usuarioId, só altera se a loja for dele.
 * A imagem anterior só é apagada depois que a nova foi salva.
 */
async function trocarImagemDaLoja({ lojaId, imagemAtual, arquivo, usuarioId = null }) {
    if (!arquivo) throw erroComStatus(400, 'Selecione uma imagem para enviar.');

    const imagem = await enviarImagem(arquivo, 'lojas');

    const condicaoDono = usuarioId === null ? '' : ' AND usuario_id = ?';
    const valores = usuarioId === null ? [imagem, lojaId] : [imagem, lojaId, usuarioId];

    let resultado;
    try {
        resultado = await consultar(`UPDATE lojas SET imagem = ? WHERE id = ?${condicaoDono}`, valores);
    } catch (erro) {
        await removerImagem(imagem);
        throw erro;
    }

    if (!resultado.affectedRows) {
        await removerImagem(imagem);
        throw erroComStatus(404, 'Loja não encontrada.');
    }

    await removerImagem(imagemAtual);
    return imagem;
}

module.exports = { adicionarImagensAoProduto, trocarImagemDaLoja };
