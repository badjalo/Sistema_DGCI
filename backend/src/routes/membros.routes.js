const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { fileTypeFromFile } = require('file-type');  // ✅ Validar tipo real do ficheiro
const sharp = require('sharp');  // ✅ Processar imagens com segurança
const ctrl = require('../controllers/membros.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'fotos';
    if (file.fieldname === 'assinatura') subDir = 'assinaturas';
    const dest = path.join(__dirname, `../../uploads/${subDir}`);
    try {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    } catch (err) {
      console.error('Erro ao criar pasta de uploads:', err);
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const prefix = file.fieldname === 'assinatura' ? 'assinatura' : 'membro';
    // ✅ Usar .webp (mais seguro) em vez de extensão original
    cb(null, `${prefix}_${uuidv4()}.webp`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },  // ✅ Reduzido para 3MB
  fileFilter: (req, file, cb) => {
    // ✅ Validar tipos MIME permitidos
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error(`Tipo de ficheiro não permitido: ${file.mimetype}`));
    }
    cb(null, true);
  }
});

// ✅ Configurar campos de upload
const uploadFields = upload.fields([
  { name: 'foto', maxCount: 1 },
  { name: 'assinatura', maxCount: 1 }
]);

// ✅ Middleware para processar e validar imagens após upload
const processUploadedImages = async (req, res, next) => {
  try {
    if (!req.files) return next();

    // Processar foto
    if (req.files.foto && req.files.foto[0]) {
      const filePath = req.files.foto[0].path;
      const fileName = req.files.foto[0].filename;

      try {
        // ✅ Validar tipo real do ficheiro (magic bytes, não MIME)
        const fileTypeResult = await fileTypeFromFile(filePath);
        if (!fileTypeResult || !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(fileTypeResult.mime)) {
          fs.unlinkSync(filePath);
          return res.status(400).json({ error: 'Tipo de imagem inválido' });
        }

        // ✅ Reprocessar com sharp (otimiza, remove metadados, valida integridade)
        const tempPath = filePath + '.tmp';
        await sharp(filePath)
          .webp({ quality: 85 })
          .toFile(tempPath);

        // Remover original e usar versão processada
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);

        console.log(`[UPLOAD] Foto processada: ${fileName}`);
      } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.error('[UPLOAD] Erro ao processar foto:', err.message);
        return res.status(400).json({ error: 'Erro ao processar imagem: ' + err.message });
      }
    }

    // Processar assinatura (similar)
    if (req.files.assinatura && req.files.assinatura[0]) {
      const filePath = req.files.assinatura[0].path;
      const fileName = req.files.assinatura[0].filename;

      try {
        const fileTypeResult = await fileTypeFromFile(filePath);
        if (!fileTypeResult || !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(fileTypeResult.mime)) {
          fs.unlinkSync(filePath);
          return res.status(400).json({ error: 'Tipo de assinatura inválido' });
        }

        const tempPath = filePath + '.tmp';
        await sharp(filePath)
          .webp({ quality: 85 })
          .toFile(tempPath);

        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);

        console.log(`[UPLOAD] Assinatura processada: ${fileName}`);
      } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.error('[UPLOAD] Erro ao processar assinatura:', err.message);
        return res.status(400).json({ error: 'Erro ao processar assinatura: ' + err.message });
      }
    }

    next();
  } catch (err) {
    console.error('[UPLOAD] Erro no middleware:', err);
    next(err);
  }
};

router.get('/estatisticas', authenticate, authorize('membros:read'), ctrl.estatisticas);
router.get('/', authenticate, authorize('membros:read'), ctrl.listar);
router.get('/next-numero', authenticate, authorize('membros:create'), ctrl.nextNumero);
router.post('/cartao/lote', authenticate, authorize('membros:read'), ctrl.obterCartoesLote);
router.get('/:id/cartao', authenticate, authorize('membros:read'), ctrl.obterCartao);
router.get('/:id/declaracao', authenticate, authorize('membros:read'), ctrl.declaracao);
router.get('/:id/qr', authenticate, authorize('membros:read'), ctrl.obterQR);
router.get('/qr/numero/:numero', authenticate, authorize('membros:read'), ctrl.obterQRByNumero);
router.get('/:id/pagamentos', authenticate, authorize('membros:read', 'quotas:read'), ctrl.pagamentosMembro);
router.get('/:id', authenticate, authorize('membros:read'), ctrl.obter);
router.post('/', authenticate, authorize('membros:create'), uploadFields, processUploadedImages, ctrl.criar);
router.put('/:id', authenticate, authorize('membros:update'), uploadFields, processUploadedImages, ctrl.atualizar);
router.delete('/:id', authenticate, authorize('membros:delete'), ctrl.eliminar);

module.exports = router;
