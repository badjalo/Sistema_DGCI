const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { fileTypeFromFile } = require('file-type');
const sharp = require('sharp');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Configuração do Multer para uploads de imagens do slider
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/slider');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `slide_${uuidv4()}.webp`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

// Middleware para processar e otimizar imagem do slider
const processUploadedImages = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const filePath = req.file.path;
    const tempPath = filePath + '.tmp';

    // Validar tipo real do ficheiro
    const fileTypeResult = await fileTypeFromFile(filePath);
    if (!fileTypeResult || !fileTypeResult.mime.startsWith('image/')) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Tipo de imagem inválido' });
    }

    // Redimensionar para max-width 1600px e otimizar para webp
    await sharp(filePath)
      .resize(1600, 1000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(tempPath);

    fs.unlinkSync(filePath);
    fs.renameSync(tempPath, filePath);
    next();
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('[UPLOAD] Erro ao processar slide:', err);
    return res.status(400).json({ error: 'Erro ao processar imagem: ' + err.message });
  }
};

// ─── ROTA PÚBLICA ─────────────────────────────────────────────────────────────
// Obtém os slides ativos para a Landing Page
router.get('/public', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM landing_slider WHERE ativo = true ORDER BY ordem ASC, id DESC');
    res.json({ success: true, data: result.rows || result });
  } catch (err) {
    next(err);
  }
});

// ─── ROTAS ADMIN ──────────────────────────────────────────────────────────────
router.use(authenticate);

// Listar todos os slides (incluindo inativos)
router.get('/', authorize('configuracoes:read', 'configuracoes:update'), async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM landing_slider ORDER BY ordem ASC, id DESC');
    res.json({ success: true, data: result.rows || result });
  } catch (err) {
    next(err);
  }
});

// Criar novo slide
router.post('/', authorize('configuracoes:update'), upload.single('imagem'), processUploadedImages, async (req, res, next) => {
  try {
    const { titulo, descricao, link_url, ativo, ordem } = req.body;
    let imagem_url = null;

    if (req.file) {
      imagem_url = `/uploads/slider/${req.file.filename}`;
    }

    if (!imagem_url && !req.body.imagem_url) {
      return res.status(400).json({ error: 'Imagem é obrigatória' });
    }

    const finalImage = imagem_url || req.body.imagem_url;

    const result = await query(
      `INSERT INTO landing_slider (titulo, descricao, imagem_url, link_url, ativo, ordem) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [titulo, descricao || '', finalImage, link_url || '', ativo === 'false' ? false : true, parseInt(ordem) || 0]
    );

    res.status(201).json({ success: true, message: 'Slide criado com sucesso', id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

// Atualizar slide
router.put('/:id', authorize('configuracoes:update'), upload.single('imagem'), processUploadedImages, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, link_url, ativo, ordem } = req.body;
    
    // Obter slide atual
    const current = await query('SELECT * FROM landing_slider WHERE id = $1', [id]);
    const currentSlide = (current.rows || current)[0];
    
    if (!currentSlide) return res.status(404).json({ error: 'Slide não encontrado' });

    let imagem_url = currentSlide.imagem_url;
    if (req.file) {
      imagem_url = `/uploads/slider/${req.file.filename}`;
    } else if (req.body.imagem_url) {
      imagem_url = req.body.imagem_url;
    }

    await query(
      `UPDATE landing_slider 
       SET titulo = $1, descricao = $2, imagem_url = $3, link_url = $4, ativo = $5, ordem = $6 
       WHERE id = $7`,
      [titulo, descricao || '', imagem_url, link_url || '', ativo === 'false' || ativo === false ? false : true, parseInt(ordem) || 0, id]
    );

    res.json({ success: true, message: 'Slide atualizado com sucesso' });
  } catch (err) {
    next(err);
  }
});

// Apagar slide
router.delete('/:id', authorize('configuracoes:update'), async (req, res, next) => {
  try {
    await query('DELETE FROM landing_slider WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Slide apagado com sucesso' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
