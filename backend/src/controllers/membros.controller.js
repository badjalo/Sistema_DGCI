const { query } = require('../config/database');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const gerarNumeroMembro = async () => {
  // use DB sequence to avoid race conditions
  const ano = new Date().getFullYear();
  const r = await query(`SELECT nextval('membros_num_seq') as seq`);
  const seq = String(r.rows[0].seq).padStart(5, '0');
  return `SF-DGCI-${ano}-${seq}`;
};

const nextNumero = async (req, res, next) => {
  try {
    const numero = await gerarNumeroMembro();
    res.json({ success: true, numero });
  } catch (err) {
    next(err);
  }
};

const normalizeEstadoCivil = (val) => {
  if (!val) return undefined;
  const v = String(val).toLowerCase().trim();
  if (v.includes('solteir')) return 'solteiro';
  if (v.includes('casad')) return 'casado';
  if (v.includes('divorc')) return 'divorciado';
  if (v.includes('viuv') || v.includes('viúv')) return 'viuvo';
  if (v.includes('uniao') || v.includes('facto') || v.includes('união')) return 'uniao_facto';
  return v;
};

/** GET /api/membros */
const listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', estado = '', departamento_id = '' } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = ' WHERE 1=1';

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (m.nome_completo ILIKE $${params.length} OR m.numero_membro ILIKE $${params.length} OR m.nif ILIKE $${params.length} OR m.bi_passaporte ILIKE $${params.length})`;
    }
    if (estado) {
      params.push(estado);
      where += ` AND m.estado = $${params.length}`;
    }
    if (departamento_id) {
      params.push(departamento_id);
      where += ` AND m.departamento_id = $${params.length}`;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM membros m ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT m.*, d.nome as departamento_nome, d.sigla as departamento_sigla,
              c.nome as cargo_nome
       FROM membros m
       LEFT JOIN departamentos d ON d.id = m.departamento_id
       LEFT JOIN cargos c ON c.id = m.cargo_id
       ${where}
       ORDER BY m.nome_completo ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/membros/:id */
const obter = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT m.*, d.nome as departamento_nome, d.sigla as departamento_sigla,
              c.nome as cargo_nome,
              (SELECT COUNT(*) FROM pagamentos p WHERE p.membro_id = m.id AND p.estado = 'pago') as total_quotas_pagas,
              (SELECT COUNT(*) FROM pagamentos p WHERE p.membro_id = m.id AND p.estado IN ('pendente','atrasado')) as total_quotas_divida,
              (SELECT string_agg(mes::text, ',') FROM pagamentos p WHERE p.membro_id = m.id AND p.estado IN ('pendente','atrasado') AND ano = EXTRACT(YEAR FROM CURRENT_DATE)) as meses_em_divida
       FROM membros m
       LEFT JOIN departamentos d ON d.id = m.departamento_id
       LEFT JOIN cargos c ON c.id = m.cargo_id
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/** POST /api/membros */
const criar = async (req, res, next) => {
  try {
    const {
      nome_completo, sexo, data_nascimento, estado_civil: raw_estado_civil, nif,
      bi_passaporte, telefone, email, morada, funcao_cargo, cargo_id,
      departamento_id, data_admissao, estado, observacoes
    } = req.body;

    const estado_civil = normalizeEstadoCivil(raw_estado_civil);

    if (!nome_completo || !sexo || !data_nascimento || !bi_passaporte) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, sexo, data de nascimento, BI/Passaporte' });
    }

    // Verificar limite de quadros se departamento for selecionado e membro for ativo
    if (departamento_id && (estado === 'ativo' || !estado)) {
      const deptResult = await query(
        `SELECT limite_quadros, nome FROM departamentos WHERE id = $1`,
        [departamento_id]
      );
      if (deptResult.rows.length > 0) {
        const { limite_quadros, nome: deptNome } = deptResult.rows[0];
        if (limite_quadros && limite_quadros > 0) {
          const countResult = await query(
            `SELECT COUNT(*) FROM membros WHERE departamento_id = $1 AND estado = 'ativo'`,
            [departamento_id]
          );
          const ativos = parseInt(countResult.rows[0].count);
          if (ativos >= limite_quadros) {
            return res.status(400).json({
              error: `O departamento "${deptNome}" atingiu o limite máximo de membros ativos (${limite_quadros} vagas). Não é possível registar mais membros.`
            });
          }
        }
      }
    }

    const foto_url = req.file ? `/uploads/fotos/${req.file.filename}` : null;

    // gerar número do membro se não foi fornecido
    const numero_membro = req.body.numero_membro && req.body.numero_membro.trim() ? req.body.numero_membro.trim() : await gerarNumeroMembro();

    const result = await query(
      `INSERT INTO membros 
       (numero_membro, nome_completo, foto_url, sexo, data_nascimento, estado_civil, nif,
        bi_passaporte, telefone, email, morada, funcao_cargo, cargo_id, departamento_id,
        data_admissao, estado, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [numero_membro, nome_completo, foto_url, sexo, data_nascimento, estado_civil || 'solteiro', nif,
        bi_passaporte, telefone, email, morada, funcao_cargo, cargo_id || null,
        departamento_id || null, data_admissao || new Date(), estado || 'ativo', observacoes]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Membro criado com sucesso' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'BI/Passaporte, NIF ou Email já registado no sistema' });
    }
    next(err);
  }
};

