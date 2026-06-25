/**
 * RBAC - Role-Based Access Control
 * Controlo de permissões por perfil
 */

const PERMISSIONS = {
  administrador: ['*'], // Acesso total
  presidente: [
    'membros:read',
    'quotas:read',
    'pagamentos:read',
    'financeiro:read',
    'documentos:read',
    'comunicados:read',
    'relatorios:read',
    'departamentos:read',
    'cartoes:read',
    'utilizadores:read',
    'configuracoes:read',
    'dashboard:read',
    'auditoria:read',
    'transparencia:read',
    'votacoes:read',
    'votacoes:votar'
  ],
  tesoureiro: [
    'membros:read',
    'quotas:read', 'quotas:create', 'quotas:update',
    'pagamentos:read', 'pagamentos:create', 'pagamentos:update',
    'financeiro:read', 'financeiro:create', 'financeiro:update',
    'relatorios:read',
    'departamentos:read',
    'cartoes:read',
    'dashboard:read',
    'comunicados:read',
    'transparencia:read',
    'votacoes:read',
    'votacoes:votar'
  ],
  secretario: [
    'membros:read', 'membros:create', 'membros:update',
    'quotas:read',
    'pagamentos:read',
    'documentos:read', 'documentos:create', 'documentos:update',
    'comunicados:read', 'comunicados:create', 'comunicados:update',
    'departamentos:read',
    'cartoes:read', 'cartoes:create',
    'relatorios:read',
    'dashboard:read',
    'transparencia:read',
    'votacoes:read',
    'votacoes:votar',
    'votacoes:create',
    'votacoes:update',
    'votacoes:delete'
  ],
  operador: [
    'membros:read',
    'quotas:read',
    'pagamentos:read',
    'documentos:read',
    'comunicados:read',
    'departamentos:read',
    'cartoes:read',
    'dashboard:read',
    'transparencia:read',
    'votacoes:read',
    'votacoes:votar'
  ],
  auditor: [
    'membros:read',
    'quotas:read',
    'pagamentos:read',
    'financeiro:read',
    'documentos:read',
    'comunicados:read',
    'relatorios:read',
    'departamentos:read',
    'dashboard:read',
    'auditoria:read',
    'transparencia:read',
    'votacoes:read',
    'votacoes:votar'
  ],
  membro: [
    'dashboard:read',
    'transparencia:read',
    'votacoes:read',
    'votacoes:votar'
  ]
};

/**
 * Verifica se o utilizador tem a permissão requerida
 */
const hasPermission = (perfil, permission) => {
  const perms = PERMISSIONS[perfil] || [];
  return perms.includes('*') || perms.includes(permission);
};

/**
 * Middleware de autorização por permissão
 */
const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const hasAny = permissions.some(p => hasPermission(req.user.perfil, p));
    if (!hasAny) {
      return res.status(403).json({ 
        error: 'Acesso negado. Não tem permissão para esta operação.',
        required: permissions
      });
    }
    next();
  };
};

/**
 * Middleware: apenas administrador
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.perfil !== 'administrador') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
};

/**
 * Middleware: administrador ou presidente
 */
const adminOrPresidente = (req, res, next) => {
  if (!req.user || !['administrador', 'presidente'].includes(req.user.perfil)) {
    return res.status(403).json({ error: 'Acesso restrito a administradores e presidentes' });
  }
  next();
};

module.exports = { authorize, adminOnly, adminOrPresidente, hasPermission, PERMISSIONS };
