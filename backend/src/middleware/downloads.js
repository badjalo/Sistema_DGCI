/**
 * ✅ Middleware de Download Seguro com Proteção contra Path Traversal
 */

const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');

/**
 * Middleware para servir downloads seguros
 * Valida permissões e protege contra path traversal
 */
const secureDownload = (uploadsBasePath) => {
    return async (req, res, next) => {
        try {
            const { fileId, filename } = req.params;

            // 1. Validar que utilizador está autenticado
            if (!req.user) {
                return res.status(401).json({ error: 'Não autenticado' });
            }

            // 2. Buscar informações do ficheiro na BD
            const result = await query(
                `SELECT id, ficheiro_path, carregado_por, tipo, tamanho 
         FROM uploads WHERE id = $1 OR ficheiro_nome = $2`,
                [fileId, filename]
            );

            if (!result.rows.length) {
                return res.status(404).json({ error: 'Ficheiro não encontrado' });
            }

            const fileRecord = result.rows[0];

            // 3. Validar permissões
            // Utilizador só pode descarregar seus próprios ficheiros ou se for admin
            if (fileRecord.carregado_por !== req.user.id && req.user.perfil !== 'administrador') {
                return res.status(403).json({ error: 'Acesso negado a este ficheiro' });
            }

            // 4. Construir caminho seguro e validar path traversal
            let filePath = path.join(uploadsBasePath, fileRecord.ficheiro_path);

            // Normalizar e verificar que está dentro de uploadsBasePath
            const normalizedPath = path.normalize(filePath);
            const normalizedBase = path.normalize(uploadsBasePath);

            if (!normalizedPath.startsWith(normalizedBase)) {
                return res.status(400).json({ error: 'Caminho de ficheiro inválido' });
            }

            // 5. Verificar que o ficheiro existe
            if (!fs.existsSync(normalizedPath)) {
                return res.status(404).json({ error: 'Ficheiro não encontrado no sistema' });
            }

            // 6. Registar auditoria do download
            await query(
                `INSERT INTO auditoria_logs (utilizador_id, utilizador_nome, acao, entidade, detalhes, ip_address)
         VALUES ($1, $2, 'DOWNLOAD_FICHEIRO', 'uploads', $3, $4)`,
                [req.user.id, req.user.nome, JSON.stringify({ fileId, filename: fileRecord.ficheiro_nome }), req.ip]
            );

            // 7. Servir ficheiro de forma segura
            res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.ficheiro_nome}"`);
            res.setHeader('Content-Type', fileRecord.tipo || 'application/octet-stream');
            res.setHeader('Content-Length', fileRecord.tamanho);

            // Não servir via express.static - usar stream seguro
            const stream = fs.createReadStream(normalizedPath);
            stream.on('error', (err) => {
                console.error('Erro ao servir ficheiro:', err);
                res.status(500).json({ error: 'Erro ao descarregar ficheiro' });
            });

            stream.pipe(res);
        } catch (err) {
            next(err);
        }
    };
};

/**
 * Middleware para servir uploads publicamente (apenas imagens)
 * Com proteção contra path traversal
 */
const servePublicUpload = (uploadsBasePath) => {
    return async (req, res, next) => {
        try {
            const { subdir, filename } = req.params;

            // Apenas permitir servir imagens de certas subpastas
            const allowedSubdirs = ['fotos', 'assinaturas', 'assets'];
            if (!allowedSubdirs.includes(subdir)) {
                return res.status(403).json({ error: 'Tipo de ficheiro não permitido' });
            }

            // Construir caminho seguro
            let filePath = path.join(uploadsBasePath, subdir, filename);

            // Validar path traversal
            const normalizedPath = path.normalize(filePath);
            const normalizedBase = path.normalize(uploadsBasePath);

            if (!normalizedPath.startsWith(normalizedBase)) {
                return res.status(400).json({ error: 'Caminho inválido' });
            }

            // Verificar que é imagem
            const ext = path.extname(filename).toLowerCase();
            const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
            if (!allowedExts.includes(ext)) {
                return res.status(403).json({ error: 'Apenas imagens são permitidas' });
            }

            // Servir ficheiro
            if (!fs.existsSync(normalizedPath)) {
                return res.status(404).json({ error: 'Imagem não encontrada' });
            }

            res.sendFile(normalizedPath);
        } catch (err) {
            next(err);
        }
    };
};

module.exports = {
    secureDownload,
    servePublicUpload
};
