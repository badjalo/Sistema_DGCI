const { Pool } = require('pg');

// ✅ SEGURANÇA: Validar que existe uma forma de autenticação na BD (não usar fallback!)
if (!process.env.DB_PASSWORD && !process.env.DATABASE_URL) {
  throw new Error(
    '🔴 CRÍTICO: DB_PASSWORD ou DATABASE_URL não configurada em .env\n' +
    'Defina as credenciais de acesso em seu ambiente.'
  );
}

const isProduction = process.env.NODE_ENV === 'production';

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'sf_dgci',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
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
