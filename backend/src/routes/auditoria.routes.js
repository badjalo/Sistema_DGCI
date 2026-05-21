const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { query } = require('../config/database');

router.get('/', authenticate, authorize('auditoria:read'), async (req, res, next) => {
  try {
    const { page = 1, limit = 50, utilizador_id, acao } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1'; const params = [];
    if (utilizador_id) { params.push(utilizador_id); where += ` AND a.utilizador_id = $${params.length}`; }
    if (acao) { params.push(acao); where += ` AND a.acao = $${params.length}`; }
    const total = await query(`SELECT COUNT(*) FROM auditoria_logs a ${where}`, params);
    params.push(limit, offset);
    const result = await query(`
      SELECT a.*, u.nome as utilizador_nome_completo FROM auditoria_logs a
      LEFT JOIN utilizadores u ON u.id = a.utilizador_id
      ${where} ORDER BY a.criado_em DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    res.json({ success: true, data: result.rows, pagination: { total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
});

module.exports = router;
