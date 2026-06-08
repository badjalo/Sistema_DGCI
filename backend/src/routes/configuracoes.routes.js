const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { query } = require('../config/database');

router.get('/public', async (req, res, next) => {
  try {
    const result = await query("SELECT chave, valor FROM configuracoes WHERE chave IN ('nome_sindicato', 'sigla', 'sede', 'telefone', 'email', 'website')");
    const config = {};
    result.rows.forEach(r => { config[r.chave] = r.valor; });
    
    // Fetch live system stats
    const [totalMembros, totalFundoSocial, totalReceita, totalDespesa] = await Promise.all([
      query("SELECT COUNT(*) as count FROM membros"),
      query("SELECT COUNT(*) as count FROM membros WHERE fundo_social = true"),
      query("SELECT (SELECT COALESCE(SUM(valor),0) FROM pagamentos WHERE estado = 'pago') + (SELECT COALESCE(SUM(valor),0) FROM receitas) AS total"),
      query("SELECT COALESCE(SUM(valor),0) AS total FROM despesas")
    ]);

    const receita = parseFloat(totalReceita.rows[0].total) || 0;
    const despesa = parseFloat(totalDespesa.rows[0].total) || 0;

    config.stats = {
      totalMembros: parseInt(totalMembros.rows[0].count) || 0,
      totalFundoSocial: parseInt(totalFundoSocial.rows[0].count) || 0,
      totalReceita: receita,
      totalDespesa: despesa,
      saldoDisponivel: receita - despesa
    };

    res.json({ success: true, data: config });
  } catch (err) { next(err); }
});

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
