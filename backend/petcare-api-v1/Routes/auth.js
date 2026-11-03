// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authController');
const emailConfirmationController = require('../Controllers/emailConfirmationController');

// Rotas de autenticação
router.post('/register', emailConfirmationController.register);
router.post('/login', emailConfirmationController.validarEmailConfirmado, authController.login);
router.get('/confirmar-email', emailConfirmationController.confirmarEmail);
router.post('/reenviar-confirmacao', emailConfirmationController.reenviarConfirmacao);
router.post('/register-lojista', authController.registerLojista);

module.exports = router;
