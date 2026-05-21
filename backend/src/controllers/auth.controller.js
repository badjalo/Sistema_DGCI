const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, perfil: user.perfil },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/** POST /api/auth/login */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password são obrigatórios' });
    }

    const result = await query(
      `SELECT u.*, m.nome_completo as membro_nome, m.foto_url as membro_foto
       FROM utilizadores u
       LEFT JOIN membros m ON m.id = u.membro_id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];
    if (!user.ativo) {
      return res.status(401).json({ error: 'Conta desativada. Contacte o administrador.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Atualizar último login
    await query('UPDATE utilizadores SET ultimo_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);

    // Log de auditoria
    await query(
      `INSERT INTO auditoria_logs (utilizador_id, utilizador_nome, acao, entidade, ip_address)
       VALUES ($1, $2, 'LOGIN', 'utilizadores', $3)`,
      [user.id, user.nome, req.ip]
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
        avatar_url: user.avatar_url,
        membro_foto: user.membro_foto,
        preferencias: user.preferencias
      }
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/auth/logout */
const logout = async (req, res, next) => {
  try {
    await query(
      `INSERT INTO auditoria_logs (utilizador_id, utilizador_nome, acao, entidade)
       VALUES ($1, $2, 'LOGOUT', 'utilizadores')`,
      [req.user.id, req.user.nome]
    );
    res.json({ success: true, message: 'Sessão terminada com sucesso' });
  } catch (err) {
    next(err);
  }
};

/** GET /api/auth/me */
const me = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.nome, u.email, u.perfil, u.ativo, u.ultimo_login, u.avatar_url, u.preferencias,
              m.numero_membro, m.foto_url as membro_foto, m.funcao_cargo,
              d.nome as departamento
       FROM utilizadores u
       LEFT JOIN membros m ON m.id = u.membro_id
       LEFT JOIN departamentos d ON d.id = m.departamento_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/auth/change-password */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Passwords atual e nova são obrigatórias' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'A nova password deve ter pelo menos 8 caracteres' });
    }

    const result = await query('SELECT password_hash FROM utilizadores WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Password atual incorreta' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE utilizadores SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);

    await query(
      `INSERT INTO auditoria_logs (utilizador_id, utilizador_nome, acao, entidade)
       VALUES ($1, $2, 'CHANGE_PASSWORD', 'utilizadores')`,
      [req.user.id, req.user.nome]
    );

    res.json({ success: true, message: 'Password alterada com sucesso' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, logout, me, changePassword };
