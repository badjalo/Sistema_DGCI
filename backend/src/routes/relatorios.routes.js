const router = require('express').Router();
const PDFDocument = require('pdfkit-table');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { query } = require('../config/database');

router.get('/', authenticate, authorize('relatorios:read'), async (req, res, next) => {
  try {
    const { ano = new Date().getFullYear() } = req.query;
    const [membros, quotasMensal, fluxo, porDept, porCargo] = await Promise.all([
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE estado='ativo') as ativos, COUNT(*) FILTER (WHERE estado='reformado') as reformados, COUNT(*) FILTER (WHERE estado='suspenso') as suspensos, COUNT(*) FILTER (WHERE estado='inativo') as inativos FROM membros`),
      query(`SELECT mes, COUNT(*) FILTER (WHERE estado='pago') as pagas, COALESCE(SUM(valor) FILTER (WHERE estado='pago'),0) as valor_pago FROM pagamentos WHERE ano=$1 GROUP BY mes ORDER BY mes`, [ano]),
      query(`SELECT EXTRACT(MONTH FROM t.data) as mes, SUM(t.receitas) as receitas, SUM(t.despesas) as despesas FROM (SELECT data_receita as data, valor as receitas, 0 as despesas FROM receitas WHERE EXTRACT(YEAR FROM data_receita)=$1 UNION ALL SELECT data_despesa as data, 0 as receitas, valor as despesas FROM despesas WHERE EXTRACT(YEAR FROM data_despesa)=$1) t GROUP BY mes ORDER BY mes`, [ano]),
      query(`SELECT d.nome, COUNT(m.id) as total FROM departamentos d LEFT JOIN membros m ON m.departamento_id=d.id WHERE m.estado='ativo' GROUP BY d.nome ORDER BY total DESC`),
      query(`SELECT funcao_cargo, COUNT(*) as total FROM membros WHERE estado='ativo' AND funcao_cargo IS NOT NULL GROUP BY funcao_cargo ORDER BY total DESC LIMIT 10`)
    ]);

    const quotas_cobradas = await query(`SELECT COALESCE(SUM(valor),0) as total FROM pagamentos WHERE ano=$1 AND estado='pago'`, [ano]);
    const receitas_total = await query(`SELECT COALESCE(SUM(valor),0) as total FROM receitas WHERE EXTRACT(YEAR FROM data_receita)=$1`, [ano]);
    const despesas_total = await query(`SELECT COALESCE(SUM(valor),0) as total FROM despesas WHERE EXTRACT(YEAR FROM data_despesa)=$1`, [ano]);

    res.json({
      success: true,
      data: {
        membros: membros.rows[0],
        quotas_mensal: quotasMensal.rows,
        fluxo_mensal: fluxo.rows,
        por_departamento: porDept.rows,
        top_cargos: porCargo.rows,
        totais: {
          quotas_cobradas: parseFloat(quotas_cobradas.rows[0].total),
          receitas: parseFloat(receitas_total.rows[0].total),
          despesas: parseFloat(despesas_total.rows[0].total),
          saldo: parseFloat(receitas_total.rows[0].total) - parseFloat(despesas_total.rows[0].total)
        }
      }
    });
  } catch (err) { next(err); }
});

const getReportData = async (tipo, ano) => {
  switch (tipo) {
    case 'membros':
      return query(`
        SELECT m.nome_completo, m.nif, m.telefone, m.email, d.nome as departamento, m.estado
        FROM membros m
        LEFT JOIN departamentos d ON d.id = m.departamento_id
        ORDER BY m.nome_completo
      `).then((result) => result.rows);
    case 'quotas_divida':
      return query(`
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
          m.nome_completo,
          m.numero_membro,
          COALESCE(COUNT(p.id) FILTER (WHERE p.estado IN ('pendente','atrasado') AND p.mes <= params.max_mes), 0) +
            COALESCE(missing.missing_months, 0) as meses_nao_pagas,
          COALESCE(SUM(p.valor) FILTER (WHERE p.estado IN ('pendente','atrasado') AND p.mes <= params.max_mes), 0) +
            COALESCE(missing.missing_months * (cfg.valor_mensal + CASE WHEN m.fundo_social = true THEN 4000 ELSE 0 END), 0) as total_divida
        FROM membros m
        CROSS JOIN cfg
        CROSS JOIN params
        LEFT JOIN pagamentos p ON p.membro_id = m.id AND p.ano = params.ano
        LEFT JOIN LATERAL (
          SELECT COALESCE(COUNT(*) FILTER (WHERE pm.id IS NULL), 0) as missing_months
          FROM generate_series(1, params.max_mes) AS gs(mes)
          LEFT JOIN pagamentos pm ON pm.membro_id = m.id AND pm.ano = params.ano AND pm.mes = gs.mes
          WHERE MAKE_DATE(params.ano, gs.mes, 1) >= DATE_TRUNC('month', m.data_admissao)
        ) missing ON true
        WHERE m.estado = 'ativo'
        GROUP BY m.id, m.nome_completo, m.numero_membro, m.fundo_social, missing.missing_months, cfg.valor_mensal
        HAVING COALESCE(SUM(p.valor) FILTER (WHERE p.estado IN ('pendente','atrasado') AND p.mes <= params.max_mes), 0) +
            COALESCE(missing.missing_months * (cfg.valor_mensal + CASE WHEN m.fundo_social = true THEN 4000 ELSE 0 END), 0) > 0
        ORDER BY total_divida DESC, m.nome_completo
      `, [ano]).then((result) => result.rows);
    case 'quotas_pagas':
      return query(`
        SELECT m.nome_completo, p.mes, p.ano, p.valor, p.estado
        FROM pagamentos p
        LEFT JOIN membros m ON m.id = p.membro_id
        WHERE p.ano = $1 AND p.estado = 'pago'
        ORDER BY p.ano, p.mes
      `, [ano]).then((result) => result.rows);
    case 'movimentos':
      return query(`
        SELECT 'Receita' as tipo, r.descricao, r.valor, r.data_receita as data, cf.nome as categoria_nome
        FROM receitas r
        LEFT JOIN categorias_financeiras cf ON cf.id = r.categoria_id
        WHERE EXTRACT(YEAR FROM r.data_receita) = $1
        UNION ALL
        SELECT 'Despesa' as tipo, d.descricao, d.valor, d.data_despesa as data, cf.nome as categoria_nome
        FROM despesas d
        LEFT JOIN categorias_financeiras cf ON cf.id = d.categoria_id
        WHERE EXTRACT(YEAR FROM d.data_despesa) = $1
        ORDER BY data
      `, [ano]).then((result) => result.rows);
    case 'auditoria':
      return query(`
        SELECT a.id, a.acao, a.descricao, u.nome as utilizador, a.criado_em
        FROM auditoria_logs a
        LEFT JOIN utilizadores u ON u.id = a.utilizador_id
        ORDER BY a.criado_em DESC
        LIMIT 1000
      `).then((result) => result.rows);
    default:
      return null;
  }
};

router.get('/export', authenticate, authorize('relatorios:read'), async (req, res, next) => {
  try {
    const { tipo, format = 'pdf', ano = new Date().getFullYear() } = req.query;
    const data = await getReportData(tipo, ano);
    if (!data) return res.status(400).json({ success: false, error: 'Tipo de relatório inválido' });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${tipo}_${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    const title = tipo.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

    if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, title.substring(0, 31));
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // Header
    const logoPath = path.join(__dirname, '../../uploads/assets/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 30, { width: 50 });
    }

    doc.font('Helvetica-Bold')
      .fontSize(14)
      .text('SINDICATO DOS FUNCIONÁRIOS DA DGCI', 100, 40)
      .fontSize(10)
      .font('Helvetica')
      .text('Av. Combatentes da Liberdade da Pátria, Bissau', 100, 58)
      .text('Email: sindicatodgci@gmail.com', 100, 72);

    doc.moveDown(3);

    // Title and Info
    doc.font('Helvetica-Bold').fontSize(16).text(title, 40, 120, { align: 'center' });
    doc.font('Helvetica').fontSize(10).text(`Gerado em: ${new Date().toLocaleDateString('pt-PT')} | Referência (Ano): ${ano}`, { align: 'center' });
    doc.moveDown(2);

    if (data.length === 0) {
      doc.fontSize(12).text('Nenhum registo encontrado para este relatório.', { align: 'center' });
    } else {
      const headers = Object.keys(data[0]);
      const tableRows = data.map(row => headers.map(field => {
        const value = row[field];
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return new Date(value).toLocaleDateString('pt-PT');
        if (typeof value === 'number' && (field === 'valor' || field === 'receitas' || field === 'despesas')) {
          return new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF' }).format(value);
        }
        return String(value);
      }));

      const table = {
        headers: headers.map(h => h.replace(/_/g, ' ').toUpperCase()),
        rows: tableRows,
      };

      await doc.table(table, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor('#333333'),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
          doc.font("Helvetica").fontSize(9).fillColor('#000000');
        },
      });
    }

    doc.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
