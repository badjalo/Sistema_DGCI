const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ctrl = require('../controllers/membros.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '../../uploads/fotos');
    try {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    } catch (err) {
      console.error('Erro ao criar pasta de fotos:', err);
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `membro_${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas'));
  }
});

router.get('/estatisticas', authenticate, authorize('membros:read'), ctrl.estatisticas);
router.get('/', authenticate, authorize('membros:read'), ctrl.listar);
router.get('/next-numero', authenticate, authorize('membros:create'), ctrl.nextNumero);
router.get('/:id/cartao', authenticate, authorize('membros:read'), ctrl.obterCartao);
router.get('/:id/qr', authenticate, authorize('membros:read'), ctrl.obterQR);
router.get('/qr/numero/:numero', authenticate, authorize('membros:read'), ctrl.obterQRByNumero);
router.get('/:id/pagamentos', authenticate, authorize('membros:read', 'quotas:read'), ctrl.pagamentosMembro);
router.get('/:id', authenticate, authorize('membros:read'), ctrl.obter);
router.post('/', authenticate, authorize('membros:create'), upload.single('foto'), ctrl.criar);
router.put('/:id', authenticate, authorize('membros:update'), upload.single('foto'), ctrl.atualizar);
router.delete('/:id', authenticate, authorize('membros:delete'), ctrl.eliminar);

module.exports = router;
