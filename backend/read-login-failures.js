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
  console.log('\n=== RECENT LOGIN FAILURES (LOCAL) ===');
  const clientLocal = await localPool.connect();
  try {
    const res = await clientLocal.query(`
      SELECT criado_em, utilizador_nome, acao, entidade, ip_address 
      FROM auditoria_logs 
      WHERE acao LIKE '%LOGIN%' 
      ORDER BY criado_em DESC 
      LIMIT 10
    `);
    res.rows.forEach(r => {
      console.log(`[${r.criado_em.toISOString()}] Name: ${r.utilizador_nome} | Action: ${r.acao} | Entity: ${r.entidade} | IP: ${r.ip_address}`);
    });
  } catch (err) {
    console.error(err.message);
  } finally {
    clientLocal.release();
  }
  await localPool.end();
  process.exit(0);
}

run();
