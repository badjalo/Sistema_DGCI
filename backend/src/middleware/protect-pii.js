/**
 * ✅ Middleware de Proteção de Dados Sensíveis (PII)
 * Remove dados pessoais de respostas baseado no perfil do utilizador
 */

/**
 * Middleware que filtra dados sensíveis de respostas
 */
const protectSensitiveData = (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
        // Filtrar dados sensíveis antes de enviar
        data = sanitizeResponse(data, req.user);
        return originalJson.call(this, data);
    };

    next();
};

/**
 * Remover dados sensíveis de um objeto baseado em permissões
 */
const sanitizeResponse = (data, user) => {
    if (!data) return data;

    // Campos considerados PII (Personally Identifiable Information)
    const sensitiveFields = {
        password_hash: true,
        nif: true,               // Número de Identificação Fiscal
        bi_passaporte: true,     // BI/Passaporte
        email: true,             // Email é PII
        telefone: true,          // Telefone é PII
        numero_cc: true,
        salario: true,
        historico_bancario: true,
        preferencias: true,      // Pode conter dados sensíveis
        endereco: true,
        data_nascimento: true,
        genero: true
    };

    // Admin pode ver tudo
    if (user?.perfil === 'administrador') {
        return data;
    }

    // Se for array
    if (Array.isArray(data)) {
        return data.map(item => {
            if (typeof item === 'object' && item !== null) {
                return removeSensitiveFields(item, sensitiveFields, user);
            }
            return item;
        });
    }

    // Se for objeto com "data" (padrão de resposta da API)
    if (data.data && typeof data.data === 'object') {
        return {
            ...data,
            data: Array.isArray(data.data)
                ? data.data.map(item => removeSensitiveFields(item, sensitiveFields, user))
                : removeSensitiveFields(data.data, sensitiveFields, user)
        };
    }

    // Se for objeto direto
    if (typeof data === 'object' && data !== null) {
        return removeSensitiveFields(data, sensitiveFields, user);
    }

    return data;
};

/**
 * Remove campos sensíveis de um objeto
 */
const removeSensitiveFields = (obj, sensitiveFields, user) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    const clean = {};

    for (const [key, value] of Object.entries(obj)) {
        // Remover campos sensíveis
        if (sensitiveFields[key]) {
            // Excepção: o utilizador pode ver seu próprio email
            if (key === 'email' && user?.id === obj.id) {
                clean[key] = value;
            } else if (key === 'telefone' && user?.id === obj.id) {
                clean[key] = value;
            }
            continue;
        }

        // Limpar recursivamente objetos aninhados
        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                clean[key] = value.map(item =>
                    typeof item === 'object' ? removeSensitiveFields(item, sensitiveFields, user) : item
                );
            } else {
                clean[key] = removeSensitiveFields(value, sensitiveFields, user);
            }
        } else {
            clean[key] = value;
        }
    }

    return clean;
};

module.exports = {
    protectSensitiveData,
    sanitizeResponse
};
