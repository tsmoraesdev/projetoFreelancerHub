const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/tasksController');

router.use(auth);

// ROTAS ATUALIZADAS PARA O KANBAN:

// 1. Listagem: Permite um query parameter 'projectId' para filtrar as tarefas.
router.get('/', controller.list);

// 2. Criação: Ajustado para usar a rota raiz POST, o project_id deve ser passado no body.
router.post('/', controller.create);

router.get('/:id', controller.get);

// 3. Atualização Completa: Permite a mudança de todos os campos, incluindo status ou project_id.
router.put('/:id', controller.update);

// 4. Atualização Rápida de Status: Otimizado para o Drag and Drop (D&D) do Kanban.
router.patch('/:id/status', controller.updateStatus);

router.delete('/:id', controller.remove);

module.exports = router;