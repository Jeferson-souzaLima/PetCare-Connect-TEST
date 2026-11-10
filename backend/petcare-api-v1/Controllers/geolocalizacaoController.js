const geolocalizacaoModel = require("../Models/geolocalizacaoModel");
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
