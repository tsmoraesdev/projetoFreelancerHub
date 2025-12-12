// inicio.js

const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const inicioController = require('../controllers/inicioController');

// 1. Aplica o middleware de autenticação a todas as rotas neste arquivo
router.use(auth);

// 2. Rota principal do dashboard (o caminho final será /api/inicio/ )
router.get('/', inicioController.getDashboardData); //

module.exports = router;