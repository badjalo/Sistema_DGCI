const { query } = require('../config/database');
const path = require('path');
const fs = require('fs');
const { notificarAdmins } = require('../utils/notificacoes');

const obituarioDir = path.join(__dirname, '../../uploads/obituario');

/** GET /api/comunicados */
const listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, estado = '', tipo = '' } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (estado) { params.push(estado); where += ` AND c.estado = $${params.length}`; }
    if (tipo) { params.push(tipo); where += ` AND c.tipo = $${params.length}`; }

    const total = await query(`SELECT COUNT(*) FROM comunicados c ${where}`, params);
    params.push(limit, offset);

    const result = await query(`
      SELECT c.*, u.nome as autor_nome
      FROM comunicados c
      LEFT JOIN utilizadores u ON u.id = c.autor_id
      ${where}
      ORDER BY c.criado_em DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({
      success: true, data: result.rows,
      pagination: { total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) { next(err); }
};

/** GET /api/comunicados/resumo-tipos */
const resumoTipos = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT tipo, COUNT(*) as total
      FROM comunicados WHERE estado = 'publicado'
      GROUP BY tipo
    `);
    const resumo = { aviso: 0, circular: 0, convocatoria: 0, informacao: 0, urgente: 0, obito: 0 };
    result.rows.forEach(r => { resumo[r.tipo] = parseInt(r.total); });
    res.json({ success: true, data: resumo });
  } catch (err) { next(err); }
};

/** POST /api/comunicados */
const criar = async (req, res, next) => {
  try {
    const { titulo, tipo, conteudo, estado, destino, urgente, nome_falecido } = req.body;
    if (!titulo || !conteudo) return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });

    // Processar foto de óbito se enviada
    let foto_url = null;
    if (req.file) {
      foto_url = `/uploads/obituario/${req.file.filename}`;
    }

    const result = await query(
      `INSERT INTO comunicados (titulo, tipo, conteudo, estado, destino, urgente, autor_id,
       data_publicacao, foto_url, nome_falecido)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [titulo, tipo || 'aviso', conteudo, estado || 'rascunho', destino || 'todos',
       urgente || false, req.user.id, estado === 'publicado' ? new Date() : null,
       foto_url, nome_falecido || null]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Comunicado criado' });

    // Notificar se for publicado de imediato
    if (estado === 'publicado') {
      const label = tipo === 'obito' ? 'Nota de Óbito' : 'Novo Comunicado';
      notificarAdmins({
        titulo: `${label}: ${titulo}`,
        mensagem: tipo === 'obito' && nome_falecido 
          ? `Nota de falecimento em memória de ${nome_falecido}.`
          : `Um novo comunicado do tipo "${tipo}" foi publicado por ${req.user.nome || 'direção'}.`,
        tipo: urgente ? 'alerta' : 'info',
        link: '/comunicados'
      });
    }
  } catch (err) { next(err); }
};

/** PUT /api/comunicados/:id */
const atualizar = async (req, res, next) => {
  try {
    const { titulo, tipo, conteudo, estado, destino, urgente, nome_falecido } = req.body;

    // Obter comunicado atual para gerir foto antiga
    const existing = await query('SELECT foto_url FROM comunicados WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Comunicado não encontrado' });

    let foto_url = existing.rows[0].foto_url;

    // Se foi enviada nova foto
    if (req.file) {
      // Apagar foto antiga se existir
      if (foto_url) {
        const oldFilename = path.basename(foto_url);
        const oldPath = path.join(obituarioDir, oldFilename);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      foto_url = `/uploads/obituario/${req.file.filename}`;
    }

    // Se tipo mudou de obito para outro, limpar foto
    if (tipo && tipo !== 'obito' && foto_url && !req.file) {
      const oldFilename = path.basename(foto_url);
      const oldPath = path.join(obituarioDir, oldFilename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      foto_url = null;
    }

    const result = await query(
      `UPDATE comunicados SET titulo = COALESCE($1, titulo), tipo = COALESCE($2, tipo),
       conteudo = COALESCE($3, conteudo), estado = COALESCE($4, estado),
       destino = COALESCE($5, destino), urgente = COALESCE($6, urgente),
       data_publicacao = CASE WHEN $4 = 'publicado' AND estado != 'publicado' THEN NOW() ELSE data_publicacao END,
       foto_url = $7, nome_falecido = $8,
       atualizado_em = NOW()
       WHERE id = $9 RETURNING *`,
      [titulo, tipo, conteudo, estado, destino, urgente, foto_url, nome_falecido || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Comunicado não encontrado' });
    res.json({ success: true, data: result.rows[0] });

    // Se o estado mudou para publicado
    if (estado === 'publicado') {
      const label = (tipo || result.rows[0].tipo) === 'obito' ? 'Nota de Óbito' : 'Novo Comunicado';
      notificarAdmins({
        titulo: `${label}: ${titulo || result.rows[0].titulo}`,
        mensagem: (tipo || result.rows[0].tipo) === 'obito' && (nome_falecido || result.rows[0].nome_falecido)
          ? `Nota de falecimento em memória de ${nome_falecido || result.rows[0].nome_falecido}.`
          : `Um comunicado foi publicado por ${req.user.nome || 'direção'}.`,
        tipo: (urgente || result.rows[0].urgente) ? 'alerta' : 'info',
        link: '/comunicados'
      });
    }
  } catch (err) { next(err); }
};

/** DELETE /api/comunicados/:id */
const eliminar = async (req, res, next) => {
  try {
    // Apagar foto física se existir
    const existing = await query('SELECT foto_url FROM comunicados WHERE id = $1', [req.params.id]);
    if (existing.rows[0]?.foto_url) {
      const oldFilename = path.basename(existing.rows[0].foto_url);
      const oldPath = path.join(obituarioDir, oldFilename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const result = await query('DELETE FROM comunicados WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Comunicado não encontrado' });
    res.json({ success: true, message: 'Comunicado eliminado' });
  } catch (err) { next(err); }
};

module.exports = { listar, resumoTipos, criar, atualizar, eliminar };
