const { query } = require('../config/database');
const { normalizeMemberData, normalizeMembersList } = require('../utils/uploadUrl');


const gerarNumeroMembro = async () => {
  // use DB sequence to avoid race conditions
  const ano = new Date().getFullYear();
  const r = await query(`SELECT nextval('membros_num_seq') as seq`);
  const seq = String(r.rows[0].seq).padStart(5, '0');
  return `SF-DGCI-${ano}-${seq}`;
};

/** GET /api/membros/:id/qr */
const obterQR = async (req, res, next) => {
  try {
    const result = await query('SELECT numero_membro FROM membros WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Membro não encontrado' });
    const numero = result.rows[0].numero_membro;
    const QR = require('qrcode');
    const url = `https://www.sfdgci.co.mz/membro/${encodeURIComponent(numero)}`;
    const svg = await QR.toString(url, { type: 'svg', color: { dark: '#072a52', light: '#ffffff' } });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    next(err);
  }
};

/** GET /api/membros/qr/numero/:numero */
const obterQRByNumero = async (req, res, next) => {
  try {
    const numeroParam = req.params.numero;
    const result = await query('SELECT id, numero_membro FROM membros WHERE numero_membro = $1', [numeroParam]);
    if (!result.rows.length) return res.status(404).json({ error: 'Membro não encontrado' });
    const numero = result.rows[0].numero_membro;
    const QR = require('qrcode');
    const url = `https://www.sfdgci.co.mz/membro/${encodeURIComponent(numero)}`;
    const svg = await QR.toString(url, { type: 'svg', color: { dark: '#072a52', light: '#ffffff' } });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    next(err);
  }
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
      data: normalizeMembersList(result.rows),
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
    res.json({ success: true, data: normalizeMemberData(result.rows[0]) });
  } catch (err) {
    next(err);
  }
};

