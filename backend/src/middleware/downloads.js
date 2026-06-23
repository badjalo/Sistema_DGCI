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
 * Middleware para servir uploads publicamente (imagens + documentos)
 * Com proteção contra path traversal
 */
const servePublicUpload = (uploadsBasePath) => {
    return async (req, res, next) => {
        try {
            const { subdir, filename } = req.params;

            // Apenas permitir servir ficheiros de certas subpastas
            const allowedSubdirs = ['fotos', 'assinaturas', 'assets', 'slider', 'documentos', 'obituario'];
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

            // Verificar extensão permitida
            const ext = path.extname(filename).toLowerCase();

            // Tipos permitidos por subpasta
            const allowedExtsBySubdir = {
                fotos: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
                assinaturas: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
                assets: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.css', '.js', '.json'],
                slider: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
                obituario: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
                documentos: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt', '.ods']
            };

            const allowedExts = allowedExtsBySubdir[subdir] || [];
            if (!allowedExts.includes(ext)) {
                return res.status(403).json({ error: 'Tipo de ficheiro não permitido' });
            }

            // Servir ficheiro
            if (!fs.existsSync(normalizedPath)) {
                return res.status(404).json({ error: 'Ficheiro não encontrado' });
            }

            // Definir content-type apropriado
            const mimeTypes = {
                '.pdf': 'application/pdf',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.xls': 'application/vnd.ms-excel',
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '.ppt': 'application/vnd.ms-powerpoint',
                '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                '.txt': 'text/plain',
                '.rtf': 'application/rtf',
                '.odt': 'application/vnd.oasis.opendocument.text',
                '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml'
            };

            const contentType = mimeTypes[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);

            // ✅ CORS para html2canvas e outros clientes
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

            // Imagens e documentos visíveis inline; outros como download
            const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
            if (imageExts.includes(ext) || ext === '.pdf') {
                res.setHeader('Content-Disposition', 'inline');
            } else {
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
