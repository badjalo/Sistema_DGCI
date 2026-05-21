const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { query } = require('../config/database');
const QRCode = require('qrcode');

router.get('/', authenticate, authorize('cartoes:read'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT c.*, m.nome_completo, m.numero_membro, m.foto_url, m.funcao_cargo,
             d.nome as departamento, u.nome as criado_por_nome
      FROM cartoes c
      LEFT JOIN membros m ON m.id = c.membro_id
      LEFT JOIN departamentos d ON d.id = m.departamento_id
      LEFT JOIN utilizadores u ON u.id = c.criado_por
      ORDER BY c.criado_em DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/gerar/:membro_id', authenticate, authorize('cartoes:create'), async (req, res, next) => {
  try {
    const { membro_id } = req.params;
    const membro = await query('SELECT * FROM membros WHERE id = $1', [membro_id]);
    if (!membro.rows.length) return res.status(404).json({ error: 'Membro não encontrado' });

    const m = membro.rows[0];
    const numero_cartao = `SFDC-${Date.now()}`;
    const qr_data = JSON.stringify({ id: m.id, numero: m.numero_membro, nome: m.nome_completo });
    const qr_code = await QRCode.toDataURL(qr_data);

    // Guardar QR code no membro
    await query('UPDATE membros SET qr_code = $1 WHERE id = $2', [qr_code, membro_id]);

    // Desativar cartão anterior
    await query('UPDATE cartoes SET estado = false WHERE membro_id = $1', [membro_id]);

    const validade = new Date();
    validade.setFullYear(validade.getFullYear() + 2);

    const result = await query(
      `INSERT INTO cartoes (membro_id, numero_cartao, data_validade, criado_por)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [membro_id, numero_cartao, validade, req.user.id]
    );

    res.status(201).json({
      success: true,
      data: { ...result.rows[0], membro: m, qr_code },
      message: 'Cartão gerado com sucesso'
    });
  } catch (err) { next(err); }
});

module.exports = router;
