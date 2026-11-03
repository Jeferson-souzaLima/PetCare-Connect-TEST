const express = require('express');

const router = express.Router();

const pagamentosController = require('../Controllers/pagamentosController');

const authMiddleware = require('../middlewares/authMiddleware');

// ===============================
// MERCADO PAGO – WEBHOOK
// ===============================

router.post(
    '/webhook',
    pagamentosController.webhook
);


// ===============================
// PAGAMENTO – buscar por ID
// ===============================

router.get(
    '/:id',
    authMiddleware,
    pagamentosController.getById
);


// ===============================
// PAGAMENTO – buscar por referência
// ===============================

router.get(
    '/referencia/:tipo/:referencia_id',
    authMiddleware,
    pagamentosController.getByReferencia
);

router.post(
    '/agendamento/:agendamento_id',
    authMiddleware,
    pagamentosController.iniciarPagamentoAgendamento
);


module.exports = router;