/**
 * ✅ Middleware de Validação Estruturada
 * Valida e sanitiza inputs do utilizador
 */

const { body, validationResult } = require('express-validator');
const DOMPurify = require('isomorphic-dompurify');

/**
 * Middleware que executa validações e retorna erros
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validação falhou',
            details: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Sanitizar string: remover HTML e caracteres perigosos
 */
const sanitizeString = (value) => {
    if (!value) return value;
    // Remover HTML completamente
    let clean = DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
    // Remover caracteres especiais perigosos
    clean = clean.replace(/[<>"%']/g, '');
    return clean.trim();
};

/**
 * Validações de Login
 */
const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail()
        .toLowerCase(),
    body('password')
        .notEmpty()
        .withMessage('Password é obrigatória'),
    handleValidationErrors
];

/**
 * Validações de Registo de Utilizador
 */
const validateUserRegister = [
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail()
        .toLowerCase(),
    body('nome')
        .isLength({ min: 3, max: 100 })
        .withMessage('Nome deve ter entre 3 e 100 caracteres')
        .customSanitizer({ value: sanitizeString }),
    body('password')
        .isLength({ min: 12 })
        .withMessage('Password deve ter no mínimo 12 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage('Password deve conter maiúsculas, minúsculas, números e caracteres especiais'),
    body('perfil')
        .isIn(['administrador', 'presidente', 'tesoureiro', 'secretario', 'operador', 'auditor'])
        .withMessage('Perfil inválido'),
    handleValidationErrors
];

/**
 * Validações de Criação de Membro
 */
const validateMembroCreate = [
    body('nome_completo')
        .isLength({ min: 3, max: 150 })
        .withMessage('Nome deve ter entre 3 e 150 caracteres')
        .customSanitizer({ value: sanitizeString }),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail()
        .toLowerCase(),
    body('telefone')
        .optional()
        .matches(/^[0-9+\-\s()]{7,}$/)
        .withMessage('Telefone inválido'),
    body('nif')
        .optional()
        .matches(/^[0-9]{9}$/)
        .withMessage('NIF deve ter 9 dígitos'),
    body('bi_passaporte')
        .optional()
        .isLength({ min: 3, max: 20 })
        .withMessage('BI/Passaporte inválido'),
    body('observacoes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Observações não podem exceder 500 caracteres')
        .customSanitizer({ value: sanitizeString }),
    body('numero_membro')
        .optional()
        .isInt()
        .withMessage('Número de membro deve ser numérico'),
    handleValidationErrors
];

/**
 * Validações de Alteração de Password
 */
const validateChangePassword = [
    body('currentPassword')
        .isLength({ min: 8 })
        .withMessage('Password atual inválida'),
    body('newPassword')
        .isLength({ min: 12 })
        .withMessage('Nova password deve ter no mínimo 12 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage('Nova password deve conter maiúsculas, minúsculas, números e caracteres especiais'),
    body('confirmPassword')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords não correspondem'),
    handleValidationErrors
];

/**
 * Validações de Contacto
 */
const validateContacto = [
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail()
        .toLowerCase(),
    body('assunto')
        .isLength({ min: 5, max: 100 })
        .withMessage('Assunto deve ter entre 5 e 100 caracteres')
        .customSanitizer({ value: sanitizeString }),
    body('mensagem')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Mensagem deve ter entre 10 e 1000 caracteres')
        .customSanitizer({ value: sanitizeString }),
    handleValidationErrors
];

module.exports = {
    validateLogin,
    validateUserRegister,
    validateMembroCreate,
    validateChangePassword,
    validateContacto,
    sanitizeString
};
