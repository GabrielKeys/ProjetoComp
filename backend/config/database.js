// ============================================
// VoltWay - Configuração do Banco de Dados
// ============================================

require('dotenv').config();
const { Pool } = require('pg');

// Configuração da conexão com PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'voltway_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'voltway',
  password: process.env.DB_PASSWORD || 'sua_senha',
  port: process.env.DB_PORT || 5432,
  
  // Configurações de conexão
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000, // Tempo limite para conexões ociosas
  connectionTimeoutMillis: 2000, // Tempo limite para estabelecer conexão
});

// Evento de conexão bem-sucedida
pool.on('connect', () => {
  console.log('✅ Conectado ao banco de dados PostgreSQL');
});

// Evento de erro na conexão
pool.on('error', (err) => {
  console.error('❌ Erro na conexão com o banco de dados:', err);
  process.exit(-1);
});

// Função para testar a conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('🔍 Teste de conexão realizado:', result.rows[0].current_time);
    console.log('📊 Versão do PostgreSQL:', result.rows[0].postgres_version.split(' ')[0]);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Falha no teste de conexão:', err.message);
    return false;
  }
};

// Função para executar queries com tratamento de erro
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📝 Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('❌ Erro na query:', { text, error: err.message });
    throw err;
  }
};

// Função para executar transações
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Função para verificar se as tabelas existem
const checkTables = async () => {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const tables = result.rows.map(row => row.table_name);
    const expectedTables = ['usuarios', 'veiculos', 'estacoes', 'reservas'];
    const missingTables = expectedTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      console.warn('⚠️  Tabelas não encontradas:', missingTables);
      console.log('💡 Execute o script schema.sql para criar as tabelas');
      return false;
    } else {
      console.log('✅ Todas as tabelas estão presentes:', tables);
      return true;
    }
  } catch (err) {
    console.error('❌ Erro ao verificar tabelas:', err.message);
    return false;
  }
};

// Função para obter estatísticas do banco
const getStats = async () => {
  try {
    const stats = await query(`
      SELECT 
        'usuarios' as tabela, COUNT(*) as registros FROM usuarios
      UNION ALL
      SELECT 
        'veiculos' as tabela, COUNT(*) as registros FROM veiculos
      UNION ALL
      SELECT 
        'estacoes' as tabela, COUNT(*) as registros FROM estacoes
      UNION ALL
      SELECT 
        'reservas' as tabela, COUNT(*) as registros FROM reservas
      ORDER BY tabela;
    `);
    
    console.log('📊 Estatísticas do banco:');
    stats.rows.forEach(row => {
      console.log(`   ${row.tabela}: ${row.registros} registros`);
    });
    
    return stats.rows;
  } catch (err) {
    console.error('❌ Erro ao obter estatísticas:', err.message);
    return [];
  }
};

// Função para fechar todas as conexões
const closePool = async () => {
  try {
    await pool.end();
    console.log('🔌 Pool de conexões fechado');
  } catch (err) {
    console.error('❌ Erro ao fechar pool:', err.message);
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  checkTables,
  getStats,
  closePool
};