/** PUT /api/membros/:id */
const atualizar = async (req, res, next) => {
  try {
    const {
      nome_completo, sexo, data_nascimento, estado_civil: raw_estado_civil, nif,
      bi_passaporte, telefone, email, morada, funcao_cargo, cargo_id,
      departamento_id, data_admissao, estado, observacoes, historico_profissional
    } = req.body;

    const estado_civil = normalizeEstadoCivil(raw_estado_civil);

    const foto_url = req.file ? `/uploads/fotos/${req.file.filename}` : undefined;

    const existing = await query('SELECT departamento_id, estado FROM membros WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }
    const currentMembro = existing.rows[0];

    const targetDeptId = departamento_id !== undefined ? departamento_id : currentMembro.departamento_id;
    const targetEstado = estado !== undefined ? estado : currentMembro.estado;

    // Verificar limite se o membro estiver ativo no departamento de destino
    if (targetDeptId && targetEstado === 'ativo') {
      const deptResult = await query(
        `SELECT limite_quadros, nome FROM departamentos WHERE id = $1`,
        [targetDeptId]
      );
      if (deptResult.rows.length > 0) {
        const { limite_quadros, nome: deptNome } = deptResult.rows[0];
        if (limite_quadros && limite_quadros > 0) {
          const countResult = await query(
            `SELECT COUNT(*) FROM membros WHERE departamento_id = $1 AND estado = 'ativo' AND id != $2`,
            [targetDeptId, req.params.id]
          );
          const ativos = parseInt(countResult.rows[0].count);
          if (ativos >= limite_quadros) {
            return res.status(400).json({
              error: `O departamento "${deptNome}" atingiu o limite máximo de membros ativos (${limite_quadros} vagas). Não é possível transferir/ativar este membro.`
            });
          }
        }
      }
    }

    const setParts = [];
    const params = [];

    const fields = {
      nome_completo, sexo, data_nascimento, estado_civil, nif, bi_passaporte,
      telefone, email, morada, funcao_cargo, cargo_id, departamento_id, data_admissao, estado,
      observacoes, historico_profissional
    };
    if (foto_url) fields.foto_url = foto_url;

    Object.entries(fields).forEach(([key, val]) => {
      if (val !== undefined) {
        params.push(val);
        setParts.push(`${key} = $${params.length}`);
      }
    });

    if (!setParts.length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    params.push(req.params.id);
    const result = await query(
      `UPDATE membros SET ${setParts.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    res.json({ success: true, data: result.rows[0], message: 'Membro atualizado com sucesso' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'BI/Passaporte, NIF ou Email já existe noutro membro' });
    }
    next(err);
  }
};

/** DELETE /api/membros/:id */
const eliminar = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM membros WHERE id = $1 RETURNING id, nome_completo', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }
    res.json({ success: true, message: `Membro ${result.rows[0].nome_completo} eliminado` });
  } catch (err) {
    next(err);
  }
};

/** GET /api/membros/:id/pagamentos */
const pagamentosMembro = async (req, res, next) => {
  try {
    const { ano = new Date().getFullYear() } = req.query;
    const result = await query(
      `SELECT p.*, u.nome as registado_por_nome
       FROM pagamentos p
       LEFT JOIN utilizadores u ON u.id = p.registado_por
       WHERE p.membro_id = $1 AND p.ano = $2
       ORDER BY p.mes ASC`,
      [req.params.id, ano]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/** GET /api/membros/estatisticas */
const estatisticas = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE estado = 'ativo') as ativos,
        COUNT(*) FILTER (WHERE estado = 'suspenso') as suspensos,
        COUNT(*) FILTER (WHERE estado = 'reformado') as reformados,
        COUNT(*) FILTER (WHERE estado = 'inativo') as inativos,
        COUNT(*) FILTER (WHERE sexo = 'masculino') as masculinos,
        COUNT(*) FILTER (WHERE sexo = 'feminino') as femininos
      FROM membros
    `);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/** GET /api/membros/:id/cartao */
const obterCartao = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT m.*, d.nome as departamento_nome FROM membros m LEFT JOIN departamentos d ON d.id = m.departamento_id WHERE m.id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }

    const membro = result.rows[0];

    // Definir headers antes de criar o documento
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cartao_${membro.numero_membro}.pdf"`);

    // Criar PDF do cartão com frente e verso seguindo o layout de exemplo
    const doc = new PDFDocument({ size: 'A6', layout: 'landscape', margin: 10 });
    doc.pipe(res);

    const assetsDir = path.join(__dirname, '../../uploads/assets');
    const logoPath = path.join(assetsDir, 'logo.png');
    const bgPath = path.join(assetsDir, 'card_example.png'); // template de cartão (frente/verso)

    // Generate QR Code data
    const qrData = `SF-DGCI | Membro: ${membro.numero_membro}\nNome: ${membro.nome_completo}\nEntidade: ${membro.departamento_nome || 'N/A'}`;
    const qrImage = await QRCode.toDataURL(qrData, { margin: 1, width: 100, color: { dark: '#1a2f5e', light: '#ffffff' } });

    // --- Frente ---
    // background template (if available)
    if (fs.existsSync(bgPath)) {
      try { doc.image(bgPath, 0, 0, { width: doc.page.width, height: doc.page.height }); } catch (e) { }
    } else {
      // background and watermark
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');
      if (fs.existsSync(logoPath)) {
        doc.save();
        doc.opacity(0.06);
        doc.image(logoPath, (doc.page.width - 150) / 2, (doc.page.height - 150) / 2, { width: 150 });
        doc.restore();
      }
      
      // header bar Navy
      doc.rect(0, 0, doc.page.width, 24).fill('#1a2f5e');
      doc.fillColor('#c9a227').fontSize(9).font('Helvetica-Bold').text('SINDICATO DA DIREÇÃO-GERAL DAS CONTRIBUIÇÕES E IMPOSTOS', 0, 8, { align: 'center', width: doc.page.width });
    }

    // Foto/avatar box (left)
    const avatarX = 20;
    const avatarY = 35;
    const avatarSize = 88;
    doc.roundedRect(avatarX, avatarY, avatarSize, avatarSize, 8).fillOpacity(1).fill('#f4f7fb');
    doc.fillColor('#1a2f5e').fontSize(34).font('Helvetica-Bold').text((membro.nome_completo || 'M').charAt(0), avatarX + avatarSize / 2 - 12, avatarY + avatarSize / 2 - 14);

    // Left small member number
    doc.fillColor('#c9a227').fontSize(8).font('Helvetica-Bold').text('Nº DE MEMBRO', avatarX, avatarY + avatarSize + 8);
    doc.fillColor('#1a2f5e').fontSize(10).text(membro.numero_membro || '-', avatarX, avatarY + avatarSize + 20);

    // Center panel
    const infoX = 125;
    
    // yellow badge (Accent Gold)
    doc.roundedRect(infoX, 35, 100, 18, 4).fill('#c9a227');
    doc.fillColor('#ffffff').fontSize(8).text('CARTÃO DE MEMBRO', infoX + 6, 39);

    // member details
    doc.fillColor('#1a2f5e').fontSize(9).font('Helvetica-Bold').text('NOME:', infoX, 65);
    doc.font('Helvetica').fontSize(9).text(membro.nome_completo || '-', infoX + 50, 65, { width: 150, height: 12 });
    
    doc.font('Helvetica-Bold').fontSize(9).text('PROFISSÃO:', infoX, 85);
    doc.font('Helvetica').fontSize(9).text(membro.funcao_cargo || '-', infoX + 70, 85, { width: 130, height: 12 });
    
    doc.font('Helvetica-Bold').fontSize(9).text('ENTIDADE:', infoX, 105);
    doc.font('Helvetica').fontSize(9).text(membro.departamento_nome || '-', infoX + 65, 105, { width: 140, height: 12 });

    // QR Image (right)
    doc.image(qrImage, doc.page.width - 85, 35, { width: 65, height: 65 });

    // If member has a photo, try to draw it inside avatar box
    if (membro.foto_url) {
      try {
        const photoPath = path.join(__dirname, '../../', membro.foto_url.replace(/^\//, ''));
        if (fs.existsSync(photoPath)) {
          // fit photo inside avatar box with padding
          doc.image(photoPath, avatarX + 6, avatarY + 6, { width: avatarSize - 12, height: avatarSize - 12, fit: [avatarSize - 12, avatarSize - 12] });
        }
      } catch (e) { }
    }

    // Admission and validity
    const adm = membro.data_admissao ? new Date(membro.data_admissao) : null;
    const validade = adm ? new Date(adm.getFullYear() + 1, adm.getMonth(), adm.getDate()) : null;
    if (adm) {
      const fmt = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      doc.fillColor('#1a2f5e').fontSize(8).font('Helvetica-Bold').text('ADMISSÃO:', infoX, 130);
      doc.font('Helvetica').fontSize(8).text(adm ? fmt(adm) : '-', infoX + 65, 130);
      doc.font('Helvetica-Bold').fontSize(8).text('VALIDADE:', infoX + 130, 130);
      doc.font('Helvetica').fontSize(8).text(validade ? fmt(validade) : '-', infoX + 185, 130);
    }

    // --- Verso ---
    doc.addPage({ size: 'A6', layout: 'landscape', margin: 10 });

    // background for verso
    if (fs.existsSync(bgPath)) {
      try { doc.image(bgPath, 0, 0, { width: doc.page.width, height: doc.page.height }); } catch (e) { }
    } else {
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');
      if (fs.existsSync(logoPath)) {
        doc.save();
        doc.opacity(0.06);
        doc.image(logoPath, (doc.page.width - 150) / 2, (doc.page.height - 150) / 2, { width: 150 });
        doc.restore();
      }
    }

    // Verso content
    try {
      if (fs.existsSync(logoPath)) {
        const logoW = 50;
        doc.image(logoPath, (doc.page.width - logoW) / 2, 15, { width: logoW });
      }
    } catch (e) { }

    doc.fillColor('#1a2f5e').fontSize(10).font('Helvetica-Bold').text('O TITULAR DESTE CARTÃO', 20, 20);
    doc.fillColor('#4b5563').fontSize(8).font('Helvetica').text('É membro efetivo do Sindicato dos Funcionários da Direção-Geral das Contribuições e Impostos, estando em pleno gozo dos seus direitos e deveres estatutários.', 20, 36, { width: doc.page.width / 2 - 20 });

    doc.fillColor('#1a2f5e').fontSize(9).font('Helvetica-Bold').text('MISSÃO DO SINDICATO', doc.page.width / 2 + 10, 20);
    doc.fillColor('#4b5563').fontSize(8).text('Defender os direitos, promover o bem-estar e valorizar todos os funcionários da DGCI.', doc.page.width / 2 + 10, 36, { width: doc.page.width / 2 - 30 });

    // footer contact bar
    doc.rect(0, doc.page.height - 34, doc.page.width, 34).fill('#1a2f5e');
    doc.fillColor('white').fontSize(7).text('Sindicato DGCI  •  sindicatodgci@gmail.com  •  +245 95 123 45 67', 12, doc.page.height - 22, { align: 'center', width: doc.page.width - 24 });

    doc.end();
  } catch (err) {
    next(err);
  }
};

module.exports = { listar, obter, criar, atualizar, eliminar, pagamentosMembro, estatisticas, obterCartao, nextNumero };
