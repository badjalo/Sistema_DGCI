const { query } = require('../config/database');

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
    const resumo = { aviso: 0, circular: 0, convocatoria: 0, informacao: 0, urgente: 0 };
    result.rows.forEach(r => { resumo[r.tipo] = parseInt(r.total); });
    res.json({ success: true, data: resumo });
  } catch (err) { next(err); }
};

/** POST /api/comunicados */
const criar = async (req, res, next) => {
  try {
    const { titulo, tipo, conteudo, estado, destino, urgente } = req.body;
    if (!titulo || !conteudo) return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
    const result = await query(
      `INSERT INTO comunicados (titulo, tipo, conteudo, estado, destino, urgente, autor_id,
       data_publicacao)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [titulo, tipo || 'aviso', conteudo, estado || 'rascunho', destino || 'todos',
       urgente || false, req.user.id, estado === 'publicado' ? new Date() : null]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Comunicado criado' });
  } catch (err) { next(err); }
};

/** PUT /api/comunicados/:id */
const atualizar = async (req, res, next) => {
  try {
    const { titulo, tipo, conteudo, estado, destino, urgente } = req.body;
    const result = await query(
      `UPDATE comunicados SET titulo = COALESCE($1, titulo), tipo = COALESCE($2, tipo),
       conteudo = COALESCE($3, conteudo), estado = COALESCE($4, estado),
       destino = COALESCE($5, destino), urgente = COALESCE($6, urgente),
       data_publicacao = CASE WHEN $4 = 'publicado' AND estado != 'publicado' THEN NOW() ELSE data_publicacao END
       WHERE id = $7 RETURNING *`,
      [titulo, tipo, conteudo, estado, destino, urgente, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Comunicado não encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/** DELETE /api/comunicados/:id */
const eliminar = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM comunicados WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Comunicado não encontrado' });
    res.json({ success: true, message: 'Comunicado eliminado' });
  } catch (err) { next(err); }
};

module.exports = { listar, resumoTipos, criar, atualizar, eliminar };
