const { query } = require('../config/database');

/** GET /api/dashboard/resumo */
const resumo = async (req, res, next) => {
  try {
    const ano = req.query.ano || new Date().getFullYear();
    const mes = req.query.mes || new Date().getMonth() + 1;

    const [membros, quotas, financeiro, recentes] = await Promise.all([
      // Estatísticas de membros
      query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE estado = 'ativo') as ativos,
          COUNT(*) FILTER (WHERE estado = 'suspenso') as suspensos,
          COUNT(*) FILTER (WHERE estado = 'reformado') as reformados,
          COUNT(*) FILTER (WHERE criado_em >= date_trunc('month', NOW())) as novos_mes
        FROM membros
      `),
      // Estatísticas de quotas
      query(`
        WITH params AS (
          SELECT
            $1::integer as ano,
            CASE
              WHEN $1::integer < EXTRACT(YEAR FROM NOW())::integer THEN 12
              WHEN $1::integer = EXTRACT(YEAR FROM NOW())::integer THEN GREATEST(0, EXTRACT(MONTH FROM NOW())::integer - 1)
              ELSE 0
            END as max_mes
        )
        SELECT
          (SELECT COUNT(*) FROM pagamentos WHERE estado = 'pago' AND ano = params.ano) as pagas,
          
          -- Sum of missing months for all active/suspended members in the selected year
          COALESCE((
            SELECT SUM(missing.missing_months)
            FROM membros m
            CROSS JOIN params
            LEFT JOIN LATERAL (
              SELECT COALESCE(COUNT(*), 0) as missing_months
              FROM generate_series(1, params.max_mes) AS gs(mes)
              LEFT JOIN pagamentos pm ON pm.membro_id = m.id AND pm.ano = params.ano AND pm.mes = gs.mes
              WHERE pm.id IS NULL 
                AND MAKE_DATE(params.ano, gs.mes, 1) >= DATE_TRUNC('month', m.data_admissao)
            ) missing ON true
            WHERE m.estado IN ('ativo', 'suspenso')
          ), 0) as pendentes,
          
          (SELECT COALESCE(SUM(valor), 0) FROM pagamentos WHERE estado = 'pago' AND ano = params.ano) as total_cobrado_ano,
          
          -- Total debt value in the selected year
          COALESCE((
            SELECT SUM(missing.missing_months) * COALESCE((SELECT valor_mensal FROM quotas_config WHERE ativo = true ORDER BY data_inicio DESC LIMIT 1), 1000)
            FROM membros m
            CROSS JOIN params
            LEFT JOIN LATERAL (
              SELECT COALESCE(COUNT(*), 0) as missing_months
              FROM generate_series(1, params.max_mes) AS gs(mes)
              LEFT JOIN pagamentos pm ON pm.membro_id = m.id AND pm.ano = params.ano AND pm.mes = gs.mes
              WHERE pm.id IS NULL 
                AND MAKE_DATE(params.ano, gs.mes, 1) >= DATE_TRUNC('month', m.data_admissao)
            ) missing ON true
            WHERE m.estado IN ('ativo', 'suspenso')
          ), 0) as total_divida_ano
        FROM params
      `, [ano]),
      // Financeiro do mês atual
      query(`
        SELECT
          COALESCE((SELECT SUM(valor) FROM receitas WHERE EXTRACT(MONTH FROM data_receita) = $1 AND EXTRACT(YEAR FROM data_receita) = $2), 0) as receitas_mes,
          COALESCE((SELECT SUM(valor) FROM despesas WHERE EXTRACT(MONTH FROM data_despesa) = $1 AND EXTRACT(YEAR FROM data_despesa) = $2), 0) as despesas_mes,
          COALESCE((SELECT SUM(valor) FROM receitas WHERE EXTRACT(YEAR FROM data_receita) = $2), 0) as receitas_ano,
          COALESCE((SELECT SUM(valor) FROM despesas WHERE EXTRACT(YEAR FROM data_despesa) = $2), 0) as despesas_ano
      `, [mes, ano]),
      // Membros recentes
      query(`
        SELECT id, numero_membro, nome_completo, foto_url, estado, criado_em,
               (SELECT nome FROM departamentos WHERE id = departamento_id) as departamento
        FROM membros
        ORDER BY criado_em DESC LIMIT 5
      `)
    ]);

    // Fluxo mensal (12 meses)
    const fluxoMensal = await query(`
      SELECT
        mes,
        SUM(receitas) as receitas,
        SUM(despesas) as despesas
      FROM (
        SELECT EXTRACT(MONTH FROM data_receita) as mes, valor as receitas, 0 as despesas
        FROM receitas WHERE EXTRACT(YEAR FROM data_receita) = $1
        UNION ALL
        SELECT EXTRACT(MONTH FROM data_despesa) as mes, 0 as receitas, valor as despesas
        FROM despesas WHERE EXTRACT(YEAR FROM data_despesa) = $1
      ) t
      GROUP BY mes ORDER BY mes
    `, [ano]);

    // Quotas por mês
    const quotasMensal = await query(`
      SELECT mes, COUNT(*) FILTER (WHERE estado = 'pago') as pagas,
             COUNT(*) FILTER (WHERE estado IN ('pendente','atrasado')) as pendentes,
             SUM(valor) FILTER (WHERE estado = 'pago') as valor_pago
      FROM pagamentos WHERE ano = $1
      GROUP BY mes ORDER BY mes
    `, [ano]);

    res.json({
      success: true,
      data: {
        membros: membros.rows[0],
        quotas: quotas.rows[0],
        financeiro: financeiro.rows[0],
        membros_recentes: recentes.rows,
        fluxo_mensal: fluxoMensal.rows,
        quotas_mensal: quotasMensal.rows
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { resumo };
