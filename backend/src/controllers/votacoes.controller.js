const { query, getClient } = require('../config/database');

/** GET /api/votacoes */
const listarVotacoes = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT v.*, 
             COALESCE(SUM(o.votos_count), 0) as total_votos,
             EXISTS(SELECT 1 FROM votos_registados vr WHERE vr.votacao_id = v.id AND vr.utilizador_id = $1) as ja_votou
      FROM votacoes v
      LEFT JOIN opcoes_voto o ON o.votacao_id = v.id
      GROUP BY v.id
      ORDER BY v.data_inicio DESC
    `, [req.user.id]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/** GET /api/votacoes/:id */
const obterVotacao = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obter dados da votação
    const votacaoRes = await query(`
      SELECT v.*, 
             EXISTS(SELECT 1 FROM votos_registados vr WHERE vr.votacao_id = v.id AND vr.utilizador_id = $1) as ja_votou
      FROM votacoes v
      WHERE v.id = $2
    `, [req.user.id, id]);

    if (!votacaoRes.rows.length) {
      return res.status(404).json({ error: 'Votação não encontrada' });
    }

    const votacao = votacaoRes.rows[0];

    // Obter opções de voto
    const opcoesRes = await query(`
      SELECT id, descricao, votos_count 
      FROM opcoes_voto 
      WHERE votacao_id = $1
      ORDER BY descricao
    `, [id]);

    res.json({
      success: true,
      data: {
        ...votacao,
        opcoes: opcoesRes.rows
      }
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/votacoes */
const criarVotacao = async (req, res, next) => {
  const client = await getClient();
  try {
    const { titulo, descricao, data_inicio, data_fim, opcoes } = req.body;

    if (!titulo || !data_inicio || !data_fim || !opcoes || !Array.isArray(opcoes) || opcoes.length < 2) {
      return res.status(400).json({ error: 'Título, data de início, data de fim e pelo menos duas opções são obrigatórios.' });
    }

    await client.query('BEGIN');

    // Inserir votação
    const votacaoRes = await client.query(`
      INSERT INTO votacoes (titulo, descricao, data_inicio, data_fim, criado_por)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [titulo, descricao, data_inicio, data_fim, req.user.id]);

    const newVotacao = votacaoRes.rows[0];

    // Inserir opções
    const insertedOpcoes = [];
    for (const opcao of opcoes) {
      if (!opcao.trim()) continue;
      const oRes = await client.query(`
        INSERT INTO opcoes_voto (votacao_id, descricao)
        VALUES ($1, $2)
        RETURNING *
      `, [newVotacao.id, opcao.trim()]);
      insertedOpcoes.push(oRes.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        ...newVotacao,
        opcoes: insertedOpcoes
      }
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
};

/** PUT /api/votacoes/:id */
const atualizarVotacao = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, data_inicio, data_fim, ativa } = req.body;

    const currentVot = await query('SELECT * FROM votacoes WHERE id = $1', [id]);
    if (!currentVot.rows.length) {
      return res.status(404).json({ error: 'Votação não encontrada' });
    }

    const fields = [];
    const params = [id];

    if (titulo !== undefined) { params.push(titulo); fields.push(`titulo = $${params.length}`); }
    if (descricao !== undefined) { params.push(descricao); fields.push(`descricao = $${params.length}`); }
    if (data_inicio !== undefined) { params.push(data_inicio); fields.push(`data_inicio = $${params.length}`); }
    if (data_fim !== undefined) { params.push(data_fim); fields.push(`data_fim = $${params.length}`); }
    if (ativa !== undefined) { params.push(ativa); fields.push(`ativa = $${params.length}`); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo fornecido para atualização.' });
    }

    const result = await query(`
      UPDATE votacoes 
      SET ${fields.join(', ')} 
      WHERE id = $1 
      RETURNING *
    `, params);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/votacoes/:id */
const eliminarVotacao = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM votacoes WHERE id = $1 RETURNING *', [id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Votação não encontrada' });
    }

    res.json({ success: true, message: 'Votação eliminada com sucesso' });
  } catch (err) {
    next(err);
  }
};

/** POST /api/votacoes/:id/votar */
const votar = async (req, res, next) => {
  const client = await getClient();
  try {
    const { id } = req.params;
    const { opcao_id } = req.body;

    if (!opcao_id) {
      return res.status(400).json({ error: 'Opção de voto é obrigatória.' });
    }

    await client.query('BEGIN');

    // 1. Verificar se a votação existe e está ativa
    const votacaoRes = await client.query(`
      SELECT * FROM votacoes WHERE id = $1
    `, [id]);

    if (!votacaoRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Votação não encontrada' });
    }

    const votacao = votacaoRes.rows[0];
    const agora = new Date();
    const dataInicio = new Date(votacao.data_inicio);
    const dataFim = new Date(votacao.data_fim);

    if (!votacao.ativa || agora < dataInicio || agora > dataFim) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Esta votação não está ativa no momento.' });
    }

    // 2. Verificar se o utilizador já votou
    const checkVoto = await client.query(`
      SELECT 1 FROM votos_registados WHERE votacao_id = $1 AND utilizador_id = $2
    `, [id, req.user.id]);

    if (checkVoto.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Já registou o seu voto nesta votação/sondagem.' });
    }

    // 3. Verificar se a opção pertence a esta votação
    const checkOpcao = await client.query(`
      SELECT 1 FROM opcoes_voto WHERE id = $1 AND votacao_id = $2
    `, [opcao_id, id]);

    if (!checkOpcao.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Opção de voto inválida para esta votação.' });
    }

    // 4. Registar voto
    await client.query(`
      INSERT INTO votos_registados (votacao_id, utilizador_id, opcao_id)
      VALUES ($1, $2, $3)
    `, [id, req.user.id, opcao_id]);

    // 5. Incrementar contador da opção
    await client.query(`
      UPDATE opcoes_voto 
      SET votos_count = votos_count + 1 
      WHERE id = $1
    `, [opcao_id]);

    await client.query('COMMIT');

    res.json({ success: true, message: 'Voto registado com sucesso!' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
};

module.exports = {
  listarVotacoes,
  obterVotacao,
  criarVotacao,
  atualizarVotacao,
  eliminarVotacao,
  votar
};
