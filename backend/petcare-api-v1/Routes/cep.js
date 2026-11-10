const express = require("express");
const router = express.Router();

const cepService = require("../Services/cepService");
const { limitarConsultaCep } = require("../middlewares/rateLimitAuth");

router.get("/:cep", limitarConsultaCep, async (req, res) => {
    try {
        const dados = await cepService.buscarPorCep(req.params.cep);

        if (!dados) {
            return res.status(404).json({
                mensagem: "CEP não encontrado."
            });
        }

        return res.status(200).json(dados);

    } catch (err) {
        console.error("Erro na consulta de CEP:", err.message);

        if (err.message === "CEP inválido.") {
            return res.status(400).json({
                mensagem: "CEP inválido."
            });
        }

        return res.status(502).json({
            mensagem: "Não foi possível consultar o CEP."
        });
    }
});

module.exports = router;