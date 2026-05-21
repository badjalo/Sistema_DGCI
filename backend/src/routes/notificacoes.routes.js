const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM notificacoes WHERE utilizador_id = $1 ORDER BY criado_em DESC LIMIT 50',
      [req.user.id]
    );
    const naoLidas = result.rows.filter(n => !n.lida).length;
    res.json({ success: true, data: result.rows, nao_lidas: naoLidas });
  } catch (err) { next(err); }
});

router.put('/:id/ler', authenticate, async (req, res, next) => {
  try {
    await query('UPDATE notificacoes SET lida = true WHERE id = $1 AND utilizador_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.put('/ler-todas', authenticate, async (req, res, next) => {
  try {
    await query('UPDATE notificacoes SET lida = true WHERE utilizador_id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
