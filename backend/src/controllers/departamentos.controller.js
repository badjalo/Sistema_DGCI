const { query } = require('../config/database');

/** GET /api/departamentos */
const listar = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT d.*,
        COUNT(m.id) as total_membros,
        COUNT(m.id) FILTER (WHERE m.estado = 'ativo') as membros_ativos
      FROM departamentos d
      LEFT JOIN membros m ON m.departamento_id = d.id
      GROUP BY d.id
      ORDER BY d.nome ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

/** GET /api/departamentos/:id */
const obter = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM departamentos WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Departamento não encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/** POST /api/departamentos */
const criar = async (req, res, next) => {
  try {
    const { nome, sigla, descricao, responsavel_nome, limite_quadros } = req.body;
    if (!nome || !sigla) return res.status(400).json({ error: 'Nome e sigla são obrigatórios' });
    const result = await query(
      'INSERT INTO departamentos (nome, sigla, descricao, responsavel_nome, limite_quadros) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nome, sigla.toUpperCase(), descricao, responsavel_nome, parseInt(limite_quadros) || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Departamento criado com sucesso' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Sigla já existe' });
    next(err);
  }
};

/** PUT /api/departamentos/:id */
const atualizar = async (req, res, next) => {
  try {
    const { nome, sigla, descricao, responsavel_nome, estado, limite_quadros } = req.body;
    const result = await query(
      `UPDATE departamentos SET nome = COALESCE($1, nome), sigla = COALESCE($2, sigla),
       descricao = COALESCE($3, descricao), responsavel_nome = COALESCE($4, responsavel_nome),
       estado = COALESCE($5, estado), limite_quadros = COALESCE($6, limite_quadros) WHERE id = $7 RETURNING *`,
      [nome, sigla?.toUpperCase(), descricao, responsavel_nome, estado, limite_quadros !== undefined ? parseInt(limite_quadros) : undefined, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Departamento não encontrado' });
    res.json({ success: true, data: result.rows[0], message: 'Departamento atualizado' });
  } catch (err) { next(err); }
};

/** DELETE /api/departamentos/:id */
const eliminar = async (req, res, next) => {
  try {
    const membros = await query('SELECT COUNT(*) FROM membros WHERE departamento_id = $1', [req.params.id]);
    if (parseInt(membros.rows[0].count) > 0) {
      return res.status(409).json({ error: 'Não é possível eliminar um departamento com membros associados' });
    }
    const result = await query('DELETE FROM departamentos WHERE id = $1 RETURNING nome', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Departamento não encontrado' });
    res.json({ success: true, message: `Departamento ${result.rows[0].nome} eliminado` });
  } catch (err) { next(err); }
};

module.exports = { listar, obter, criar, atualizar, eliminar };
