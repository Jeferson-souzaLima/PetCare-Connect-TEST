const express = require('express');
const router = express.Router();
const controller = require('../Controllers/mercadoPagoContaController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

// Conta Mercado Pago da loja do lojista autenticado
router.get('/conta', authMiddleware, authorizeRoles('lojista'), controller.status);
router.post('/conta/conectar', authMiddleware, authorizeRoles('lojista'), controller.conectar);
router.delete('/conta', authMiddleware, authorizeRoles('lojista'), controller.desconectar);

// Retorno do OAuth: aberto pelo navegador, a loja vem do state assinado
router.get('/oauth/retorno', controller.retorno);

module.exports = router;
