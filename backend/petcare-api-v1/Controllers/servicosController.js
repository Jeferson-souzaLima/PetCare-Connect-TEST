const Servicos = require('../Models/servicosModel');
const { responderErroInterno } = require('../utils/erroInterno');

//
// ===============================
// LISTAR TODOS (uso interno/admin)
// ===============================
exports.listarServicos = (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({ message: 'Parâmetros de paginação inválidos.' });
    }

    Servicos.getPaginados(page, limit, (err, resultado) => {
        if (err) return res.status(500).json({ message: 'Erro ao listar serviços.' });
        res.json(resultado);
    });
};

//
// ===============================
// BUSCAR SERVI�O POR ID (P�BLICO)
// ===============================
exports.getServico = (req, res) => {
    const id = req.params.id;

    Servicos.getById(id, (err, servico) => {
        if (err) return responderErroInterno(res, err, "servicosController.getServico");

        if (!servico) {
            return res.status(404).json({ message: "Servi�o n�o encontrado." });
        }

        // S� exibe se estiver ativo
        if (servico.ativo !== 1) {
            return res.status(404).json({ message: "Servi�o n�o dispon�vel." });
        }

        res.json(servico);
    });
};

//
// ===============================
// LISTAR SERVI�OS DE UMA LOJA (P�BLICO)
// ===============================
exports.listarServicosPorLoja = (req, res) => {
    const lojaId = req.params.id;

    Servicos.getByLojaId(lojaId, (err, results) => {
        if (err) return responderErroInterno(res, err, "servicosController.listarServicosPorLoja");

        // Filtra apenas ativos
        const ativos = results.filter(s => s.ativo === 1);

        res.json(ativos);
    });
};

//
// ===============================
// CRIAR SERVI�O (LOJISTA)
// ===============================
exports.criarServico = (req, res) => {

    const lojaId = req.usuario.loja_id;

    if (!lojaId) {
        return res.status(403).json({ message: "Loja n�o identificada." });
    }

    const { nome, descricao, preco, duracao_min, ativo } = req.body;

    if (!nome || !preco || !duracao_min) {
        return res.status(400).json({
            message: "Nome, pre�o e dura��o s�o obrigat�rios."
        });
    }

    const novoServico = {
        loja_id: lojaId, // vem do token (seguro)
        nome,
        descricao,
        preco,
        duracao_min,
        ativo: ativo ?? 1
    };

    Servicos.create(novoServico, (err, result) => {
        if (err) return responderErroInterno(res, err, "servicosController.criarServico");

        res.status(201).json({
            message: "Servi�o criado com sucesso!",
            id: result.insertId
        });
    });
};

//
// ===============================
// ATUALIZAR SERVI�O (S� DONO)
// ===============================
exports.atualizarServico = (req, res) => {

    const servicoId = req.params.id;
    const lojaId = req.usuario.loja_id;

    Servicos.getById(servicoId, (err, servico) => {

        if (err) return responderErroInterno(res, err, "servicosController.atualizarServico");

        if (!servico) {
            return res.status(404).json({ message: "Servi�o n�o encontrado." });
        }

        if (servico.loja_id !== lojaId) {
            return res.status(403).json({
                message: "Voc� n�o pode alterar este servi�o."
            });
        }

        Servicos.update(servicoId, req.body, (err) => {
            if (err) return responderErroInterno(res, err, "servicosController.atualizarServico");

            res.json({ message: "Servi�o atualizado com sucesso!" });
        });
    });
};

//
// ===============================
// DELETAR SERVI�O (S� DONO)
// ===============================
exports.deletarServico = (req, res) => {

    const servicoId = req.params.id;
    const lojaId = req.usuario.loja_id;

    Servicos.getById(servicoId, (err, servico) => {

        if (err) return responderErroInterno(res, err, "servicosController.deletarServico");

        if (!servico) {
            return res.status(404).json({ message: "Servi�o n�o encontrado." });
        }

        if (servico.loja_id !== lojaId) {
            return res.status(403).json({
                message: "Voc� n�o pode deletar este servi�o."
            });
        }

        Servicos.delete(servicoId, (err) => {
            if (err) return responderErroInterno(res, err, "servicosController.deletarServico");

            res.json({ message: "Servi�o deletado com sucesso!" });
        });
    });
};

// ===============================
// LISTAR SERVI�OS DO LOJISTA LOGADO
// ===============================
exports.listarMeusServicos = (req, res) => {
    const lojaId = req.usuario.loja_id;

    if (!lojaId) {
        return res.status(403).json({ message: 'Loja n�o identificada.' });
    }

    Servicos.getByLojaId(lojaId, (err, results) => {
        if (err) return responderErroInterno(res, err, "servicosController.listarMeusServicos");
        res.json(results);
    });
};
