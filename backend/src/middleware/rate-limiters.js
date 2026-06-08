/**
 * ✅ Configuração de Rate Limiting por Utilizador
 * Proteção contra abuso e ataques
 */

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter geral (por IP)
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 300,                   // 300 requisições
    message: { error: 'Demasiadas requisições. Tente novamente mais tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.user?.perfil === 'administrador'  // Admins sem limite
});

/**
 * Rate limiter para login (por email/IP)
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 5,                     // 5 tentativas
    keyGenerator: (req) => req.body.email || req.ip,
    message: { error: 'Demasiadas tentativas de login. Tente novamente em 15 minutos.' },
    skip: (req) => req.user?.perfil === 'administrador'
});

/**
 * Rate limiter para change password (por utilizador)
 */
const changePasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,   // 1 hora
    max: 3,                      // 3 tentativas por hora
    keyGenerator: (req) => req.user?.id || req.ip,
    message: { error: 'Muitas tentativas de alteração de password. Tente novamente em 1 hora.' },
    skip: (req) => req.user?.perfil === 'administrador'
});

/**
 * Rate limiter para criação de membros (por minuto)
 */
const createResourceLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 minuto
    max: 10,                     // 10 por minuto
    keyGenerator: (req) => req.user?.id || req.ip,
    message: { error: 'Limite de criação excedido. Tente novamente em 1 minuto.' },
    skip: (req) => req.user?.perfil === 'administrador'
});

/**
 * Rate limiter para download (por hora)
 */
const downloadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,   // 1 hora
    max: 100,                    // 100 downloads por hora
    keyGenerator: (req) => req.user?.id || req.ip,
    message: { error: 'Limite de downloads excedido. Tente novamente mais tarde.' }
});

/**
 * Rate limiter para operações de exclusão
 */
const deleteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,   // 1 hora
    max: 5,                      // 5 deletions por hora
    keyGenerator: (req) => req.user?.id || req.ip,
    message: { error: 'Muitas operações de exclusão. Tente novamente em 1 hora.' },
    skip: (req) => req.user?.perfil === 'administrador'
});

/**
 * Rate limiter para relatórios/exports
 */
const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,   // 1 hora
    max: 20,                     // 20 relatórios por hora
    keyGenerator: (req) => req.user?.id || req.ip,
    message: { error: 'Limite de relatórios excedido. Tente novamente em 1 hora.' }
});

module.exports = {
    generalLimiter,
    authLimiter,
    changePasswordLimiter,
    createResourceLimiter,
    downloadLimiter,
    deleteLimiter,
    reportLimiter
};
