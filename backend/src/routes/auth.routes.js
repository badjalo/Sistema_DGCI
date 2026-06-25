const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validateLogin, validateChangePassword } = require('../middleware/validators');

router.post('/login', validateLogin, ctrl.login);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.me);
router.put('/change-password', authenticate, validateChangePassword, ctrl.changePassword);
router.put('/profile', authenticate, ctrl.updateProfile);
router.post('/recuperar-senha', ctrl.recuperarSenha);
router.post('/redefinir-senha', ctrl.redefinirSenha);

// Admin: criar contas para todos os membros com email cadastrado
router.post('/provisionar-membros', authenticate, authorize('*'), ctrl.provisionarContasMembros);

module.exports = router;

