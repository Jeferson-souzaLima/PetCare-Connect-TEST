// controllers/lojasController.js
const lojaModel = require('../Models/lojasModel');
const db = require('../db');
const { responderErroInterno } = require('../utils/erroInterno');

// Listar todas as lojas
exports.listarLojas = (req, res) => {

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

    lojaModel.getPaginados(
        page,
        limit,
        (err, resultado) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    mensagem: "Erro ao listar lojas."
                });
            }

            res.json(resultado);
        }
    );
};

// Criar uma nova loja (sem imagem ainda)
// Upload/atualiza��o da imagem da loja
exports.uploadImagem = (req, res) => {
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).json({ mensagem: 'Nenhuma imagem foi enviada.' });
    }

    const imagemUrl = `/uploads/${ req.file.filename }`;
    const query = 'UPDATE lojas SET imagem = ? WHERE id = ?';

    db.query(query, [imagemUrl, id], (err, result) => {
        if (err) return responderErroInterno(res, err, "lojasController.uploadImagem");

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Loja n�o encontrada.' });
        }

        res.json({
            mensagem: 'Imagem da loja atualizada com sucesso!',
            imagemUrl
        });
    });
};

/**
 * Só o administrador ou o lojista dono da loja podem alterar/apagar uma loja
 * pelo id. Responde 404 se a loja não existe e 403 se pertence a outro usuário.
 */
exports.exigirDonoDaLojaOuAdmin = (req, res, next) => {
    const { usuario } = req;

    if (!usuario || !['admin', 'lojista'].includes(usuario.tipo)) {
        return res.status(403).json({ mensagem: 'Acesso negado.' });
    }

    db.query('SELECT usuario_id FROM lojas WHERE id = ? LIMIT 1', [req.params.id], (err, results) => {
        if (err) return responderErroInterno(res, err, 'lojasController.exigirDonoDaLojaOuAdmin');

        if (results.length === 0) {
            return res.status(404).json({ mensagem: 'Loja não encontrada.' });
        }

        if (usuario.tipo !== 'admin' && Number(results[0].usuario_id) !== Number(usuario.id)) {
            return res.status(403).json({ mensagem: 'Acesso negado.' });
        }

        next();
    });
};

// Atualizar dados da loja
exports.atualizarLoja = (req, res) => {
    const { id } = req.params;
    const dados = req.body;

    lojaModel.update(id, dados, (err, result) => {
        if (err) return responderErroInterno(res, err, "lojasController.atualizarLoja");

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Loja n�o encontrada.' });
        }

        res.json({ mensagem: 'Loja atualizada com sucesso!' });
    });
};

// Deletar loja
exports.deletarLoja = (req, res) => {
    const { id } = req.params;

    lojaModel.delete(id, (err, result) => {
        if (err) return responderErroInterno(res, err, "lojasController.deletarLoja");

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Loja n�o encontrada.' });
        }

        res.json({ mensagem: 'Loja deletada com sucesso!' });
    });
};

// Buscar loja por ID (p�blica)
exports.getLojaPorId = (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM lojas WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) return responderErroInterno(res, err, "lojasController.getLojaPorId");

        if (results.length === 0) {
            return res.status(404).json({ mensagem: 'Loja n�o encontrada.' });
        }

        res.json(results[0]);
    });
};
