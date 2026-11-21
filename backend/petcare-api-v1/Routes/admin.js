const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');
const upload = require('../middlewares/uploadMiddleware');

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
router.get('/lojas/:id/catalogo', adminController.obterCatalogoDaLoja);
router.post('/lojas/:id/imagem', upload.single('imagem'), adminController.enviarImagemLoja);
router.post('/produtos/:id/imagens', upload.array('imagens', 10), adminController.enviarImagensProduto);

module.exports = router;