/** POST /api/membros */
const criar = async (req, res, next) => {
  try {
    let {
      nome_completo, sexo, data_nascimento, estado_civil: raw_estado_civil, nif,
      bi_passaporte, telefone, email, morada, funcao_cargo, cargo_id,
      departamento_id, data_admissao, estado, observacoes, fundo_social
    } = req.body;

    nif = nif && nif.trim() !== '' ? nif.trim() : null;
    email = email && email.trim() !== '' ? email.trim() : null;

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

    const fotoFile = req.files && req.files['foto'] && req.files['foto'][0];
    const assinaturaFile = req.files && req.files['assinatura'] && req.files['assinatura'][0];
    const foto_url = fotoFile ? `/uploads/fotos/${fotoFile.filename}` : null;
    const assinatura_url = assinaturaFile ? `/uploads/assinaturas/${assinaturaFile.filename}` : null;

    // gerar número do membro se não foi fornecido
    const numero_membro = req.body.numero_membro && req.body.numero_membro.trim() ? req.body.numero_membro.trim() : await gerarNumeroMembro();

    const duplicateCheck = await query(
      `SELECT nif, bi_passaporte, email
       FROM membros
       WHERE (nif IS NOT NULL AND nif <> '' AND nif = $1)
          OR bi_passaporte = $2
          OR (email IS NOT NULL AND email <> '' AND email = $3)
       LIMIT 1`,
      [nif || '', bi_passaporte, email || '']
    );

    if (duplicateCheck.rows.length) {
      const duplicate = duplicateCheck.rows[0];
      if (duplicate.bi_passaporte === bi_passaporte) {
        return res.status(409).json({ error: 'BI/Passaporte já registado no sistema' });
      }
      if (duplicate.nif && nif && duplicate.nif === nif) {
        return res.status(409).json({ error: 'NIF já registado no sistema' });
      }
      if (duplicate.email && email && duplicate.email === email) {
        return res.status(409).json({ error: 'Email já registado no sistema' });
      }
    }

    const result = await query(
      `INSERT INTO membros 
       (numero_membro, nome_completo, foto_url, assinatura_url, sexo, data_nascimento, estado_civil, nif,
        bi_passaporte, telefone, email, morada, funcao_cargo, cargo_id, departamento_id,
        data_admissao, estado, observacoes, fundo_social)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [numero_membro, nome_completo, foto_url, assinatura_url, sexo, data_nascimento, estado_civil || 'solteiro', nif,
        bi_passaporte, telefone, email, morada, funcao_cargo, cargo_id || null,
        departamento_id || null, data_admissao || new Date(), estado || 'ativo', observacoes, fundo_social === 'true' || fundo_social === true]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Membro criado com sucesso' });
  } catch (err) {
    if (err.code === '23505') {
      const detail = err.detail || '';
      let field = 'BI/Passaporte, NIF ou Email';
      if (detail.includes('nif')) field = 'NIF';
      else if (detail.includes('bi_passaporte')) field = 'BI/Passaporte';
      else if (detail.includes('email')) field = 'Email';
      return res.status(409).json({ error: `${field} já registado no sistema` });
    }
    next(err);
  }
};

/** PUT /api/membros/:id */
const atualizar = async (req, res, next) => {
  try {
    let {
      nome_completo, sexo, data_nascimento, estado_civil: raw_estado_civil, nif,
      bi_passaporte, telefone, email, morada, funcao_cargo, cargo_id,
      departamento_id, data_admissao, estado, observacoes, historico_profissional, fundo_social
    } = req.body;

    if (nif !== undefined) nif = nif && nif.trim() !== '' ? nif.trim() : null;
    if (email !== undefined) email = email && email.trim() !== '' ? email.trim() : null;

    const estado_civil = normalizeEstadoCivil(raw_estado_civil);

    // Debug: Rastrear upload de foto
    console.log('[ATUALIZAR] req.files disponível:', !!req.files);
    if (req.files) {
      console.log('[ATUALIZAR] Campos de files:', Object.keys(req.files));
      if (req.files.foto) {
        console.log('[ATUALIZAR] req.files.foto[0]:', {
          originalname: req.files.foto[0].originalname,
          filename: req.files.foto[0].filename,
          path: req.files.foto[0].path
        });
      }
    }

    const fotoFile = req.files && req.files['foto'] && req.files['foto'][0];
    const assinaturaFile = req.files && req.files['assinatura'] && req.files['assinatura'][0];
    const foto_url = fotoFile ? `/uploads/fotos/${fotoFile.filename}` : undefined;
    const assinatura_url = assinaturaFile ? `/uploads/assinaturas/${assinaturaFile.filename}` : undefined;

    console.log('[ATUALIZAR] foto_url:', foto_url);
    console.log('[ATUALIZAR] assinatura_url:', assinatura_url);

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
    if (assinatura_url) fields.assinatura_url = assinatura_url;
    if (fundo_social !== undefined) {
      fields.fundo_social = fundo_social === 'true' || fundo_social === true;
    }

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

    res.json({ success: true, data: normalizeMemberData(result.rows[0]), message: 'Membro atualizado com sucesso' });
  } catch (err) {
    if (err.code === '23505') {
      const detail = err.detail || '';
      let field = 'BI/Passaporte, NIF ou Email';
      if (detail.includes('nif')) field = 'NIF';
      else if (detail.includes('bi_passaporte')) field = 'BI/Passaporte';
      else if (detail.includes('email')) field = 'Email';
      return res.status(409).json({ error: `${field} já existe noutro membro` });
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
      `SELECT m.*, d.nome as departamento_nome, c.nome as cargo_nome
       FROM membros m
       LEFT JOIN departamentos d ON d.id = m.departamento_id
       LEFT JOIN cargos c ON c.id = m.cargo_id
       WHERE m.id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }

    const membro = result.rows[0];
    const cardResult = await query(
      `SELECT data_validade FROM cartoes WHERE membro_id = $1 AND estado = true ORDER BY criado_em DESC LIMIT 1`,
      [req.params.id]
    );
    if (cardResult.rows.length) {
      membro.data_validade = cardResult.rows[0].data_validade;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cartao_${membro.numero_membro}.pdf"`);

    const { generateCard } = require('../utils/cardGenerator');
    await generateCard(membro, res);
  } catch (err) {
    next(err);
  }
};

module.exports = { listar, obter, criar, atualizar, eliminar, pagamentosMembro, estatisticas, obterCartao, nextNumero, obterQR, obterQRByNumero };
