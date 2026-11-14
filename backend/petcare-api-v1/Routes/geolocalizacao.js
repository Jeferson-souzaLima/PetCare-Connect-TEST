const express = require("express");

const router = express.Router();

const auth = require("../middlewares/authMiddleware");

const geolocalizacaoController = require("../Controllers/geolocalizacaoController");
const { limitarConsultaLocalizacao } = require("../middlewares/rateLimitAuth");

// Públicas: transformam coordenadas em cidade e CEP/cidade em coordenadas.
router.get("/reverso", limitarConsultaLocalizacao, geolocalizacaoController.reverso);
router.get("/local", limitarConsultaLocalizacao, geolocalizacaoController.local);

router.post(
    "/",
    auth,
    geolocalizacaoController.buscar
);

module.exports = router;