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
router.get('/financeiro', adminController.obterFinanceiro);
router.get('/rankings', adminController.obterRankings);
router.get('/estornos', adminController.listarEstornos);
router.post('/estornos/:id/tentar', adminController.tentarEstorno);

module.exports = router;
