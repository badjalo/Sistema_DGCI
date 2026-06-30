const { query } = require('../config/database');
const { normalizeMembersList } = require('../utils/uploadUrl');

/** GET /api/pesquisa */
const pesquisar = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) {
      return res.json({
        success: true,
        data: { membros: [], documentos: [], comunicados: [] }
      });
    }

    const searchTerm = `%${q}%`;

    // Query members
    const membrosPromise = query(`
      SELECT id, numero_membro, nome_completo, email, estado, foto_url
      FROM membros
      WHERE nome_completo ILIKE $1 OR email ILIKE $1 OR numero_membro ILIKE $1
      LIMIT 8
    `, [searchTerm]);

    // Query documents
    const documentosPromise = query(`
      SELECT id, titulo, tipo, descricao, publico
      FROM documentos
      WHERE titulo ILIKE $1 OR descricao ILIKE $1
      LIMIT 8
    `, [searchTerm]);

    // Query news/comunicados
    const comunicadosPromise = query(`
      SELECT id, titulo, tipo, estado, criado_em
      FROM comunicados
      WHERE titulo ILIKE $1 OR conteudo ILIKE $1
      LIMIT 8
    `, [searchTerm]);

    const [membrosRes, documentosRes, comunicadosRes] = await Promise.all([
      membrosPromise,
      documentosPromise,
      comunicadosPromise
    ]);

    res.json({
      success: true,
      data: {
        membros: normalizeMembersList(membrosRes.rows),
        documentos: documentosRes.rows,
        comunicados: comunicadosRes.rows
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { pesquisar };
