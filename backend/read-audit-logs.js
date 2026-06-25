const { Pool } = require('pg');

const localPool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'sistema_gestao',
  user: 'badjalo',
  password: 'Badjalo25',
  ssl: false,
});

const prodPool = new Pool({
  connectionString: 'postgresql://badjalo:AK5u3Nmo5A8lgEgcGFIE7HYIp0BMSkDM@dpg-d8t7tue7r5hc73elprh0-a.frankfurt-postgres.render.com/sf_dgci',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log('\n=== RECENT AUDIT LOGS (LOCAL) ===');
  const clientLocal = await localPool.connect();
  try {
    const res = await clientLocal.query('SELECT criado_em, utilizador_nome, acao, entidade, ip_address FROM auditoria_logs ORDER BY criado_em DESC LIMIT 10');
    res.rows.forEach(r => {
      console.log(`[${r.criado_em.toISOString()}] ${r.utilizador_nome} - ${r.acao} (${r.entidade}) : IP: ${r.ip_address}`);
    });
  } catch (err) {
    console.error(err.message);
  } finally {
    clientLocal.release();
  }

  console.log('\n=== RECENT AUDIT LOGS (PROD) ===');
  const clientProd = await prodPool.connect();
  try {
    const res = await clientProd.query('SELECT criado_em, utilizador_nome, acao, entidade, ip_address FROM auditoria_logs ORDER BY criado_em DESC LIMIT 10');
    res.rows.forEach(r => {
      console.log(`[${r.criado_em.toISOString()}] ${r.utilizador_nome} - ${r.acao} (${r.entidade}) : IP: ${r.ip_address}`);
    });
  } catch (err) {
    console.error(err.message);
  } finally {
    clientProd.release();
  }

  await localPool.end();
  await prodPool.end();
  process.exit(0);
}

run();
