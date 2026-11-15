const express = require('express');
const router = express.Router();
const pedidosController = require('../Controllers/pedidosController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

// ===============================
// CLIENTE
// ===============================

// Criar pedido
router.post('/calcular-frete', authMiddleware, authorizeRoles('cliente'), pedidosController.calcularFrete);
router.post('/checkout', authMiddleware, authorizeRoles('cliente'), pedidosController.checkout);

// Ver meus pedidos
router.get('/meus', authMiddleware, authorizeRoles('cliente'), pedidosController.getMeusPedidos);
router.post('/:id/cancelar', authMiddleware, authorizeRoles('cliente'), pedidosController.cancelarPeloCliente);

// ===============================
// LOJISTA
// ===============================

// Ver pedidos da minha loja
router.get('/loja', authMiddleware, authorizeRoles('lojista'), pedidosController.getPedidosLoja);

// Atualizar status do pedido
router.put('/:id/status', authMiddleware, authorizeRoles('lojista'), pedidosController.updateStatus);

// Relat�rio da loja
router.get('/relatorio', authMiddleware, authorizeRoles('lojista'), pedidosController.relatorioPedidos);

// ===============================
// ADMIN (o painel usa /admin/pedidos)
// ===============================

router.delete('/:id', authMiddleware, authorizeRoles('admin'), pedidosController.deletarPedido);

module.exports = router;