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

    const cookieSameSite = process.env.COOKIE_SAMESITE || 'Strict';
    const isSameSiteNone = cookieSameSite.toLowerCase() === 'none';
    const cookieSecure = isSameSiteNone || process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';

    // ✅ SEGURANÇA: Enviar token em httpOnly cookie (protege contra XSS)
    res.cookie('authToken', token, {
      httpOnly: true,      // Não acessível via JavaScript
      secure: cookieSecure,  // HTTPS only
      sameSite: isSameSiteNone ? 'none' : cookieSameSite,
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

    const cookieSameSite = process.env.COOKIE_SAMESITE || 'Strict';
    const isSameSiteNone = cookieSameSite.toLowerCase() === 'none';
    const cookieSecure = isSameSiteNone || process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';

    // ✅ Limpar cookie httpOnly
    res.clearCookie('authToken', { 
      path: '/',
      secure: cookieSecure,
      sameSite: isSameSiteNone ? 'none' : cookieSameSite
    });

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

/** POST /api/auth/recuperar-senha  (pública — sem autenticação) */
const recuperarSenha = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email é obrigatório.' });

    const cleanEmail = sanitizeEmail(email);
    const result = await query('SELECT id, nome, ativo FROM utilizadores WHERE email = $1', [cleanEmail]);

    // Resposta genérica mesmo que o email não exista (evita enumeração)
    if (!result.rows.length || !result.rows[0].ativo) {
      return res.json({ success: true, message: 'Se o email existir, o administrador será notificado.' });
    }

    const user = result.rows[0];

    // Gerar token seguro de 6 dígitos e expiração de 2 horas
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracao = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h

    // Garantir que a coluna existe (cria-a se necessário)
    await query(`
      ALTER TABLE utilizadores 
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(10),
      ADD COLUMN IF NOT EXISTS reset_token_expira TIMESTAMPTZ
    `).catch(() => {}); // Ignorar se já existe

    // Guardar token no utilizador
    await query(
      'UPDATE utilizadores SET reset_token = $1, reset_token_expira = $2 WHERE id = $3',
      [token, expiracao, user.id]
    );

    // Notificar todos os administradores
    const admins = await query(
      "SELECT id FROM utilizadores WHERE perfil = 'administrador' AND ativo = true"
    );
    for (const admin of admins.rows) {
      await query(
        `INSERT INTO notificacoes (utilizador_id, titulo, mensagem, tipo, lida, link)
         VALUES ($1, $2, $3, $4, false, $5)`,
        [
          admin.id,
          'Pedido de Recuperação de Senha',
          `O utilizador "${user.nome}" (${cleanEmail}) solicitou recuperação da senha. Código temporário: ${token} (válido 2h). Aceda a Configurações → Utilizadores para redefinir.`,
          'sistema',
          '/configuracoes'
        ]
      );
    }

    await query(
      `INSERT INTO auditoria_logs (utilizador_id, utilizador_nome, acao, entidade, ip_address)
       VALUES ($1, $2, 'RECUPERAR_SENHA', 'utilizadores', $3)`,
      [user.id, user.nome, req.ip]
    ).catch(() => {});

    res.json({ success: true, message: 'Se o email existir, o administrador será notificado.' });
  } catch (err) {
    next(err);
  }
};

/** POST /api/auth/redefinir-senha  (pública — usa token temporário) */
const redefinirSenha = async (req, res, next) => {
  try {
    const { email, token, nova_senha } = req.body;
    if (!email || !token || !nova_senha) {
      return res.status(400).json({ error: 'Email, código e nova senha são obrigatórios.' });
    }
    if (nova_senha.length < 8) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' });
    }

    const cleanEmail = sanitizeEmail(email);
    const result = await query(
      'SELECT id, nome, reset_token, reset_token_expira FROM utilizadores WHERE email = $1',
      [cleanEmail]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: 'Código inválido ou expirado.' });
    }

    const user = result.rows[0];
    if (user.reset_token !== token) {
      return res.status(400).json({ error: 'Código inválido ou expirado.' });
    }
    if (!user.reset_token_expira || new Date(user.reset_token_expira) < new Date()) {
      return res.status(400).json({ error: 'O código expirou. Solicite um novo.' });
    }

    const hash = await bcrypt.hash(nova_senha, 12);
    await query(
      'UPDATE utilizadores SET password_hash = $1, reset_token = NULL, reset_token_expira = NULL WHERE id = $2',
      [hash, user.id]
    );

    await query(
      `INSERT INTO auditoria_logs (utilizador_id, utilizador_nome, acao, entidade, ip_address)
       VALUES ($1, $2, 'REDEFINIR_SENHA', 'utilizadores', $3)`,
      [user.id, user.nome, req.ip]
    ).catch(() => {});

    res.json({ success: true, message: 'Senha redefinida com sucesso. Pode fazer login agora.' });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/auth/profile */
const updateProfile = async (req, res, next) => {
  try {
    const { nome, email, avatar_url } = req.body;
    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const checkEmail = await query('SELECT id FROM utilizadores WHERE email = $1 AND id <> $2', [email.toLowerCase().trim(), req.user.id]);
    if (checkEmail.rows.length) {
      return res.status(409).json({ error: 'Este email já está a ser utilizado por outro utilizador' });
    }

    const result = await query(
      `UPDATE utilizadores SET nome = $1, email = $2, avatar_url = $3
       WHERE id = $4 RETURNING id, nome, email, perfil, avatar_url`,
      [nome.trim(), email.toLowerCase().trim(), avatar_url || null, req.user.id]
    );

    await query(
      `INSERT INTO auditoria_logs (utilizador_id, utilizador_nome, acao, entidade)
       VALUES ($1, $2, 'UPDATE_PROFILE', 'utilizadores')`,
      [req.user.id, req.user.nome]
    ).catch(() => {});

    res.json({ success: true, data: result.rows[0], message: 'Perfil atualizado com sucesso' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, logout, me, changePassword, updateProfile, recuperarSenha, redefinirSenha };


