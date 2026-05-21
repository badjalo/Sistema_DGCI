const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

/** GET /api/utilizadores */
const listar = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT u.id, u.nome, u.email, u.perfil, u.ativo, u.ultimo_login, u.criado_em, u.avatar_url,
             m.nome_completo as membro_nome, m.numero_membro
      FROM utilizadores u
      LEFT JOIN membros m ON m.id = u.membro_id
      ORDER BY u.nome ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

/** POST /api/utilizadores */
const criar = async (req, res, next) => {
  try {
    const { nome, email, password, perfil, membro_id } = req.body;
    if (!nome || !email || !password) return res.status(400).json({ error: 'Nome, email e password obrigatórios' });
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO utilizadores (nome, email, password_hash, perfil, membro_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, perfil, ativo, criado_em`,
      [nome, email.toLowerCase(), hash, perfil || 'operador', membro_id || null]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Utilizador criado com sucesso' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email já existe no sistema' });
    next(err);
  }
};

/** PUT /api/utilizadores/:id */
const atualizar = async (req, res, next) => {
  try {
    const { nome, email, perfil, ativo, membro_id, preferencias } = req.body;
    const result = await query(
      `UPDATE utilizadores SET nome = COALESCE($1, nome), email = COALESCE($2, email),
       perfil = COALESCE($3, perfil), ativo = COALESCE($4, ativo), membro_id = COALESCE($5, membro_id),
       preferencias = COALESCE($6, preferencias) WHERE id = $7 RETURNING id, nome, email, perfil, ativo`,
      [nome, email?.toLowerCase(), perfil, ativo, membro_id, preferencias ? JSON.stringify(preferencias) : null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Utilizador não encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/** DELETE /api/utilizadores/:id */
const eliminar = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Não pode eliminar a sua própria conta' });
    const result = await query('DELETE FROM utilizadores WHERE id = $1 RETURNING nome', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Utilizador não encontrado' });
    res.json({ success: true, message: `Utilizador ${result.rows[0].nome} eliminado` });
  } catch (err) { next(err); }
};

/** PUT /api/utilizadores/:id/reset-password */
const resetPassword = async (req, res, next) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 8) return res.status(400).json({ error: 'Password deve ter pelo menos 8 caracteres' });
    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE utilizadores SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
    res.json({ success: true, message: 'Password redefinida com sucesso' });
  } catch (err) { next(err); }
};

module.exports = { listar, criar, atualizar, eliminar, resetPassword };
