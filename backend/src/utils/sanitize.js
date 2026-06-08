/**
 * ✅ Utilidades de Sanitização de Inputs
 * Para remover XSS e injeção de SQL em controllers
 */

const DOMPurify = require('isomorphic-dompurify');

/**
 * Sanitizar string: remover HTML e caracteres perigosos
 */
const sanitizeString = (value, allowHtml = false) => {
    if (!value || typeof value !== 'string') return value;

    const options = allowHtml
        ? { ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'br', 'p'] }
        : { ALLOWED_TAGS: [] };

    let clean = DOMPurify.sanitize(value, options);
    clean = clean.trim();

    return clean;
};

/**
 * Sanitizar número
 */
const sanitizeNumber = (value) => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
};

/**
 * Sanitizar email
 */
const sanitizeEmail = (value) => {
    if (!value) return null;
    const email = String(value).toLowerCase().trim();
    // Validação básica
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return email;
};

/**
 * Sanitizar data
 */
const sanitizeDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date;
};

/**
 * Sanitizar booleano
 */
const sanitizeBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return false;
};

/**
 * Sanitizar um objeto inteiro
 */
const sanitizeObject = (obj, schema) => {
    if (!obj || typeof obj !== 'object') return {};

    const sanitized = {};

    for (const [key, rules] of Object.entries(schema || {})) {
        let value = obj[key];

        if (value === undefined || value === null) {
            if (rules.required) throw new Error(`Campo ${key} é obrigatório`);
            sanitized[key] = null;
            continue;
        }

        // Aplicar sanitização baseada em tipo
        switch (rules.type) {
            case 'string':
                sanitized[key] = sanitizeString(value, rules.allowHtml);
                if (rules.maxLength && sanitized[key]?.length > rules.maxLength) {
                    throw new Error(`${key} excede comprimento máximo de ${rules.maxLength}`);
                }
                if (rules.minLength && sanitized[key]?.length < rules.minLength) {
                    throw new Error(`${key} deve ter no mínimo ${rules.minLength} caracteres`);
                }
                break;

            case 'email':
                sanitized[key] = sanitizeEmail(value);
                if (!sanitized[key]) throw new Error(`${key} é um email inválido`);
                break;

            case 'number':
                sanitized[key] = sanitizeNumber(value);
                if (sanitized[key] === null) throw new Error(`${key} deve ser numérico`);
                break;

            case 'date':
                sanitized[key] = sanitizeDate(value);
                if (!sanitized[key]) throw new Error(`${key} é uma data inválida`);
                break;

            case 'boolean':
                sanitized[key] = sanitizeBoolean(value);
                break;

            case 'enum':
                if (!rules.values.includes(value)) {
                    throw new Error(`${key} deve ser um de: ${rules.values.join(', ')}`);
                }
                sanitized[key] = value;
                break;

            default:
                sanitized[key] = value;
        }
    }

    return sanitized;
};

module.exports = {
    sanitizeString,
    sanitizeNumber,
    sanitizeEmail,
    sanitizeDate,
    sanitizeBoolean,
    sanitizeObject
};
