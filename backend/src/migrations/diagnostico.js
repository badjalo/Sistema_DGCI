require('dotenv').config();
const { query } = require('../config/database');

async function diagnostico() {
  console.log('\n=== DIAGNÓSTICO: Membros e Utilizadores ===\n');

  // 1. Total de membros
  const totalMembros = await query("SELECT COUNT(*) as total FROM membros WHERE estado IN ('ativo', 'suspenso')");
  console.log(`📊 Total membros ativos/suspensos: ${totalMembros.rows[0].total}`);

  // 2. Membros COM email
  const comEmail = await query("SELECT COUNT(*) as total FROM membros WHERE email IS NOT NULL AND email != '' AND estado IN ('ativo', 'suspenso')");
  console.log(`📧 Membros com email: ${comEmail.rows[0].total}`);

  // 3. Membros SEM email
  const semEmail = await query("SELECT COUNT(*) as total FROM membros WHERE (email IS NULL OR email = '') AND estado IN ('ativo', 'suspenso')");
  console.log(`❌ Membros sem email: ${semEmail.rows[0].total}`);

  // 4. Membros com email MAS sem utilizador
  const semUtilizador = await query(`
    SELECT COUNT(*) as total FROM membros m
    WHERE m.email IS NOT NULL AND m.email != ''
      AND m.estado IN ('ativo', 'suspenso')
      AND NOT EXISTS (SELECT 1 FROM utilizadores u WHERE u.email = m.email)
  `);
  console.log(`👤 Membros com email mas SEM utilizador: ${semUtilizador.rows[0].total}`);

  // 5. Membros com email E utilizador JÁ existente
  const comUtilizador = await query(`
    SELECT COUNT(*) as total FROM membros m
    WHERE m.email IS NOT NULL AND m.email != ''
      AND m.estado IN ('ativo', 'suspenso')
      AND EXISTS (SELECT 1 FROM utilizadores u WHERE u.email = m.email)
  `);
  console.log(`✅ Membros com email E utilizador já criado: ${comUtilizador.rows[0].total}`);

  // 6. Lista de utilizadores por perfil
  const porPerfil = await query("SELECT perfil, COUNT(*) as total FROM utilizadores GROUP BY perfil ORDER BY perfil");
  console.log('\n📋 Utilizadores por perfil:');
  porPerfil.rows.forEach(r => console.log(`   ${r.perfil}: ${r.total}`));

  // 7. Membros SEM email - lista resumida
  console.log('\n📋 Lista de membros SEM email (precisam de email para ter acesso):');
  const semEmailList = await query(`
    SELECT m.numero_membro, m.nome_completo, m.estado FROM membros m
    WHERE (m.email IS NULL OR m.email = '') AND m.estado IN ('ativo', 'suspenso')
    ORDER BY m.nome_completo LIMIT 30
  `);
  semEmailList.rows.forEach(r => console.log(`   [${r.numero_membro}] ${r.nome_completo} (${r.estado})`));
  
  if (semEmailList.rows.length === 30) {
    console.log('   ... (e mais)');
  }

  // 8. Membros com utilizador mas perfil diferente de 'membro'
  const outrosPerfis = await query(`
    SELECT u.email, u.perfil, m.nome_completo FROM utilizadores u
    JOIN membros m ON m.id = u.membro_id
    WHERE u.perfil != 'membro'
    ORDER BY u.perfil
    LIMIT 30
  `);
  if (outrosPerfis.rows.length > 0) {
    console.log('\n⚠️ Utilizadores LIGADOS a membros mas com perfil != membro:');
    outrosPerfis.rows.forEach(r => console.log(`   ${r.email} (${r.perfil}) → ${r.nome_completo}`));
  }

  process.exit(0);
}

diagnostico().catch(err => {
  console.error(err);
  process.exit(1);
});
