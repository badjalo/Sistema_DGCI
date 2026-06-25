require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getClient } = require('../config/database');

const DEFAULT_PASSWORD = 'sf-dgci123*#';

async function run() {
  console.log('🔄 Iniciando migração v3...');
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Adicionar coluna deve_mudar_senha se não existir
    console.log('⏳ Adicionando coluna deve_mudar_senha...');
    await client.query(`
      ALTER TABLE utilizadores 
      ADD COLUMN IF NOT EXISTS deve_mudar_senha BOOLEAN DEFAULT false;
    `);
    console.log('✅ Coluna deve_mudar_senha adicionada.');

    // 2. Buscar todos os membros que têm email e ainda não têm utilizador associado
    console.log('⏳ Buscando membros sem conta de acesso...');
    const membrosRes = await client.query(`
      SELECT m.id, m.nome_completo, m.email
      FROM membros m
      WHERE m.email IS NOT NULL
        AND m.email != ''
        AND NOT EXISTS (
          SELECT 1 FROM utilizadores u WHERE u.email = m.email
        )
        AND m.estado IN ('ativo', 'suspenso')
      ORDER BY m.nome_completo
    `);

    console.log(`📋 Encontrados ${membrosRes.rows.length} membros sem conta de acesso.`);

    if (membrosRes.rows.length === 0) {
      console.log('ℹ️ Todos os membros com email já possuem conta de acesso.');
      await client.query('COMMIT');
      process.exit(0);
    }

    // 3. Gerar hash da senha padrão (só uma vez para reutilizar)
    console.log(`⏳ Gerando hash da senha padrão...`);
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // 4. Criar utilizador para cada membro
    let criados = 0;
    let erros = 0;
    for (const membro of membrosRes.rows) {
      try {
        // Pegar primeiro nome + último nome como nome do utilizador
        const nomeParts = membro.nome_completo.trim().split(' ');
        const nome = nomeParts.length > 1
          ? `${nomeParts[0]} ${nomeParts[nomeParts.length - 1]}`
          : nomeParts[0];

        await client.query(`
          INSERT INTO utilizadores (nome, email, password_hash, perfil, membro_id, ativo, deve_mudar_senha)
          VALUES ($1, $2, $3, 'membro', $4, true, true)
          ON CONFLICT (email) DO NOTHING
        `, [nome, membro.email.toLowerCase().trim(), passwordHash, membro.id]);

        criados++;
        console.log(`  ✅ Conta criada: ${nome} (${membro.email})`);
      } catch (err) {
        erros++;
        console.warn(`  ⚠️ Erro ao criar conta para ${membro.nome_completo}: ${err.message}`);
      }
    }

    await client.query('COMMIT');
    console.log('');
    console.log(`✅ Migração v3 concluída!`);
    console.log(`   📊 Contas criadas: ${criados}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   🔑 Senha padrão: ${DEFAULT_PASSWORD}`);
    console.log(`   ⚠️  Todos os membros serão forçados a mudar a senha no primeiro login.`);

    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Erro na migração v3:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

run();
