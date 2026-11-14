const geolocalizacaoModel = require("../Models/geolocalizacaoModel");
const geocoding = require("../Services/geocodingService");
const { registrarErroInterno } = require('../utils/erroInterno');

exports.buscar = (req, res) => {

    const { latitude, longitude } = req.body;

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

    // ===============================
    // CAMPOS OBRIGATÓRIOS
    // ===============================
    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
            mensagem: "Latitude e longitude são obrigatórias."
        });
    }

    // ===============================
    // VALIDAR VALORES NUMÉRICOS
    // ===============================
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
            mensagem: "Latitude e longitude inválidas."
        });
    }

    // ===============================
    // BUSCAR LOJAS
    // ===============================
    geolocalizacaoModel.buscarLojas(

    lat,
    lng,
    page,
    limit,

    (err, lojas) => {

        if (err) {

            registrarErroInterno('geolocalizacaoController', err);

            return res.status(500).json({
                mensagem: "Erro ao buscar lojas próximas."
            });

        }

        geolocalizacaoModel.buscarProdutos(

        lat,
        lng,
        page,
        limit,

        (err, produtos) => {

                if (err) {

                    registrarErroInterno('geolocalizacaoController', err);

                    return res.status(500).json({
                        mensagem: "Erro ao buscar produtos próximos."
                    });

                }

                geolocalizacaoModel.buscarServicos(

                lat,
                lng,
                page,
                limit,

                (err, servicos) => {

                    if (err) {

                        registrarErroInterno('geolocalizacaoController', err);

                        return res.status(500).json({
                            mensagem: "Erro ao buscar serviços próximos."
                        });

                    }

                    return res.status(200).json({

                        lojas,

                        produtos,

                        servicos

                    });

                }

            );

            }

        );

    }

);

};

const TAMANHO_MAXIMO_BUSCA = 80;

function coordenadasValidas(latitude, longitude) {
    if (latitude === undefined || longitude === undefined || latitude === "" || longitude === "") return null;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return null;
    }
    return { lat, lng };
}

// GET /geolocalizacao/reverso?latitude=&longitude= → { cidade, uf }
exports.reverso = async (req, res) => {
    const coords = coordenadasValidas(req.query.latitude, req.query.longitude);
    if (!coords) {
        return res.status(400).json({ mensagem: "Latitude e longitude inválidas." });
    }
    try {
        const local = await geocoding.buscarCidadePorCoordenadas(coords.lat, coords.lng);
        if (!local) {
            return res.status(404).json({ mensagem: "Não encontramos uma cidade para esta localização." });
        }
        return res.status(200).json(local);
    } catch (err) {
        registrarErroInterno("geolocalizacaoController.reverso", err);
        return res.status(502).json({ mensagem: "Não foi possível identificar a cidade agora." });
    }
};

// GET /geolocalizacao/local?q=<CEP ou cidade> → { cidade, uf, latitude, longitude, cep? }
exports.local = async (req, res) => {
    const texto = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!texto || texto.length > TAMANHO_MAXIMO_BUSCA) {
        return res.status(400).json({ mensagem: "Informe um CEP ou o nome de uma cidade." });
    }
    try {
        const local = await geocoding.buscarCidade(texto);
        if (!local) {
            return res.status(404).json({ mensagem: "Não encontramos esse CEP ou cidade." });
        }
        return res.status(200).json(local);
    } catch (err) {
        if (err.message === "CEP inválido.") {
            return res.status(400).json({ mensagem: "CEP inválido." });
        }
        registrarErroInterno("geolocalizacaoController.local", err);
        return res.status(502).json({ mensagem: "Não foi possível buscar a localização agora." });
    }
};
