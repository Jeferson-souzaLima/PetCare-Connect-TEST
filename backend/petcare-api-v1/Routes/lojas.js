const express = require('express');
const router = express.Router();
const lojasController = require('../Controllers/lojasController');
const minhaLojaController = require('../Controllers/minhaLojaController');
const upload = require('../middlewares/uploadMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

// Rotas públicas
router.get('/', lojasController.listarLojas);
router.get('/minha', authMiddleware, authorizeRoles('lojista'), minhaLojaController.buscarMinhaLoja);
router.post('/minha', authMiddleware, authorizeRoles('lojista'), minhaLojaController.criarMinhaLoja);
router.put('/minha', authMiddleware, authorizeRoles('lojista'), minhaLojaController.atualizarMinhaLoja);
router.post('/minha/imagem', authMiddleware, authorizeRoles('lojista'), minhaLojaController.carregarMinhaLoja, upload.single('imagem'), minhaLojaController.atualizarImagemMinhaLoja);

// Rotas protegidas
router.post('/', authMiddleware, authorizeRoles('lojista'), minhaLojaController.criarMinhaLoja);
router.put('/:id', authMiddleware, lojasController.exigirDonoDaLojaOuAdmin, lojasController.atualizarLoja);
router.delete('/:id', authMiddleware, lojasController.exigirDonoDaLojaOuAdmin, lojasController.deletarLoja);

// Rota para buscar loja por ID (pública)
router.get(`/:id`, lojasController.getLojaPorId);

module.exports = router;
