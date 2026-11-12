// controllers/lojasController.js
const lojaModel = require('../Models/lojasModel');
const db = require('../db');
const { responderErroInterno, registrarErroInterno } = require('../utils/erroInterno');
const { filtrosLojas } = require('../utils/filtrosCatalogo');

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

    const filtros = filtrosLojas(req.query);
    if (filtros.erro) {
        return res.status(400).json({ mensagem: filtros.erro });
    }

    lojaModel.getPaginados(
        page,
        limit,
        filtros,
        (err, resultado) => {

            if (err) {
                registrarErroInterno('lojasController', err);

                return res.status(500).json({
                    mensagem: "Erro ao listar lojas."
                });
            }

            res.json(resultado);
        }
    );
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
    lojaModel.getPublicaPorId(req.params.id, (err, loja) => {
        if (err) return responderErroInterno(res, err, "lojasController.getLojaPorId");
        if (!loja) return res.status(404).json({ mensagem: "Loja não encontrada." });
        res.json(loja);
    });
};
