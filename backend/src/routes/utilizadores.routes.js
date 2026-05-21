const router = require('express').Router();
const ctrl = require('../controllers/utilizadores.controller');
const { authenticate } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');

router.get('/', authenticate, adminOnly, ctrl.listar);
router.post('/', authenticate, adminOnly, ctrl.criar);
router.put('/:id', authenticate, adminOnly, ctrl.atualizar);
router.delete('/:id', authenticate, adminOnly, ctrl.eliminar);
router.put('/:id/reset-password', authenticate, adminOnly, ctrl.resetPassword);

module.exports = router;
