const { query } = require('../config/database');

/**
 * Middleware de auditoria - regista todas as operações
 */
const auditLog = (acao, entidade) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = async function(data) {
      // Apenas regista se a resposta for bem-sucedida
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          await query(
            `INSERT INTO auditoria_logs 
             (utilizador_id, utilizador_nome, acao, entidade, entidade_id, dados_depois, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              req.user.id,
              req.user.nome,
              acao,
              entidade,
              data?.data?.id || req.params?.id || null,
              data ? JSON.stringify(data) : null,
              req.ip || req.headers['x-forwarded-for'],
              req.headers['user-agent']?.substring(0, 250)
            ]
          );
        } catch (err) {
          console.error('[Auditoria] Erro ao registar log:', err.message);
        }
      }
      return originalJson(data);
    };
    next();
  };
};

module.exports = { auditLog };
