const { query } = require('../config/database');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/** GET /api/quotas/config */
const obterConfig = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM quotas_config WHERE ativo = true ORDER BY data_inicio DESC LIMIT 1');
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) { next(err); }
};

/** POST /api/quotas/config */
const definirConfig = async (req, res, next) => {
  try {
    const { valor_mensal, data_inicio } = req.body;
    // Desativar configuração anterior
    await query('UPDATE quotas_config SET ativo = false, data_fim = $1 WHERE ativo = true', [data_inicio]);
    const result = await query(
      'INSERT INTO quotas_config (valor_mensal, data_inicio, ativo, criado_por) VALUES ($1, $2, true, $3) RETURNING *',
      [valor_mensal, data_inicio, req.user.id]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/** GET /api/quotas/situacao */
const situacao = async (req, res, next) => {
  try {
    const { ano = new Date().getFullYear(), page = 1, limit = 20, estado = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE m.estado = \'ativo\'';
    const queryParams = [ano];
    const countParams = [];

    if (search) {
      queryParams.push(`%${search}%`);
      countParams.push(`%${search}%`);
      where += ` AND (m.nome_completo ILIKE $${queryParams.length} OR m.numero_membro ILIKE $${queryParams.length})`;
    }

    const result = await query(`
      WITH cfg AS (
        SELECT COALESCE((SELECT valor_mensal FROM quotas_config WHERE ativo = true ORDER BY data_inicio DESC LIMIT 1), 1000) as valor_mensal
      ), params AS (
        SELECT
          $1::integer as ano,
          CASE
            WHEN $1::integer < EXTRACT(YEAR FROM NOW())::integer THEN 12
            WHEN $1::integer = EXTRACT(YEAR FROM NOW())::integer THEN GREATEST(0, EXTRACT(MONTH FROM NOW())::integer - 1)
            ELSE 0
          END as max_mes
      )
      SELECT
        m.id, m.numero_membro, m.nome_completo, m.foto_url, m.estado,
        m.data_admissao, m.fundo_social,
        d.nome as departamento,
        COALESCE(COUNT(p.id) FILTER (WHERE p.estado = 'pago'), 0) as meses_pagos,
        COALESCE(COUNT(p.id) FILTER (WHERE p.estado IN ('pendente','atrasado') AND p.mes <= params.max_mes), 0) as meses_pagamentos_pendentes,
        COALESCE(missing.missing_months, 0) as meses_faltantes,
        COALESCE(COUNT(p.id) FILTER (WHERE p.estado IN ('pendente','atrasado') AND p.mes <= params.max_mes), 0) +
          COALESCE(missing.missing_months, 0) as meses_nao_pagas,
        COALESCE(SUM(p.valor) FILTER (WHERE p.estado = 'pago'), 0) as total_pago,
        COALESCE(SUM(p.valor) FILTER (WHERE p.estado IN ('pendente','atrasado') AND p.mes <= params.max_mes), 0) +
          COALESCE(missing.missing_months * (cfg.valor_mensal + CASE WHEN m.fundo_social = true THEN 4000 ELSE 0 END), 0) as total_divida,
        json_agg(json_build_object('mes', p.mes, 'estado', p.estado, 'valor', p.valor, 'data_pagamento', p.data_pagamento)
          ORDER BY p.mes) FILTER (WHERE p.id IS NOT NULL) as pagamentos
      FROM membros m
      LEFT JOIN departamentos d ON d.id = m.departamento_id
      LEFT JOIN pagamentos p ON p.membro_id = m.id AND p.ano = $1
      CROSS JOIN cfg
      CROSS JOIN params
      LEFT JOIN LATERAL (
        SELECT COALESCE(COUNT(*) FILTER (WHERE pm.id IS NULL), 0) as missing_months
        FROM generate_series(1, params.max_mes) AS gs(mes)
        LEFT JOIN pagamentos pm ON pm.membro_id = m.id AND pm.ano = params.ano AND pm.mes = gs.mes
        WHERE MAKE_DATE(params.ano, gs.mes, 1) >= DATE_TRUNC('month', m.data_admissao)
      ) missing ON true
      ${where}
      GROUP BY m.id, m.numero_membro, m.nome_completo, m.foto_url, m.estado, m.data_admissao, m.fundo_social, d.nome, cfg.valor_mensal, params.max_mes, missing.missing_months
      ORDER BY m.nome_completo
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `, [...queryParams, limit, offset]);

    // Replace $2 with $1 in the count query if search exists
    const countWhere = search ? `WHERE m.estado = 'ativo' AND (m.nome_completo ILIKE $1 OR m.numero_membro ILIKE $1)` : `WHERE m.estado = 'ativo'`;

    const countResult = await query(`
      SELECT COUNT(*) FROM membros m ${countWhere}
    `, countParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (err) { next(err); }
};

/** POST /api/pagamentos */
const registarPagamento = async (req, res, next) => {
  try {
    const { membro_id, mes, ano, valor, metodo_pagamento, referencia, banco_id, observacoes } = req.body;

    // Verificar se já existe
    const existing = await query(
      'SELECT id, estado FROM pagamentos WHERE membro_id = $1 AND mes = $2 AND ano = $3',
      [membro_id, mes, ano]
    );

    let result;
    if (existing.rows.length) {
      result = await query(
        `UPDATE pagamentos SET estado = 'pago', valor = $1, data_pagamento = NOW(),
         metodo_pagamento = $2, referencia = $3, banco_id = $4, observacoes = $5, registado_por = $6
         WHERE membro_id = $7 AND mes = $8 AND ano = $9 RETURNING *`,
        [valor, metodo_pagamento, referencia, banco_id, observacoes, req.user.id, membro_id, mes, ano]
      );
    } else {
      result = await query(
        `INSERT INTO pagamentos (membro_id, mes, ano, valor, estado, data_pagamento, metodo_pagamento, referencia, banco_id, observacoes, registado_por)
         VALUES ($1, $2, $3, $4, 'pago', NOW(), $5, $6, $7, $8, $9) RETURNING *`,
        [membro_id, mes, ano, valor, metodo_pagamento, referencia, banco_id, observacoes, req.user.id]
      );

      // Atualizar saldo do banco
      if (banco_id) {
        await query('UPDATE bancos SET saldo_atual = saldo_atual + $1 WHERE id = $2', [valor, banco_id]);
      }

      // Registar receita automática
      const membro = await query('SELECT nome_completo, fundo_social FROM membros WHERE id = $1', [membro_id]);
      const nomeMembro = membro.rows[0]?.nome_completo;
      const isFundoSocial = membro.rows[0]?.fundo_social;

      if (isFundoSocial && valor >= 5000) {
        // Regista quota de 1000 XOF
        const configQuota = await query(`SELECT id FROM categorias_financeiras WHERE nome = 'Quotas Mensais' LIMIT 1`);
        if (configQuota.rows.length) {
          await query(
            `INSERT INTO receitas (descricao, valor, data_receita, categoria_id, banco_id, membro_id, registado_por)
             VALUES ($1, $2, NOW(), $3, $4, $5, $6)`,
            [`Quota ${mes}/${ano} - ${nomeMembro}`, 1000, configQuota.rows[0].id, banco_id, membro_id, req.user.id]
          );
        }
        // Regista fundo social de 4000 XOF
        const configFundo = await query(`SELECT id FROM categorias_financeiras WHERE nome = 'Fundo Social' LIMIT 1`);
        if (configFundo.rows.length) {
          await query(
            `INSERT INTO receitas (descricao, valor, data_receita, categoria_id, banco_id, membro_id, registado_por)
             VALUES ($1, $2, NOW(), $3, $4, $5, $6)`,
            [`Fundo Social ${mes}/${ano} - ${nomeMembro}`, 4000, configFundo.rows[0].id, banco_id, membro_id, req.user.id]
          );
        }
      } else {
        // Regista valor integral como quota
        const configQuota = await query(`SELECT id FROM categorias_financeiras WHERE nome = 'Quotas Mensais' LIMIT 1`);
        if (configQuota.rows.length) {
          await query(
            `INSERT INTO receitas (descricao, valor, data_receita, categoria_id, banco_id, membro_id, registado_por)
             VALUES ($1, $2, NOW(), $3, $4, $5, $6)`,
            [`Quota ${mes}/${ano} - ${nomeMembro}`, valor, configQuota.rows[0].id, banco_id, membro_id, req.user.id]
          );
        }
      }
    }

    // Generate recibo PDF and update pagamento.recibo_url
    try {
      const pay = await query(
        `SELECT p.*, m.nome_completo, m.numero_membro, u.nome as registado_por_nome
         FROM pagamentos p
         LEFT JOIN membros m ON m.id = p.membro_id
         LEFT JOIN utilizadores u ON u.id = p.registado_por
         WHERE p.id = $1`,
        [result.rows[0].id]
      );

      const payment = pay.rows[0];
      if (payment) {
        const uploadsDir = path.join(__dirname, '../../uploads/recibos');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const fileName = `recibo_${payment.id}_${uuidv4()}.pdf`;
        const filePath = path.join(uploadsDir, fileName);

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(18).text('Recibo de Pagamento', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Número do Recibo: ${payment.id}`);
        doc.text(`Data: ${new Date(payment.data_pagamento).toLocaleString('pt-PT')}`);
        doc.moveDown();

        doc.text(`Membro: ${payment.nome_completo || 'N/A'}`);
        doc.text(`Número Membro: ${payment.numero_membro || 'N/A'}`);
        doc.moveDown();

        doc.text(`Mês/Ano: ${payment.mes}/${payment.ano}`);
        doc.text(`Valor: ${parseFloat(payment.valor).toFixed(2)} XOF`);
        doc.text(`Método: ${payment.metodo_pagamento || 'N/A'}`);
        if (payment.referencia) doc.text(`Referência: ${payment.referencia}`);
        doc.moveDown();

        doc.text(`Registado por: ${payment.registado_por_nome || 'Sistema'}`);
        if (payment.observacoes) {
          doc.moveDown();
          doc.text(`Observações: ${payment.observacoes}`);
        }

        doc.moveDown(2);
        doc.text('Assinatura:');
        doc.moveDown();
        doc.text('______________________________');

        doc.end();

        await new Promise((resolve, reject) => {
          stream.on('finish', resolve);
          stream.on('error', reject);
        });

        const receiptUrl = `/uploads/recibos/${fileName}`;
        await query('UPDATE pagamentos SET recibo_url = $1 WHERE id = $2', [receiptUrl, payment.id]);

        result.rows[0].recibo_url = receiptUrl;
      }
    } catch (err) {
      console.error('Erro ao gerar recibo PDF:', err);
    }

    res.status(201).json({ success: true, data: result.rows[0], message: 'Pagamento registado com sucesso' });
  } catch (err) { next(err); }
};

/** GET /api/pagamentos */
const listarPagamentos = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, ano, mes, estado, membro_id } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (ano) { params.push(ano); where += ` AND p.ano = $${params.length}`; }
    if (mes) { params.push(mes); where += ` AND p.mes = $${params.length}`; }
    if (estado) { params.push(estado); where += ` AND p.estado = $${params.length}`; }
    if (membro_id) { params.push(membro_id); where += ` AND p.membro_id = $${params.length}`; }

    const total = await query(`SELECT COUNT(*) FROM pagamentos p ${where}`, params);
    params.push(limit, offset);

    const result = await query(`
      SELECT p.*, m.nome_completo, m.numero_membro, u.nome as registado_por_nome
      FROM pagamentos p
      LEFT JOIN membros m ON m.id = p.membro_id
      LEFT JOIN utilizadores u ON u.id = p.registado_por
      ${where}
      ORDER BY p.ano DESC, p.mes DESC, m.nome_completo
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({
      success: true, data: result.rows,
      pagination: { total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) { next(err); }
};

module.exports = { obterConfig, definirConfig, situacao, registarPagamento, listarPagamentos };
