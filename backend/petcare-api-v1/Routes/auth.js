// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authController');
const emailConfirmationController = require('../Controllers/emailConfirmationController');
const recuperacaoSenhaController = require('../Controllers/recuperacaoSenhaController');
const {
    limitarLogin,
    limitarCadastro,
    limitarReenvioConfirmacao,
    limitarRecuperacaoSenha,
    limitarRedefinicaoSenha
} = require('../middlewares/rateLimitAuth');

// Rotas de autenticação
router.post('/register', limitarCadastro, emailConfirmationController.register);
router.post('/login', limitarLogin, authController.login);
router.get('/confirmar-email', emailConfirmationController.confirmarEmail);
router.post('/reenviar-confirmacao', limitarReenvioConfirmacao, emailConfirmationController.reenviarConfirmacao);
router.post('/register-lojista', limitarCadastro, authController.registerLojista);
router.post('/esqueci-senha', limitarRecuperacaoSenha, recuperacaoSenhaController.solicitar);
router.post('/redefinir-senha', limitarRedefinicaoSenha, recuperacaoSenhaController.redefinir);

module.exports = router;
