// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authController');
const emailConfirmationController = require('../Controllers/emailConfirmationController');
const {
    limitarLogin,
    limitarCadastro,
    limitarReenvioConfirmacao
} = require('../middlewares/rateLimitAuth');

// Rotas de autenticação
router.post('/register', limitarCadastro, emailConfirmationController.register);
router.post('/login', limitarLogin, authController.login);
router.get('/confirmar-email', emailConfirmationController.confirmarEmail);
router.post('/reenviar-confirmacao', limitarReenvioConfirmacao, emailConfirmationController.reenviarConfirmacao);
router.post('/register-lojista', limitarCadastro, authController.registerLojista);

module.exports = router;
