const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/billingProfileController');

router.use(auth); // Protege todas as rotas do perfil

// GET /api/profile -> Buscar o perfil
router.get('/', controller.getProfile);

// POST /api/profile -> Criar/Atualizar o perfil (Usamos POST ou PUT para o UPSERT)
// POST é comum para a primeira criação (se o frontend não souber o ID)
router.post('/', controller.saveOrUpdate);
// Uma alternativa mais RESTful, caso o frontend sempre use o mesmo endpoint:
// router.put('/', controller.saveOrUpdate); 

module.exports = router;