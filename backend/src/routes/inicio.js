// inicio.js

const router = require('express').Router();
// Alterado para 'auth' para seguir o padrão de 'clients.js'
const auth = require('../middleware/authMiddleware');
const inicioController = require('./controllers/inicioController');
// ... outros controllers (se houver)

// 1. Aplica o middleware de autenticação a todas as rotas neste arquivo
router.use(auth);

// 2. Rota principal do dashboard (o caminho final será /api/inicio/ )
// O '/' aqui será mapeado para o prefixo que você definir no seu arquivo principal (app.js ou server.js)
router.get('/', inicioController.getDashboardData); //

// ... outras rotas (se houver)
module.exports = router;