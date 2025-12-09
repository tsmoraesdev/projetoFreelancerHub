const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/clientsController');

router.use(auth); // Protege todas as rotas de clientes
router.get('/', controller.list);
router.post('/', controller.create);

router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;