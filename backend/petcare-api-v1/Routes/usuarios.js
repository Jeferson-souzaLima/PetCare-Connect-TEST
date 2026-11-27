const express = require('express');
const router = express.Router();

const authController = require('../Controllers/authController');
const usuariosController = require('../Controllers/usuariosController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');


router.get('/me', authMiddleware, authController.me);

router.put('/me', authMiddleware, usuariosController.atualizarMeuPerfil);

// Foto de perfil (campo "foto": JPEG ou PNG, até 5 MB)
router.put('/me/foto', authMiddleware, upload.single('foto'), usuariosController.atualizarMinhaFoto);
router.delete('/me/foto', authMiddleware, usuariosController.removerMinhaFoto);

// LGPD: portabilidade e exclusão da própria conta
router.get('/me/dados', authMiddleware, usuariosController.exportarMeusDados);
router.delete('/me', authMiddleware, usuariosController.excluirMinhaConta);

module.exports = router;