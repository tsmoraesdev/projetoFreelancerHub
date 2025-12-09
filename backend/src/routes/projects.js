const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/projectsController');

router.use(auth); // Protege todas as rotas de projetos
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get); // Necessário para Kanban.jsx
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;