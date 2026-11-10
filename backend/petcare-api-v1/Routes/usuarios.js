const express = require('express');
const router = express.Router();

const authController = require('../Controllers/authController');
const usuariosController = require('../Controllers/usuariosController');
const authMiddleware = require('../middlewares/authMiddleware');


router.get('/me', authMiddleware, authController.me);

router.put('/me', authMiddleware, usuariosController.atualizarMeuPerfil);

// LGPD: portabilidade e exclusão da própria conta
router.get('/me/dados', authMiddleware, usuariosController.exportarMeusDados);
router.delete('/me', authMiddleware, usuariosController.excluirMinhaConta);

module.exports = router;