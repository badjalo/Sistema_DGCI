const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { fileTypeFromFile } = require('file-type');
const sharp = require('sharp');
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

// ─── MULTER — Upload de Fotos dos Membros da Direção ─────────────────────────
const fotoDirecaoDir = path.join(__dirname, '../../uploads/direcao');
if (!fs.existsSync(fotoDirecaoDir)) fs.mkdirSync(fotoDirecaoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, fotoDirecaoDir),
  filename: (req, file, cb) => cb(null, `direcao_${uuidv4()}.webp`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Apenas imagens JPG, PNG ou WebP são permitidas'));
    }
    cb(null, true);
  }
});

// ─── INIT TABLES ──────────────────────────────────────────────────────────────
const initTables = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS sindicato_info (
      chave VARCHAR(100) PRIMARY KEY,
      valor TEXT,
      atualizado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS direcao_membros (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      cargo VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      telefone VARCHAR(50),
      iniciais VARCHAR(5),
      cor VARCHAR(100) DEFAULT 'from-blue-600 to-indigo-600',
      foto_url VARCHAR(500),
      ordem INTEGER DEFAULT 0,
      ativo BOOLEAN DEFAULT true,
      criado_em TIMESTAMPTZ DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Adicionar coluna foto_url se não existir (migração segura)
  try {
    await query(`ALTER TABLE direcao_membros ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500)`);
  } catch (e) { /* coluna já existe */ }

  // Inserir dados padrão se tabelas estiverem vazias
  const infoCount = await query('SELECT COUNT(*) FROM sindicato_info');
  if (parseInt(infoCount.rows[0].count) === 0) {
    const defaults = [
      ['presidente_nome', 'Dr. António Silva'],
      ['presidente_cargo', 'Presidente da Direção'],
      ['presidente_iniciais', 'AS'],
      ['presidente_mensagem', 'Estimados associados e colegas da Direção-Geral dos Impostos e das Alfândegas,\n\nÉ com enorme orgulho e sentido de responsabilidade que lidero esta instituição. O nosso compromisso diário assenta na salvaguarda dos direitos socioprofissionais de cada membro, promovendo a solidariedade, transparência e excelência no cumprimento das nossas funções sindicais.\n\nEnfrentamos desafios constantes num setor em rápida transformação. No entanto, é na nossa união e na solidez da nossa estrutura orgânica que encontramos a força para negociar melhores condições de trabalho, apoio social digno e representatividade perante os órgãos de tutela.\n\nJuntos, continuamos a construir um sindicato mais forte, moderno e focado no futuro.'],
      ['presidente_lema', '"Pela união e integridade dos nossos trabalhadores"'],
      ['organigrama_assembleia_geral', 'Órgão máximo de deliberação composto por todos os associados em pleno gozo dos seus direitos.'],
      ['organigrama_direcao_nacional', 'Órgão executivo responsável pela representação política, jurídica e administrativa do Sindicato, gerindo o plano de atividades.'],
      ['organigrama_conselho_fiscal', 'Órgão autónomo de controlo financeiro, responsável por analisar e emitir pareceres sobre as contas e património do Sindicato.'],
      ['organigrama_assembleia_delegados', 'Representação direta de delegados sindicais por departamentos para descentralização das discussões locais.'],
      ['organigrama_delegacoes_regionais', 'Estruturas locais de proximidade focadas no atendimento personalizado e apoio direto nas alfândegas e repartições de finanças.'],
    ];
    for (const [chave, valor] of defaults) {
      await query('INSERT INTO sindicato_info (chave, valor) VALUES ($1, $2) ON CONFLICT (chave) DO NOTHING', [chave, valor]);
    }
  }

  const membrosCount = await query('SELECT COUNT(*) FROM direcao_membros');
  if (parseInt(membrosCount.rows[0].count) === 0) {
    const defaultMembros = [
      ['Maria Eduarda Santos', 'Vice-Presidente', 'maria.santos@sindicato.pt', '', 'MS', 'from-blue-600 to-indigo-600', 1],
      ['Dr. João Carlos Costa', 'Secretário-Geral', 'joao.costa@sindicato.pt', '', 'JC', 'from-indigo-600 to-purple-600', 2],
      ['Dra. Ana Rita Rodrigues', 'Tesoureira', 'ana.rodrigues@sindicato.pt', '', 'AR', 'from-purple-600 to-pink-600', 3],
      ['Carlos Manuel Sousa', 'Vogal de Apoio ao Associado', 'carlos.sousa@sindicato.pt', '', 'CS', 'from-pink-600 to-red-600', 4],
    ];
    for (const [nome, cargo, email, telefone, iniciais, cor, ordem] of defaultMembros) {
      await query(
        'INSERT INTO direcao_membros (nome, cargo, email, telefone, iniciais, cor, ordem) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [nome, cargo, email, telefone, iniciais, cor, ordem]
      );
    }
  }
};

initTables().catch(err => console.error('[Sindicato] Erro ao iniciar tabelas:', err.message));

// ─── Servir fotos públicas da direção ────────────────────────────────────────
router.get('/foto/:filename', (req, res) => {
  const { filename } = req.params;
  // Segurança: apenas ficheiros dentro de direcao/
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Nome de ficheiro inválido' });
  }
  const filePath = path.join(fotoDirecaoDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Foto não encontrada' });
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(filePath);
});

// ─── PUBLIC: Obter dados do sindicato ─────────────────────────────────────────
router.get('/public', async (req, res, next) => {
  try {
    const [infoResult, membrosResult] = await Promise.all([
      query('SELECT chave, valor FROM sindicato_info'),
      query('SELECT * FROM direcao_membros WHERE ativo = true ORDER BY ordem ASC, id ASC'),
    ]);
    const info = {};
    infoResult.rows.forEach(r => { info[r.chave] = r.valor; });
    res.json({ success: true, data: { info, membros: membrosResult.rows } });
  } catch (err) { next(err); }
});

// ─── ADMIN: Obter dados ───────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [infoResult, membrosResult] = await Promise.all([
      query('SELECT chave, valor FROM sindicato_info'),
      query('SELECT * FROM direcao_membros ORDER BY ordem ASC, id ASC'),
    ]);
    const info = {};
    infoResult.rows.forEach(r => { info[r.chave] = r.valor; });
    res.json({ success: true, data: { info, membros: membrosResult.rows } });
  } catch (err) { next(err); }
});

