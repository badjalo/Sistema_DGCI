require('dotenv').config();
const { query } = require('./src/config/database');

async function run() {
  console.log('🔄 Iniciando migração do banco de dados com dotenv carregado...');
  try {
    // Adicionar coluna limite_quadros se não existir
    await query(`
      ALTER TABLE departamentos 
      ADD COLUMN IF NOT EXISTS limite_quadros INTEGER DEFAULT 0;
    `);
    console.log('✅ Coluna "limite_quadros" adicionada/verificada na tabela "departamentos" com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro durante a migração:', err);
    process.exit(1);
  }
}

run();
