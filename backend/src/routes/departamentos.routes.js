const router = require('express').Router();
const ctrl = require('../controllers/departamentos.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', authenticate, authorize('departamentos:read'), ctrl.listar);
router.get('/:id', authenticate, authorize('departamentos:read'), ctrl.obter);
router.post('/', authenticate, authorize('departamentos:create'), ctrl.criar);
router.put('/:id', authenticate, authorize('departamentos:update'), ctrl.atualizar);
router.delete('/:id', authenticate, authorize('departamentos:delete'), ctrl.eliminar);

module.exports = router;