// ─── ADMIN: Atualizar info ────────────────────────────────────────────────────
router.put('/info', authenticate, async (req, res, next) => {
  try {
    const updates = req.body;
    for (const [chave, valor] of Object.entries(updates)) {
      await query(
        `INSERT INTO sindicato_info (chave, valor) VALUES ($1, $2)
         ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = NOW()`,
        [chave, String(valor)]
      );
    }
    res.json({ success: true, message: 'Informações atualizadas com sucesso' });
  } catch (err) { next(err); }
});

// ─── ADMIN: Upload de foto do presidente ─────────────────────────────────────
router.post('/presidente/foto', authenticate, upload.single('foto'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
  const filePath = req.file.path;
  try {
    // Validar tipo real
    const ft = await fileTypeFromFile(filePath);
    if (!ft || !['image/jpeg','image/png','image/webp'].includes(ft.mime)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Tipo de imagem inválido' });
    }
    // Processar com sharp — 400×400, crop centralizado
    const tempPath = filePath + '.tmp';
    await sharp(filePath).resize(400, 400, { fit: 'cover', position: 'center' }).webp({ quality: 88 }).toFile(tempPath);
    fs.unlinkSync(filePath);
    fs.renameSync(tempPath, filePath);

    const fotoUrl = `/api/sindicato/foto/${req.file.filename}`;
    await query(
      `INSERT INTO sindicato_info (chave, valor) VALUES ('presidente_foto_url', $1)
       ON CONFLICT (chave) DO UPDATE SET valor = $1, atualizado_em = NOW()`,
      [fotoUrl]
    );
    res.json({ success: true, foto_url: fotoUrl });
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    next(err);
  }
});

