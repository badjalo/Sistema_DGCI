const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ctrl = require('../controllers/votacoes.controller');

router.get('/', authenticate, authorize('votacoes:read'), ctrl.listarVotacoes);
router.get('/:id', authenticate, authorize('votacoes:read'), ctrl.obterVotacao);
router.post('/', authenticate, authorize('votacoes:create'), ctrl.criarVotacao);
router.put('/:id', authenticate, authorize('votacoes:update'), ctrl.atualizarVotacao);
router.delete('/:id', authenticate, authorize('votacoes:delete'), ctrl.eliminarVotacao);
router.post('/:id/votar', authenticate, authorize('votacoes:votar'), ctrl.votar);

module.exports = router;
