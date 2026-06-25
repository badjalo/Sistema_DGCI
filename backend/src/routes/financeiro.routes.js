const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ctrl = require('../controllers/financeiro.controller');

router.get('/resumo', authenticate, authorize('financeiro:read'), ctrl.resumo);
router.get('/receitas', authenticate, authorize('financeiro:read'), ctrl.listarReceitas);
router.post('/receitas', authenticate, authorize('financeiro:create'), ctrl.criarReceita);
router.get('/despesas', authenticate, authorize('financeiro:read'), ctrl.listarDespesas);
router.post('/despesas', authenticate, authorize('financeiro:create'), ctrl.criarDespesa);
router.get('/bancos', authenticate, authorize('financeiro:read'), ctrl.listarBancos);
router.get('/categorias', authenticate, authorize('financeiro:read'), ctrl.listarCategorias);
router.get('/transparencia', authenticate, authorize('transparencia:read'), ctrl.transparencia);

module.exports = router;
