const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Middleware de autenticação JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar utilizador atualizado da base de dados
    const result = await query(
      'SELECT id, nome, email, perfil, ativo FROM utilizadores WHERE id = $1',
      [decoded.id]
    );

    if (!result.rows.length || !result.rows[0].ativo) {
      return res.status(401).json({ error: 'Utilizador inativo ou não encontrado' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    next(err);
  }
};

/**
 * Middleware opcional de autenticação (não falha se não houver token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      'SELECT id, nome, email, perfil, ativo FROM utilizadores WHERE id = $1',
      [decoded.id]
    );
    req.user = result.rows.length ? result.rows[0] : null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = { authenticate, optionalAuth };
