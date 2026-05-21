#!/usr/bin/env node
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const resetAdmin = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Resetando credenciais do admin...\n');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sf-dgci.gw';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2026!';
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔐 Senha: ${adminPassword}`);
    console.log(`✅ Hash gerado com sucesso\n`);
    
    // Verificar se admin existe
    const checkResult = await client.query(
      'SELECT id, nome, email FROM utilizadores WHERE email = $1',
      [adminEmail]
    );
    
    if (checkResult.rows.length > 0) {
      // Update existente
      const adminId = checkResult.rows[0].id;
      await client.query(
        `UPDATE utilizadores 
         SET password_hash = $1, ativo = true, atualizado_em = NOW()
         WHERE id = $2`,
        [hashedPassword, adminId]
      );
      console.log(`✅ Admin atualizado com sucesso!\n`);
      console.log(`   ID: ${adminId}`);
      console.log(`   Nome: ${checkResult.rows[0].nome}`);
      console.log(`   Email: ${checkResult.rows[0].email}`);
    } else {
      // Criar novo admin
      const result = await client.query(
        `INSERT INTO utilizadores (nome, email, password_hash, perfil, ativo)
         VALUES ('Administrador', $1, $2, 'administrador', true)
         RETURNING id, nome, email, perfil`,
        [adminEmail, hashedPassword]
      );
      
      const newAdmin = result.rows[0];
      console.log(`✅ Admin criado com sucesso!\n`);
      console.log(`   ID: ${newAdmin.id}`);
      console.log(`   Nome: ${newAdmin.nome}`);
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Perfil: ${newAdmin.perfil}`);
    }
    
    console.log('\n✅ Credenciais atualizadas!\n');
    console.log('Você já pode fazer login com:');
    console.log(`   📧 Email: ${adminEmail}`);
    console.log(`   🔐 Password: ${adminPassword}\n`);
    
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
};

resetAdmin();
