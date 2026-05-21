const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ctrl = require('../controllers/comunicados.controller');

router.get('/resumo-tipos', authenticate, authorize('comunicados:read'), ctrl.resumoTipos);
router.get('/', authenticate, authorize('comunicados:read'), ctrl.listar);
router.post('/', authenticate, authorize('comunicados:create'), ctrl.criar);
router.put('/:id', authenticate, authorize('comunicados:update'), ctrl.atualizar);
router.delete('/:id', authenticate, authorize('comunicados:delete'), ctrl.eliminar);

module.exports = router;
