require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getClient } = require('../config/database');

async function run() {
  console.log('🔄 Iniciando migração do banco de dados (schema.sql)...');
  
  const schemaPath = path.join(__dirname, '../../../database/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Erro: Arquivo de schema não encontrado em: ${schemaPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = await getClient();

  try {
    console.log('⏳ Executando schema no banco de dados...');
    await client.query('BEGIN');
    await client.query(sql);
    
    // Executar migrações adicionais se necessário
    console.log('⏳ Executando migrações adicionais...');
    await client.query(`
      ALTER TABLE departamentos 
      ADD COLUMN IF NOT EXISTS limite_quadros INTEGER DEFAULT 0;
    `);

    await client.query('COMMIT');
    console.log('✅ Migração concluída com sucesso!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.log('❌ Erro durante a execução da migração:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

run();
