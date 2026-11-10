const axios = require("axios");

exports.buscarPorCep = async (cep) => {
    const cepNormalizado = String(cep || "").replace(/\D/g, "");

    if (!/^\d{8}$/.test(cepNormalizado)) {
        throw new Error("CEP inválido.");
    }

    try {
        const response = await axios.get(
            `https://viacep.com.br/ws/${cepNormalizado}/json/`,
            { timeout: 5000 }
        );

        const dados = response.data;

        if (dados.erro) {
            return null;
        }

        return {
            cep: dados.cep,
            logradouro: dados.logradouro || "",
            bairro: dados.bairro || "",
            cidade: dados.localidade || "",
            uf: dados.uf || ""
        };

    } catch (err) {
        console.error(
            "Erro ao consultar CEP:",
            err.response?.data || err.message
        );

        throw new Error("Não foi possível consultar o CEP.");
    }
};