const { query } = require('../config/database');

/** GET /api/financeiro/receitas */
const listarReceitas = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, ano, mes, categoria_id } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1'; const params = [];
    if (ano) { params.push(ano); where += ` AND EXTRACT(YEAR FROM r.data_receita) = $${params.length}`; }
    if (mes) { params.push(mes); where += ` AND EXTRACT(MONTH FROM r.data_receita) = $${params.length}`; }
    if (categoria_id) { params.push(categoria_id); where += ` AND r.categoria_id = $${params.length}`; }
    const total = await query(`SELECT COUNT(*) FROM receitas r ${where}`, params);
    params.push(limit, offset);
    const result = await query(`
      SELECT r.*, cf.nome as categoria_nome, cf.cor as categoria_cor, b.nome as banco_nome,
             m.nome_completo as membro_nome, u.nome as registado_por_nome
      FROM receitas r
      LEFT JOIN categorias_financeiras cf ON cf.id = r.categoria_id
      LEFT JOIN bancos b ON b.id = r.banco_id
      LEFT JOIN membros m ON m.id = r.membro_id
      LEFT JOIN utilizadores u ON u.id = r.registado_por
      ${where} ORDER BY r.data_receita DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    res.json({ success: true, data: result.rows, pagination: { total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

/** POST /api/financeiro/receitas */
const criarReceita = async (req, res, next) => {
  try {
    const { descricao, valor, data_receita, categoria_id, banco_id, membro_id, referencia, observacoes, metodo_pagamento } = req.body;
    if (!descricao || !valor) return res.status(400).json({ error: 'Descrição e valor são obrigatórios' });
    const result = await query(
      `INSERT INTO receitas (descricao, valor, data_receita, categoria_id, banco_id, membro_id, referencia, observacoes, registado_por, metodo_pagamento)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [descricao, valor, data_receita || new Date(), categoria_id, banco_id, membro_id, referencia, observacoes, req.user.id, metodo_pagamento]
    );
    if (banco_id) await query('UPDATE bancos SET saldo_atual = saldo_atual + $1 WHERE id = $2', [valor, banco_id]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/** GET /api/financeiro/despesas */
const listarDespesas = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, ano, mes, categoria_id } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1'; const params = [];
    if (ano) { params.push(ano); where += ` AND EXTRACT(YEAR FROM d.data_despesa) = $${params.length}`; }
    if (mes) { params.push(mes); where += ` AND EXTRACT(MONTH FROM d.data_despesa) = $${params.length}`; }
    if (categoria_id) { params.push(categoria_id); where += ` AND d.categoria_id = $${params.length}`; }
    const total = await query(`SELECT COUNT(*) FROM despesas d ${where}`, params);
    params.push(limit, offset);
    const result = await query(`
      SELECT d.*, cf.nome as categoria_nome, cf.cor as categoria_cor, b.nome as banco_nome,
             u.nome as registado_por_nome
      FROM despesas d
      LEFT JOIN categorias_financeiras cf ON cf.id = d.categoria_id
      LEFT JOIN bancos b ON b.id = d.banco_id
      LEFT JOIN utilizadores u ON u.id = d.registado_por
      ${where} ORDER BY d.data_despesa DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    res.json({ success: true, data: result.rows, pagination: { total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

/** POST /api/financeiro/despesas */
const criarDespesa = async (req, res, next) => {
  try {
    const { descricao, valor, data_despesa, categoria_id, banco_id, beneficiario, referencia, observacoes, metodo_pagamento } = req.body;
    if (!descricao || !valor) return res.status(400).json({ error: 'Descrição e valor são obrigatórios' });
    const result = await query(
      `INSERT INTO despesas (descricao, valor, data_despesa, categoria_id, banco_id, beneficiario, referencia, observacoes, registado_por, metodo_pagamento)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [descricao, valor, data_despesa || new Date(), categoria_id, banco_id, beneficiario, referencia, observacoes, req.user.id, metodo_pagamento]
    );
    if (banco_id) await query('UPDATE bancos SET saldo_atual = saldo_atual - $1 WHERE id = $2', [valor, banco_id]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

/** GET /api/financeiro/bancos */
const listarBancos = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM bancos WHERE ativo = true ORDER BY nome');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

/** GET /api/financeiro/categorias */
const listarCategorias = async (req, res, next) => {
  try {
    const { tipo } = req.query;
    let where = 'WHERE ativo = true';
    const params = [];
    if (tipo) { params.push(tipo); where += ` AND tipo = $1`; }
    const result = await query(`SELECT * FROM categorias_financeiras ${where} ORDER BY nome`, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

/** GET /api/financeiro/resumo */
const resumo = async (req, res, next) => {
  try {
    const ano = parseInt(req.query.ano, 10) || new Date().getFullYear();
    const mes = parseInt(req.query.mes, 10) || new Date().getMonth() + 1;

    const result = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as total_receitas,
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as total_despesas
      FROM (
        SELECT 'receita' as tipo, valor FROM receitas WHERE EXTRACT(YEAR FROM data_receita) = $1
        UNION ALL
        SELECT 'despesa' as tipo, valor FROM despesas WHERE EXTRACT(YEAR FROM data_despesa) = $1
      ) t
    `, [ano]);

    const monthlyResult = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as month_receitas,
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as month_despesas
      FROM (
        SELECT 'receita' as tipo, valor FROM receitas WHERE EXTRACT(YEAR FROM data_receita) = $1 AND EXTRACT(MONTH FROM data_receita) = $2
        UNION ALL
        SELECT 'despesa' as tipo, valor FROM despesas WHERE EXTRACT(YEAR FROM data_despesa) = $1 AND EXTRACT(MONTH FROM data_despesa) = $2
      ) t
    `, [ano, mes]);

    const debtResult = await query(`
      SELECT
        -- Total debt (up to now)
        COALESCE((
          SELECT SUM(
            GREATEST(0, (DATE_PART('year', age(CURRENT_DATE, m.data_admissao)) * 12 + DATE_PART('month', age(CURRENT_DATE, m.data_admissao)) + 1) - 
            (SELECT COUNT(*) FROM pagamentos p WHERE p.membro_id = m.id AND p.estado = 'pago'))
            * (COALESCE((SELECT valor_mensal FROM quotas_config WHERE ativo = true ORDER BY data_inicio DESC LIMIT 1), 1000) + CASE WHEN m.fundo_social = true THEN 4000 ELSE 0 END)
          )
          FROM membros m WHERE m.estado IN ('ativo', 'suspenso')
        ), 0) as total_divida,

        -- Monthly debt for specific month and year ($1 = ano, $2 = mes)
        COALESCE((
          SELECT SUM(COALESCE((SELECT valor_mensal FROM quotas_config WHERE ativo = true ORDER BY data_inicio DESC LIMIT 1), 1000) + CASE WHEN m.fundo_social = true THEN 4000 ELSE 0 END)
          FROM membros m
          WHERE m.estado IN ('ativo', 'suspenso')
            -- The month is on or after the member's admission date
            AND DATE_TRUNC('month', m.data_admissao) <= MAKE_DATE($1, $2, 1)
            -- The month is in the past or present (i.e. <= CURRENT_DATE)
            AND MAKE_DATE($1, $2, 1) <= DATE_TRUNC('month', CURRENT_DATE)
            -- The member has not paid for this month and year
            AND NOT EXISTS (
              SELECT 1 FROM pagamentos p
              WHERE p.membro_id = m.id AND p.ano = $1 AND p.mes = $2 AND p.estado = 'pago'
            )
        ), 0) as month_divida
    `, [ano, mes]);

    const bancos = await query('SELECT nome, saldo_atual FROM bancos WHERE ativo = true');
    const saldo_total = bancos.rows.reduce((acc, b) => acc + parseFloat(b.saldo_atual || 0), 0);
    res.json({
      success: true,
      data: {
        ...result.rows[0],
        saldo: parseFloat(result.rows[0].total_receitas) - parseFloat(result.rows[0].total_despesas),
        total_divida: parseFloat(debtResult.rows[0].total_divida),
        month_receitas: parseFloat(monthlyResult.rows[0].month_receitas),
        month_despesas: parseFloat(monthlyResult.rows[0].month_despesas),
        month_saldo: parseFloat(monthlyResult.rows[0].month_receitas) - parseFloat(monthlyResult.rows[0].month_despesas),
        month_divida: parseFloat(debtResult.rows[0].month_divida),
        mes: mes,
        saldo_total,
        bancos: bancos.rows
      }
    });
  } catch (err) { next(err); }
};

/** GET /api/financeiro/transparencia */
const transparencia = async (req, res, next) => {
  try {
    const ano = parseInt(req.query.ano, 10) || new Date().getFullYear();

    // 1. Receitas e Despesas mensais para gráficos
    const evolucaoMensal = await query(`
      SELECT 
        m.mes,
        COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END), 0) as receitas,
        COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END), 0) as despesas
      FROM generate_series(1, 12) AS m(mes)
      LEFT JOIN (
        SELECT 'receita' as tipo, valor, EXTRACT(MONTH FROM data_receita) as mes FROM receitas WHERE EXTRACT(YEAR FROM data_receita) = $1
        UNION ALL
        SELECT 'despesa' as tipo, valor, EXTRACT(MONTH FROM data_despesa) as mes FROM despesas WHERE EXTRACT(YEAR FROM data_despesa) = $1
      ) t ON t.mes = m.mes
      GROUP BY m.mes
      ORDER BY m.mes
    `, [ano]);

    // 2. Receitas por categoria
    const receitasPorCategoria = await query(`
      SELECT cf.nome as categoria, cf.cor, COALESCE(SUM(r.valor), 0) as total
      FROM categorias_financeiras cf
      JOIN receitas r ON r.categoria_id = cf.id
      WHERE cf.tipo = 'receita' AND EXTRACT(YEAR FROM r.data_receita) = $1
      GROUP BY cf.nome, cf.cor
      ORDER BY total DESC
    `, [ano]);

    // 3. Despesas por categoria
    const despesasPorCategoria = await query(`
      SELECT cf.nome as categoria, cf.cor, COALESCE(SUM(d.valor), 0) as total
      FROM categorias_financeiras cf
      JOIN despesas d ON d.categoria_id = cf.id
      WHERE cf.tipo = 'despesa' AND EXTRACT(YEAR FROM d.data_despesa) = $1
      GROUP BY cf.nome, cf.cor
      ORDER BY total DESC
    `, [ano]);

    // 4. Saldos nos bancos
    const bancos = await query('SELECT nome, saldo_atual FROM bancos WHERE ativo = true');
    const saldoTotal = bancos.rows.reduce((acc, b) => acc + parseFloat(b.saldo_atual || 0), 0);

    // 5. Totais gerais do ano
    const totais = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as total_receitas,
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as total_despesas
      FROM (
        SELECT 'receita' as tipo, valor FROM receitas WHERE EXTRACT(YEAR FROM data_receita) = $1
        UNION ALL
        SELECT 'despesa' as tipo, valor FROM despesas WHERE EXTRACT(YEAR FROM data_despesa) = $1
      ) t
    `, [ano]);

    res.json({
      success: true,
      data: {
        ano,
        total_receitas: parseFloat(totais.rows[0].total_receitas),
        total_despesas: parseFloat(totais.rows[0].total_despesas),
        saldo_anual: parseFloat(totais.rows[0].total_receitas) - parseFloat(totais.rows[0].total_despesas),
        saldo_caixa: saldoTotal,
        bancos: bancos.rows,
        evolucaoMensal: evolucaoMensal.rows.map(r => ({
          mes: r.mes,
          receitas: parseFloat(r.receitas),
          despesas: parseFloat(r.despesas),
          saldo: parseFloat(r.receitas) - parseFloat(r.despesas)
        })),
        receitasPorCategoria: receitasPorCategoria.rows.map(r => ({
          categoria: r.categoria,
          cor: r.cor,
          total: parseFloat(r.total)
        })),
        despesasPorCategoria: despesasPorCategoria.rows.map(r => ({
          categoria: r.categoria,
          cor: r.cor,
          total: parseFloat(r.total)
        }))
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listarReceitas, criarReceita, listarDespesas, criarDespesa, listarBancos, listarCategorias, resumo, transparencia };