// ─── ADMIN: Criar membro ──────────────────────────────────────────────────────
router.post('/membros', authenticate, async (req, res, next) => {
  try {
    const { nome, cargo, email, telefone, iniciais, cor, ordem } = req.body;
    if (!nome || !cargo) return res.status(400).json({ success: false, error: 'Nome e cargo são obrigatórios' });
    const computedIniciais = iniciais || nome.split(' ').slice(0, 2).map(n => n[0].toUpperCase()).join('');
    const result = await query(
      `INSERT INTO direcao_membros (nome, cargo, email, telefone, iniciais, cor, ordem)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nome, cargo, email || '', telefone || '', computedIniciais, cor || 'from-blue-600 to-indigo-600', ordem || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

// ─── ADMIN: Upload foto de membro ─────────────────────────────────────────────
router.post('/membros/:id/foto', authenticate, upload.single('foto'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
  const filePath = req.file.path;
  const { id } = req.params;
  try {
    const ft = await fileTypeFromFile(filePath);
    if (!ft || !['image/jpeg','image/png','image/webp'].includes(ft.mime)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Tipo de imagem inválido' });
    }

    // Processar: 400×400, crop centralizado
    const tempPath = filePath + '.tmp';
    await sharp(filePath).resize(400, 400, { fit: 'cover', position: 'center' }).webp({ quality: 88 }).toFile(tempPath);
    fs.unlinkSync(filePath);
    fs.renameSync(tempPath, filePath);

    // Apagar foto antiga se existir
    const existing = await query('SELECT foto_url FROM direcao_membros WHERE id = $1', [id]);
    if (existing.rows[0]?.foto_url) {
      const oldFile = path.join(fotoDirecaoDir, path.basename(existing.rows[0].foto_url));
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }

    const fotoUrl = `/api/sindicato/foto/${req.file.filename}`;
    const result = await query(
      'UPDATE direcao_membros SET foto_url = $1, atualizado_em = NOW() WHERE id = $2 RETURNING *',
      [fotoUrl, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Membro não encontrado' });
    res.json({ success: true, foto_url: fotoUrl, data: result.rows[0] });
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    next(err);
  }
});

// ─── ADMIN: Remover foto de membro ───────────────────────────────────────────
router.delete('/membros/:id/foto', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT foto_url FROM direcao_membros WHERE id = $1', [id]);
    if (existing.rows[0]?.foto_url) {
      const oldFile = path.join(fotoDirecaoDir, path.basename(existing.rows[0].foto_url));
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }
    await query('UPDATE direcao_membros SET foto_url = NULL, atualizado_em = NOW() WHERE id = $1', [id]);
    res.json({ success: true, message: 'Foto removida' });
  } catch (err) { next(err); }
});

// ─── ADMIN: Atualizar membro ──────────────────────────────────────────────────
router.put('/membros/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nome, cargo, email, telefone, iniciais, cor, ordem, ativo } = req.body;
    const computedIniciais = iniciais || (nome ? nome.split(' ').slice(0,2).map(n=>n[0].toUpperCase()).join('') : null);
    const result = await query(
      `UPDATE direcao_membros SET
        nome = COALESCE($1, nome), cargo = COALESCE($2, cargo),
        email = COALESCE($3, email), telefone = COALESCE($4, telefone),
        iniciais = COALESCE($5, iniciais), cor = COALESCE($6, cor),
        ordem = COALESCE($7, ordem), ativo = COALESCE($8, ativo),
        atualizado_em = NOW()
       WHERE id = $9 RETURNING *`,
      [nome, cargo, email, telefone, computedIniciais || null, cor, ordem, ativo, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Membro não encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

// ─── ADMIN: Apagar membro ────────────────────────────────────────────────────
router.delete('/membros/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    // Apagar foto física antes de eliminar o registo
    const existing = await query('SELECT foto_url FROM direcao_membros WHERE id = $1', [id]);
    if (existing.rows[0]?.foto_url) {
      const oldFile = path.join(fotoDirecaoDir, path.basename(existing.rows[0].foto_url));
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }
    const result = await query('DELETE FROM direcao_membros WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Membro não encontrado' });
    res.json({ success: true, message: 'Membro removido com sucesso' });
  } catch (err) { next(err); }
});

module.exports = router;
