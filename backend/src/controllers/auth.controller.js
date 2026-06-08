const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { sanitizeEmail, sanitizeString } = require('../utils/sanitize');
const { normalizeUploadUrl } = require('../utils/uploadUrl');

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

    // ✅ Validação e sanitização (expressValidator já fez isso nas rotas)
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail || !password) {
      return res.status(400).json({ error: 'Email e password são obrigatórios' });
    }

    const result = await query(
      `SELECT u.*, m.nome_completo as membro_nome, m.foto_url as membro_foto
       FROM utilizadores u
       LEFT JOIN membros m ON m.id = u.membro_id
       WHERE u.email = $1`,
      [cleanEmail]
    );

    if (!result.rows.length) {
      // ✅ Log de tentativa falhada (auditoria)
      await query(
        `INSERT INTO auditoria_logs (utilizador_nome, acao, entidade, status_code, ip_address, detalhes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['anonymous', 'LOGIN_FALHOU', 'auth', 401, req.ip, JSON.stringify({ email: cleanEmail })]
      ).catch(() => { });  // Ignorar erro na auditoria

      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];
    if (!user.ativo) {
      return res.status(401).json({ error: 'Conta desativada. Contacte o administrador.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      // ✅ Log de tentativa falhada
      await query(
        `INSERT INTO auditoria_logs (utilizador_id, utilizador_nome, acao, entidade, status_code, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, user.nome, 'LOGIN_FALHOU', 'auth', 401, req.ip]
      ).catch(() => { });

      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Atualizar último login
    await query('UPDATE utilizadores SET ultimo_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);

    // ✅ Log de auditoria de sucesso
    await query(
      `INSERT INTO auditoria_logs (utilizador_id, utilizador_nome, acao, entidade, ip_address, status_code)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, user.nome, 'LOGIN_SUCESSO', 'auth', req.ip, 200]
    ).catch(() => { });

    // ✅ SEGURANÇA: Enviar token em httpOnly cookie (protege contra XSS)
    res.cookie('authToken', token, {
      httpOnly: true,      // Não acessível via JavaScript
      secure: process.env.NODE_ENV === 'production',  // HTTPS only em produção
      sameSite: 'Strict',  // Protege contra CSRF
      maxAge: 24 * 60 * 60 * 1000,  // 24 horas
      path: '/'
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        nome: sanitizeString(user.nome),
        email: cleanEmail,
        perfil: user.perfil,
        avatar_url: normalizeUploadUrl(user.avatar_url),
        membro_foto: normalizeUploadUrl(user.membro_foto),
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

    // ✅ Limpar cookie httpOnly
    res.clearCookie('authToken', { path: '/' });

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
    const data = result.rows[0] ? { ...result.rows[0] } : null;
    if (data) {
      data.avatar_url = normalizeUploadUrl(data.avatar_url);
      data.membro_foto = normalizeUploadUrl(data.membro_foto);
    }
    res.json({ success: true, data });
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
