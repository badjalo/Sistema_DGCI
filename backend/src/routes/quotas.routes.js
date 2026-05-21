const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ctrl = require('../controllers/quotas.controller');

router.get('/config', authenticate, authorize('quotas:read'), ctrl.obterConfig);
router.post('/config', authenticate, authorize('quotas:create'), ctrl.definirConfig);
router.get('/situacao', authenticate, authorize('quotas:read'), ctrl.situacao);
router.post('/pagamentos', authenticate, authorize('pagamentos:create'), ctrl.registarPagamento);

module.exports = router;
