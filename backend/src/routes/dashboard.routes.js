const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ctrl = require('../controllers/dashboard.controller');

router.get('/resumo', authenticate, authorize('dashboard:read'), ctrl.resumo);

module.exports = router;
