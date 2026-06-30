const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/pesquisa.controller');

router.get('/', authenticate, ctrl.pesquisar);

module.exports = router;
