/**
 * Utilitário de Notificações Internas
 * Cria notificações no banco de dados para utilizadores do sistema.
 */
const { query } = require('../config/database');

/**
 * Cria uma notificação para um ou mais utilizadores
 * @param {Object} opts
 * @param {number|number[]} opts.utilizador_id - ID ou array de IDs dos destinatários
 * @param {string} opts.titulo - Título curto da notificação
 * @param {string} opts.mensagem - Texto descritivo
 * @param {string} [opts.tipo] - 'info' | 'sucesso' | 'alerta' | 'erro'
 * @param {string} [opts.link] - Rota de navegação ao clicar (ex: '/quotas')
 */
const criarNotificacao = async ({ utilizador_id, titulo, mensagem, tipo = 'info', link = null }) => {
    try {
        const ids = Array.isArray(utilizador_id) ? utilizador_id : [utilizador_id];
        const promises = ids.map(uid =>
            query(
                `INSERT INTO notificacoes (utilizador_id, titulo, mensagem, tipo, link, lida, criado_em)
                 VALUES ($1, $2, $3, $4, $5, false, NOW())`,
                [uid, titulo, mensagem, tipo, link]
            )
        );
        await Promise.all(promises);
    } catch (err) {
        // Não lançar erro — notificações são não-críticas
        console.error('[Notificações] Erro ao criar notificação:', err.message);
    }
};

/**
 * Notifica todos os admins e supervisores do sistema
 * @param {Object} opts - Mesmos campos de criarNotificacao (excepto utilizador_id)
 */
const notificarAdmins = async ({ titulo, mensagem, tipo = 'info', link = null }) => {
    try {
        const result = await query(
            `SELECT id FROM utilizadores WHERE perfil IN ('admin', 'supervisor') AND ativo = true`
        );
        if (result.rows.length === 0) return;
        const ids = result.rows.map(r => r.id);
        await criarNotificacao({ utilizador_id: ids, titulo, mensagem, tipo, link });
    } catch (err) {
        console.error('[Notificações] Erro ao notificar admins:', err.message);
    }
};

module.exports = { criarNotificacao, notificarAdmins };
