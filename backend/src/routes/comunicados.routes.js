const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { fileTypeFromFile } = require('file-type');
const sharp = require('sharp');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { query } = require('../config/database');
const ctrl = require('../controllers/comunicados.controller');

// ─── MIGRAÇÃO: adicionar colunas e atualizar ENUM ──────────────────────────────
const runMigrations = async () => {
  try {
    // Adicionar coluna foto_url se não existir
    await query(`ALTER TABLE comunicados ADD COLUMN IF NOT EXISTS foto_url TEXT`);
    await query(`ALTER TABLE comunicados ADD COLUMN IF NOT EXISTS nome_falecido VARCHAR(300)`);

    // Adicionar 'obito' ao ENUM tipo_comunicado (seguro se já existir)
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'obito'
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tipo_comunicado')
        ) THEN
          ALTER TYPE tipo_comunicado ADD VALUE 'obito';
        END IF;
      END$$
    `);
  } catch (e) {
    console.warn('[Comunicados] Migração:', e.message);
  }
};
runMigrations();

// ─── MULTER — Upload de Fotos de Óbito ──────────────────────────────────────
const obituarioDir = path.join(__dirname, '../../uploads/obituario');
if (!fs.existsSync(obituarioDir)) fs.mkdirSync(obituarioDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, obituarioDir),
  filename: (req, file, cb) => cb(null, `obito_${uuidv4()}.webp`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens são permitidas'));
    }
    cb(null, true);
  },
});

// Middleware para processar e otimizar imagens
const processUploadedImages = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const filePath = req.file.path;
    const tempPath = filePath + '.tmp';

    // Validar tipo real do ficheiro (magic bytes)
    const fileTypeResult = await fileTypeFromFile(filePath);
    if (!fileTypeResult || !fileTypeResult.mime.startsWith('image/')) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Tipo de imagem inválido' });
    }

    // Otimizar e redimensionar com sharp
    let pipeline = sharp(filePath);
    if (req.body.tipo === 'obito') {
      pipeline = pipeline.resize(800, 800, { fit: 'inside', withoutEnlargement: true });
    } else {
      pipeline = pipeline.resize(1200, 1200, { fit: 'inside', withoutEnlargement: true });
    }

    await pipeline
      .webp({ quality: 82 })
      .toFile(tempPath);

    fs.unlinkSync(filePath);
    fs.renameSync(tempPath, filePath);
    next();
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('[UPLOAD] Erro ao processar imagem de comunicado:', err);
    return res.status(400).json({ error: 'Erro ao processar imagem: ' + err.message });
  }
};

// ─── ROTA PÚBLICA (sem autenticação) para comunicados publicados ─────────────
router.get('/publicos', async (req, res, next) => {
  try {
    const { tipo, search = '' } = req.query;
    let where = "WHERE c.estado = 'publicado'";
    const params = [];
    if (tipo) {
      params.push(tipo);
      where += ` AND c.tipo = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND c.titulo ILIKE $${params.length}`;
    }
    const result = await query(`
      SELECT c.id, c.titulo, c.tipo, c.conteudo, c.urgente, c.foto_url, c.nome_falecido,
             to_char(c.data_publicacao AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_publicacao,
             to_char(c.criado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as criado_em,
             u.nome as autor_nome
      FROM comunicados c
      LEFT JOIN utilizadores u ON u.id = c.autor_id
      ${where} ORDER BY c.data_publicacao DESC NULLS LAST, c.criado_em DESC
    `, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/resumo-tipos', authenticate, authorize('comunicados:read'), ctrl.resumoTipos);
router.get('/', authenticate, authorize('comunicados:read'), ctrl.listar);

// Criar comunicado (com upload opcional de foto para óbito)
router.post('/', authenticate, authorize('comunicados:create'), upload.single('foto'), processUploadedImages, ctrl.criar);

// Atualizar comunicado (com upload opcional de foto para óbito)
router.put('/:id', authenticate, authorize('comunicados:update'), upload.single('foto'), processUploadedImages, ctrl.atualizar);

router.delete('/:id', authenticate, authorize('comunicados:delete'), ctrl.eliminar);

module.exports = router;
