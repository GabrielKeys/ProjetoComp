const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexões
// Render e outros serviços cloud requerem SSL para conexões externas
const requiresSSL = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('render.com') ||
  process.env.DATABASE_URL.includes('railway.app') ||
  process.env.DATABASE_URL.includes('supabase.co') ||
  process.env.NODE_ENV === 'production'
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  min: parseInt(process.env.DB_MIN_CONNECTIONS) || 2,
});

// Testar conexão ao iniciar
pool.on('connect', () => {
  console.log('✅ Conectado ao banco de dados PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

// Função helper para executar queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG === 'true') {
      console.log('📊 Query executada:', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('❌ Erro na query:', error);
    throw error;
  }
}

// Função para testar conexão
async function testConnection() {
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ Conexão com banco de dados testada com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  query,
  testConnection,
};

