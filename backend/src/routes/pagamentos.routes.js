const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ctrl = require('../controllers/quotas.controller');

router.get('/', authenticate, authorize('pagamentos:read'), ctrl.listarPagamentos);
router.post('/', authenticate, authorize('pagamentos:create'), ctrl.registarPagamento);

module.exports = router;
