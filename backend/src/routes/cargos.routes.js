const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

// Cargos simples
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await query('SELECT c.*, d.nome as departamento_nome FROM cargos c LEFT JOIN departamentos d ON d.id = c.departamento_id ORDER BY c.nome');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { nome, nivel, descricao, departamento_id } = req.body;
    const result = await query(
      'INSERT INTO cargos (nome, nivel, descricao, departamento_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, nivel || 1, descricao, departamento_id || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
