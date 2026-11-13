const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

// Todas as rotas deste módulo são exclusivas do administrador.
router.use(authMiddleware, authorizeRoles('admin'));

router.get('/lojas', adminController.listarLojas);
router.patch('/lojas/:id', adminController.definirSituacaoLoja);
router.get('/usuarios', adminController.listarUsuarios);
router.get('/pedidos', adminController.listarPedidos);
router.post('/pedidos/:id/cancelar', adminController.cancelarPedido);

module.exports = router;
