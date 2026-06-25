const { Pool } = require('pg');

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
    const res = await client.query("SELECT id, email, LENGTH(email) as len FROM utilizadores WHERE LOWER(email) LIKE '%kabi%'");
    res.rows.forEach(r => {
      console.log(`id: "${r.id}", email: "${r.email}", length: ${r.len}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await localPool.end();
  }
}

run();
