require('dotenv').config();
const { query, pool } = require('./src/config/database');

async function main() {
    try {
        const fotoResult = await query(
            `UPDATE membros
       SET foto_url = regexp_replace(foto_url, '^/public/uploads/', '/uploads/')
       WHERE foto_url LIKE '/public/uploads/%'`
        );

        const assinaturaResult = await query(
            `UPDATE membros
       SET assinatura_url = regexp_replace(assinatura_url, '^/public/uploads/', '/uploads/')
       WHERE assinatura_url LIKE '/public/uploads/%'`
        );

        console.log('foto_url records updated:', fotoResult.rowCount);
        console.log('assinatura_url records updated:', assinaturaResult.rowCount);
    } catch (err) {
        console.error('Update failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
