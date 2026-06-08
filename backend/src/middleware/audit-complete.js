/**
 * ✅ Middleware de Auditoria Completa
 * Registra TODAS as ações (sucesso e erro)
 */

const { query } = require('../config/database');

/**
 * Middleware de auditoria que registra todas as requisições
 */
const auditMiddleware = async (req, res, next) => {
    try {
        // Interceptar response para registar status e resultado
        const originalJson = res.json;
        const originalSend = res.send;

        let responseData = '';
        let statusCode = res.statusCode;

        res.json = function (data) {
            responseData = JSON.stringify(data);
            return originalJson.call(this, data);
        };

        res.send = function (data) {
            responseData = typeof data === 'string' ? data : JSON.stringify(data);
            return originalSend.call(this, data);
        };

        // Depois que response termina, registar auditoria
        res.on('finish', async () => {
            try {
                const statusCode = res.statusCode;
                const shouldAudit =
                    req.method !== 'GET' ||  // Registar todas as mutações
                    req.path.includes('/auth/') ||  // Registar autenticação
                    statusCode >= 400;  // Registar erros

                if (!shouldAudit) return;

                // Extrair informações do request
                const acao = `${req.method} ${req.path}`;
                const entidade = req.path.split('/')[2] || 'app';

                // Detalhes seguros (remover dados sensíveis)
                const detalhes = {
                    method: req.method,
                    path: req.path,
                    statusCode,
                    params: req.params,
                    queryParams: Object.keys(req.query).length > 0 ? Object.keys(req.query) : undefined,
                    // NÃO registar body (pode ter passwords)
                    error: statusCode >= 400 ? responseData.substring(0, 200) : undefined
                };

                // Registar na BD
                await query(
                    `INSERT INTO auditoria_logs 
           (utilizador_id, utilizador_nome, acao, entidade, dados_depois, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        req.user?.id || null,
                        req.user?.nome || 'anonymous',
                        acao,
                        entidade,
                        JSON.stringify(detalhes),
                        req.ip,
                        req.get('user-agent') || 'unknown'
                    ]
                );
            } catch (err) {
                console.error('[Auditoria] Erro ao registar:', err.message);
                // Não falhar a requisição se auditoria falhar
            }
        });

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = { auditMiddleware };
