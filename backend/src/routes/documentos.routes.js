const router = require('express').Router();
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { query } = require('../config/database');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '../../uploads/documentos');
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `doc_${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ─── ROTA PÚBLICA (sem autenticação) para documentos públicos ─────────────────
router.get('/publicos', async (req, res, next) => {
  try {
    const { tipo, search = '' } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (tipo) {
      params.push(tipo);
      where += ` AND d.tipo = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND d.titulo ILIKE $${params.length}`;
    }
    const result = await query(`
      SELECT d.id, d.titulo, d.tipo, d.descricao, d.ficheiro_url, d.ficheiro_nome, 
             d.ficheiro_tamanho, d.ficheiro_tipo,
             to_char(d.criado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as criado_em
      FROM documentos d
      ${where} ORDER BY d.criado_em DESC
    `, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/', authenticate, authorize('documentos:read'), async (req, res, next) => {
  try {
    const { tipo, search = '' } = req.query;
    let where = 'WHERE 1=1'; const params = [];
    if (tipo) { params.push(tipo); where += ` AND d.tipo = $${params.length}`; }
    if (search) { params.push(`%${search}%`); where += ` AND d.titulo ILIKE $${params.length}`; }
    const result = await query(`
      SELECT d.*, u.nome as carregado_por_nome, m.nome_completo as membro_nome
      FROM documentos d
      LEFT JOIN utilizadores u ON u.id = d.carregado_por
      LEFT JOIN membros m ON m.id = d.membro_id
      ${where} ORDER BY d.criado_em DESC
    `, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('documentos:create'), upload.single('ficheiro'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Ficheiro obrigatório' });
    const { titulo, tipo, descricao, membro_id, departamento_id, publico } = req.body;
    const ficheiro_url = `/uploads/documentos/${req.file.filename}`;
    const result = await query(
      `INSERT INTO documentos (titulo, tipo, descricao, ficheiro_url, ficheiro_nome, ficheiro_tamanho, ficheiro_tipo, membro_id, departamento_id, publico, carregado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [titulo, tipo || 'outro', descricao, ficheiro_url, req.file.originalname, req.file.size, req.file.mimetype, membro_id || null, departamento_id || null, publico === 'true', req.user.id]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('documentos:delete'), async (req, res, next) => {
  try {
    const result = await query('DELETE FROM documentos WHERE id = $1 RETURNING titulo', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Documento não encontrado' });
    res.json({ success: true, message: `Documento "${result.rows[0].titulo}" eliminado` });
  } catch (err) { next(err); }
});

module.exports = router;
