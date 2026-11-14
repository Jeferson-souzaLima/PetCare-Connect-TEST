const fs = require('fs');
const path = require('path');
const produtosModel = require('../Models/produtosModel');
const r2Storage = require('../Services/r2Storage');
const { responderErroInterno, responderErroDoServico } = require('../utils/erroInterno');
const { filtrosProdutos } = require('../utils/filtrosCatalogo');

const saveImagens = (imagens) => new Promise((resolve, reject) => {
    produtosModel.saveImagens(imagens, (err, result) => err ? reject(err) : resolve(result));
});

async function removerObjetosR2(objetos) {
    const resultados = await Promise.allSettled(objetos.map(({ key }) => r2Storage.deleteByKey(key)));
    resultados.forEach((resultado) => {
        if (resultado.status === 'rejected') {
            console.error('Falha ao remover objeto de imagem do R2:', resultado.reason?.name || 'R2_DELETE_ERROR');
        }
    });
}

//
// ===============================
// LISTAR TODOS (uso interno/admin)
// ===============================
exports.listarProdutos = (req, res) => {

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
    ) {
        return res.status(400).json({
            mensagem: "Parâmetros de paginação inválidos."
        });
    }

    const filtros = filtrosProdutos(req.query);
    if (filtros.erro) {
        return res.status(400).json({ mensagem: filtros.erro });
    }

    produtosModel.getPaginados(
        page,
        limit,
        filtros,
        (err, resultado) => {

            if (err) {
                return responderErroInterno(res, err, "produtosController.listarProdutos");
            }

            res.json(resultado);

        }
    );

};

//
// ===============================
// BUSCAR PRODUTO POR ID (P�BLICO)
// Cliente s� v� se estiver ativo
// ===============================
exports.getProduto = (req, res) => {
    const id = req.params.id;

    produtosModel.getById(id, (err, produto) => {
        if (err) return responderErroInterno(res, err, "produtosController.getProduto");
        if (!produto) {
            return res.status(404).json({ mensagem: 'Produto n�o encontrado.' });
        }

        // Se n�o estiver ativo, cliente n�o pode ver
        if (produto.ativo !== 1) {
            return res.status(404).json({ mensagem: 'Produto n�o dispon�vel.' });
        }

        res.json(produto);
    });
};

//
// ===============================
// CRIAR PRODUTO (LOJISTA)
// ===============================
exports.criarProduto = (req, res) => {

    const loja_id = req.usuario.loja_id;

    if (!loja_id) {
        return res.status(403).json({ mensagem: 'Loja n�o identificada.' });
    }

    const { nome, descricao, preco, estoque, ativo } = req.body;

    if (!nome || !preco) {
        return res.status(400).json({ mensagem: 'Nome e pre�o s�o obrigat�rios.' });
    }

    const novoProduto = {
        loja_id: loja_id, // vem do token
        nome,
        descricao,
        preco,
        estoque,
        ativo: ativo ?? 1
    };

    produtosModel.create(novoProduto, (err, result) => {
        if (err) return responderErroInterno(res, err, "produtosController.criarProduto");

        res.status(201).json({
            mensagem: 'Produto criado com sucesso!',
            id: result.insertId
        });
    });
};

//
// ===============================
// ATUALIZAR PRODUTO (S� DONO)
// ===============================
exports.atualizarProduto = (req, res) => {

    const produtoId = req.params.id;
    const loja_id = req.usuario.loja_id;

    produtosModel.getById(produtoId, (err, produto) => {

        if (err) return responderErroInterno(res, err, "produtosController.atualizarProduto");
        if (!produto) {
            return res.status(404).json({ mensagem: 'Produto n�o encontrado.' });
        }

        if (produto.loja_id !== loja_id) {
            return res.status(403).json({ mensagem: 'Voc� n�o pode alterar este produto.' });
        }

        produtosModel.update(produtoId, req.body, (err) => {
            if (err) return responderErroInterno(res, err, "produtosController.atualizarProduto");

            res.status(200).json({ mensagem: 'Produto atualizado com sucesso!' });
        });
    });
};

//
// ===============================
// DELETAR PRODUTO (S� DONO)
// ===============================
exports.deletarProduto = (req, res) => {

    const produtoId = req.params.id;
    const lojaId = req.usuario.loja_id;

    produtosModel.getById(produtoId, (err, produto) => {

        if (err) return responderErroInterno(res, err, "produtosController.deletarProduto");
        if (!produto) {
            return res.status(404).json({ mensagem: 'Produto n�o encontrado.' });
        }

        if (produto.loja_id !== lojaId) {
            return res.status(403).json({ mensagem: 'Voc� n�o pode deletar este produto.' });
        }

        produtosModel.delete(produtoId, (err) => {
            if (err) return responderErroInterno(res, err, "produtosController.deletarProduto");

            res.status(200).json({ mensagem: 'Produto deletado com sucesso!' });
        });
    });
};

