const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const EMAIL = 'abrao.kabi@dgci.mef.gw';
const PASSWORD = 'sf-dgci123*#';

const localPool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'sistema_gestao',
  user: 'badjalo',
  password: 'Badjalo25',
  ssl: false,
});

async function run() {
  const client = await localPool.connect();
  try {
    // 1. Simular query do login
    const result = await client.query(
      `SELECT u.*, m.nome_completo as membro_nome, m.foto_url as membro_foto
       FROM utilizadores u
       LEFT JOIN membros m ON m.id = u.membro_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [EMAIL.trim()]
    );

    console.log('Result length:', result.rows.length);
    if (result.rows.length === 0) {
      console.log('❌ Utilizador não encontrado na BD local');
      return;
    }

    const user = result.rows[0];
    console.log('User found:', {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      ativo: user.ativo,
      deve_mudar_senha: user.deve_mudar_senha
    });

    const validPassword = await bcrypt.compare(PASSWORD, user.password_hash);
    console.log('Is password valid (bcrypt):', validPassword);

    // Testar com o outro hash
    const testHash = await bcrypt.hash(PASSWORD, 12);
    console.log('Test hash comparison with generated hash:', await bcrypt.compare(PASSWORD, testHash));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await localPool.end();
  }
}

run();
