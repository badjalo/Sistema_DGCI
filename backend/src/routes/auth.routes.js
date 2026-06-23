const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validateLogin, validateChangePassword } = require('../middleware/validators');

router.post('/login', validateLogin, ctrl.login);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.me);
router.put('/change-password', authenticate, validateChangePassword, ctrl.changePassword);
router.put('/profile', authenticate, ctrl.updateProfile);
router.post('/recuperar-senha', ctrl.recuperarSenha);
router.post('/redefinir-senha', ctrl.redefinirSenha);


module.exports = router;

