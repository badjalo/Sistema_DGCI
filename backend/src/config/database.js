const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'sf_dgci',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'sf_dgci_2026',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔗 PostgreSQL conectado');
  }
});

pool.on('error', (err) => {
  console.error('❌ Erro na pool PostgreSQL:', err.message);
});

/**
 * Query helper com suporte a transações
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.log(`[DB] Query lenta (${duration}ms):`, text.substring(0, 80));
    }
    return res;
  } catch (err) {
    console.error('[DB] Erro na query:', err.message);
    throw err;
  }
};

const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
