const express = require('express');
const router = express.Router();
const petsController = require('../Controllers/petsController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Todas as rotas de pets precisam do usu�rio logado
router.use(authMiddleware);

// CRUD
router.post('/', upload.single('imagem'), petsController.criarPet);
router.get('/', petsController.listarPetsDoUsuario);
router.get('/opcoes', petsController.listarOpcoes);
router.put('/:id', upload.single('imagem'), petsController.atualizarPet);
router.delete('/:id', petsController.deletarPet);

// Upload de imagem opcional
router.post('/:id/imagem', upload.single('imagem'), petsController.uploadImagem);

module.exports = router;