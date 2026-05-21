const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { query } = require('../config/database');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await query('SELECT chave, valor, descricao FROM configuracoes ORDER BY chave');
    const config = {};
    result.rows.forEach(r => { config[r.chave] = r.valor; });
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
});

router.put('/', authenticate, authorize('configuracoes:update'), async (req, res, next) => {
  try {
    const updates = req.body;
    for (const [chave, valor] of Object.entries(updates)) {
      await query(
        `INSERT INTO configuracoes (chave, valor) VALUES ($1, $2)
         ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = NOW()`,
        [chave, String(valor)]
      );
    }
    res.json({ success: true, message: 'Configurações atualizadas com sucesso' });
  } catch (err) { next(err); }
});

module.exports = router;
