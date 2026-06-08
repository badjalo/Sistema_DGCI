const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Middleware de autenticação JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // ✅ Ler token de httpOnly cookie (mais seguro que localStorage)
    let token = req.cookies?.authToken;

    // Fallback para Authorization header (compatibilidade com mobile)
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

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
/**
 * Middleware opcional de autenticação (não falha se não houver token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    // ✅ Ler token de httpOnly cookie
    let token = req.cookies?.authToken;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

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