//
// ===============================
// UPLOAD DE IMAGENS (S� DONO)
// ===============================
exports.uploadImagensProduto = async (req, res) => {

    const produtoId = req.params.id;
    const lojaId = req.usuario.loja_id;

    produtosModel.getById(produtoId, async (err, produto) => {

        if (err) {
            console.error('Falha ao buscar produto para upload de imagens:', err.code || 'DATABASE_ERROR');
            return res.status(500).json({ mensagem: 'Não foi possível validar o produto.' });
        }
        if (!produto) {
            return res.status(404).json({ mensagem: 'Produto n�o encontrado.' });
        }

        if (produto.loja_id !== lojaId) {
            return res.status(403).json({ mensagem: 'Voc� n�o pode alterar imagens deste produto.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ mensagem: 'Nenhuma imagem enviada.' });
        }

        const uploads = await Promise.allSettled(req.files.map((file) => r2Storage.upload(file)));
        const criados = uploads.filter((resultado) => resultado.status === 'fulfilled').map((resultado) => resultado.value);
        const falhaUpload = uploads.find((resultado) => resultado.status === 'rejected');
        if (falhaUpload) {
            await removerObjetosR2(criados);
            console.error('Falha no upload de imagem de produto:', falhaUpload.reason?.name || 'R2_UPLOAD_ERROR');
            return res.status(500).json({ mensagem: 'Não foi possível enviar as imagens.' });
        }

        const imagens = criados.map((objeto) => ({ produto_id: produtoId, caminho: objeto.url }));
        try {
            await saveImagens(imagens);
        } catch (saveError) {
            await removerObjetosR2(criados);
            console.error('Falha ao salvar imagens do produto:', saveError?.code || 'DATABASE_ERROR');
            return res.status(500).json({ mensagem: 'Não foi possível salvar as imagens.' });
        }
        return res.status(200).json({ mensagem: 'Imagens atualizadas com sucesso!', imagens });
    });
};

//
// ===============================
// DEFINIR IMAGEM PRINCIPAL (S� DONO)
// ===============================
exports.definirImagemPrincipal = (req, res) => {

    const produtoId = req.params.produtoId;
    const imagemId = req.params.imagemId;
    const lojaId = req.usuario.loja_id;

    // 1) Busca o produto
    produtosModel.getById(produtoId, (err, produto) => {

        if (err) {
            return responderErroInterno(res, err, "produtosController.definirImagemPrincipal");
        }

        if (!produto) {
            return res.status(404).json({
                mensagem: 'Produto n�o encontrado.'
            });
        }

        // 2) Valida se o produto pertence ao lojista
        if (produto.loja_id !== lojaId) {
            return res.status(403).json({
                mensagem: 'Voc� n�o pode alterar imagens deste produto.'
            });
        }

        // 3) Valida se a imagem pertence ao produto
        produtosModel.getImagemById(
            imagemId,
            produtoId,
            (err, imagem) => {

                if (err) {
                    return responderErroInterno(res, err, "produtosController.definirImagemPrincipal");
                }

                if (!imagem) {
                    return res.status(404).json({
                        mensagem: 'Imagem n�o encontrada para este produto.'
                    });
                }

                // 4) Se j� for principal, n�o precisa executar UPDATE
                if (imagem.principal === 1) {
                    return res.status(200).json({
                        mensagem: 'Esta imagem j� � a principal.'
                    });
                }

                // 5) Executa troca at�mica da principal
                produtosModel.definirImagemPrincipal(
                    produtoId,
                    imagemId,
                    (err) => {

                        if (err) {
                            return responderErroDoServico(res, err, 'produtosController.definirImagemPrincipal', 'Erro ao definir imagem principal.');
                        }

                        return res.status(200).json({
                            mensagem: 'Imagem principal alterada com sucesso!'
                        });
                    }
                );
            }
        );
    });
};

//
// ===============================
// DELETAR IMAGEM DO PRODUTO (S� DONO)
// ===============================
exports.deletarImagemProduto = (req, res) => {

    const produtoId = req.params.produtoId;
    const imagemId = req.params.imagemId;
    const lojaId = req.usuario.loja_id;

    // 1) Busca o produto
    produtosModel.getById(produtoId, (err, produto) => {

        if (err) return responderErroInterno(res, err, "produtosController.deletarImagemProduto");

        if (!produto) {
            return res.status(404).json({
                mensagem: 'Produto n�o encontrado.'
            });
        }

        // 2) Confirma que o produto pertence ao lojista
        if (produto.loja_id !== lojaId) {
            return res.status(403).json({
                mensagem: 'Voc� n�o pode alterar imagens deste produto.'
            });
        }

        // 3) Busca a imagem dentro do produto informado
        produtosModel.getImagemById(
            imagemId,
            produtoId,
            (err, imagem) => {

                if (err) {
                    return responderErroInterno(res, err, "produtosController.deletarImagemProduto");
                }

                if (!imagem) {
                    return res.status(404).json({
                        mensagem: 'Imagem n�o encontrada para este produto.'
                    });
                }

                // 4) Conta quantas imagens o produto possui
                produtosModel.countImagensByProduto(
                    produtoId,
                    (err, total) => {

                        if (err) {
                            return responderErroInterno(res, err, "produtosController.deletarImagemProduto");
                        }

                        // MVP: produto deve manter pelo menos uma imagem
                        if (total <= 1) {
                            return res.status(400).json({
                                mensagem: 'O produto deve possuir pelo menos uma imagem.'
                            });
                        }

                        // 5) Fun��o que efetivamente exclui a imagem
                        const excluirImagem = () => {

                            produtosModel.deleteImagem(
                                imagemId,
                                produtoId,
                                (err, result) => {

                                    if (err) {
                                        return responderErroInterno(res, err, "produtosController.deletarImagemProduto");
                                    }

                                    if (result.affectedRows === 0) {
                                        return res.status(404).json({
                                            mensagem: 'Imagem n�o encontrada.'
                                        });
                                    }

                                    // Converte /uploads/arquivo.jpg em caminho f�sico do projeto
                                    const storageTarget = r2Storage.getStorageTarget(imagem.caminho);
                                    if (storageTarget?.type === 'r2') {
                                        r2Storage.deleteByKey(storageTarget.key)
                                            .then(() => res.status(200).json({ mensagem: 'Imagem removida com sucesso!' }))
                                            .catch((storageError) => {
                                                console.error('Falha ao remover imagem do R2:', storageError?.name || 'R2_DELETE_ERROR');
                                                return res.status(500).json({ mensagem: 'Não foi possível remover o arquivo da imagem.' });
                                            });
                                        return;
                                    }

                                    if (storageTarget?.type !== 'local') {
                                        return res.status(200).json({ mensagem: 'Imagem removida com sucesso!' });
                                    }
                                    const caminhoFisico = path.join(__dirname, '..', 'uploads', storageTarget.filename);

                                    // Remove o arquivo f�sico
                                    fs.unlink(caminhoFisico, (err) => {

                                        if (err && err.code !== 'ENOENT') {
                                            // O registro j� foi exclu�do do banco.
                                            // N�o retornamos erro ao cliente para n�o informar
                                            // que a exclus�o falhou quando ela j� ocorreu no banco.
                                            console.error(
                                                'Erro ao remover arquivo f�sico da imagem:',
                                                err.code || 'LOCAL_FILE_ERROR'
                                            );
                                        }

                                        return res.status(200).json({
                                            mensagem: 'Imagem removida com sucesso!'
                                        });
                                    });
                                }
                            );
                        };

                        // 6) Se for principal, promove outra antes de excluir
                        if (imagem.principal === 1) {

                            produtosModel.definirOutraPrincipal(
                                produtoId,
                                imagemId,
                                (err) => {

                                    if (err) {
                                        return responderErroInterno(res, err, "produtosController.deletarImagemProduto");
                                    }

                                    excluirImagem();
                                }
                            );

                        } else {
                            excluirImagem();
                        }
                    }
                );
            }
        );
    });
};

//
// ===============================
// LISTAR PRODUTOS DO LOJISTA
// ===============================
exports.listarMeusProdutos = (req, res) => {

    const lojaId = req.usuario.loja_id;

    if (!lojaId) {
        return res.status(403).json({ mensagem: 'Loja n�o identificada.' });
    }

    produtosModel.getByLojaId(lojaId, (err, produtos) => {
        if (err) return responderErroInterno(res, err, "produtosController.listarMeusProdutos");
        res.json(produtos);
    });
};

//
// ===============================
// LISTAR PRODUTOS DE UMA LOJA (P�BLICO)
// Cliente s� v� ativos
// ===============================
exports.listarProdutosPorLoja = (req, res) => {

    

    const loja_id = req.params.id;

    produtosModel.getAtivosByLojaId(loja_id, (err, produtos) => {
        if (err) return responderErroInterno(res, err, "produtosController.listarProdutosPorLoja");
        res.json(produtos);
    });
};

//
// ===============================
// LISTAR PRODUTOS DE DISTRIBUIDORAS
// (para lojista comprar)
// ===============================
exports.listarProdutosDistribuidoras = (req, res) => {

    produtosModel.getProdutosDistribuidoras((err, produtos) => {
        if (err) return responderErroInterno(res, err, "produtosController.listarProdutosDistribuidoras");
        res.json(produtos);
    });
};

