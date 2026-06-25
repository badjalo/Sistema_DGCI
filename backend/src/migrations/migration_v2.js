require('dotenv').config();
const { getClient } = require('../config/database');

async function run() {
  console.log('🔄 Iniciando migração v2...');
  const client = await getClient();
  try {
    // 1. Alterar ENUM perfil_utilizador fora de transação
    console.log('⏳ Alterando tipo ENUM perfil_utilizador...');
    const enumCheck = await client.query(`
      SELECT exists (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'perfil_utilizador' AND e.enumlabel = 'membro'
      );
    `);
    
    if (!enumCheck.rows[0].exists) {
      await client.query("ALTER TYPE perfil_utilizador ADD VALUE 'membro';");
      console.log("✅ Valor 'membro' adicionado ao ENUM perfil_utilizador.");
    } else {
      console.log("ℹ️ Valor 'membro' já existe no ENUM.");
    }

    // 2. Criar tabelas da votação em uma transação
    console.log('⏳ Criando tabelas de votação...');
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS votacoes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          titulo VARCHAR(300) NOT NULL,
          descricao TEXT,
          data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
          data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
          ativa BOOLEAN DEFAULT true,
          criado_por UUID REFERENCES utilizadores(id) ON DELETE SET NULL,
          criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS opcoes_voto (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          votacao_id UUID NOT NULL REFERENCES votacoes(id) ON DELETE CASCADE,
          descricao VARCHAR(255) NOT NULL,
          votos_count INTEGER DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS votos_registados (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          votacao_id UUID NOT NULL REFERENCES votacoes(id) ON DELETE CASCADE,
          utilizador_id UUID NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
          opcao_id UUID NOT NULL REFERENCES opcoes_voto(id) ON DELETE CASCADE,
          criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(votacao_id, utilizador_id)
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Tabelas de votação criadas com sucesso!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Erro na migração v2:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

run();
