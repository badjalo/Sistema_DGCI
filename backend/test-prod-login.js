const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const EMAIL = 'abrao.kabi@dgci.mef.gw';
const PASSWORD = 'sf-dgci123*#';

const prodPool = new Pool({
  connectionString: 'postgresql://badjalo:AK5u3Nmo5A8lgEgcGFIE7HYIp0BMSkDM@dpg-d8t7tue7r5hc73elprh0-a.frankfurt-postgres.render.com/sf_dgci',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await prodPool.connect();
  try {
    const result = await client.query(
      `SELECT u.*, m.nome_completo as membro_nome, m.foto_url as membro_foto
       FROM utilizadores u
       LEFT JOIN membros m ON m.id = u.membro_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [EMAIL.trim()]
    );

    console.log('Result length (PROD):', result.rows.length);
    if (result.rows.length === 0) {
      console.log('❌ Utilizador não encontrado na BD de Produção');
      return;
    }

    const user = result.rows[0];
    console.log('User found (PROD):', {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      ativo: user.ativo,
      deve_mudar_senha: user.deve_mudar_senha
    });

    const validPassword = await bcrypt.compare(PASSWORD, user.password_hash);
    console.log('Is password valid on PROD (bcrypt):', validPassword);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await prodPool.end();
  }
}

run();
