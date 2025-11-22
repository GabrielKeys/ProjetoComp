const { Pool } = require('pg');
require('dotenv').config();

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
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

async function seed() {
  try {
    console.log('🌱 Iniciando seed do banco...');
    
    // Inserir usuário de teste
    const userResult = await pool.query(`
      INSERT INTO users (full_name, email, password_hash, phone, is_google_user)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['Usuário Teste', 'teste@voltway.com', 'hash123', '11999999999', false]);

    let userId = userResult.rows[0]?.id;
    
    if (!userId) {
      // Buscar usuário existente
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', ['teste@voltway.com']);
      userId = existingUser.rows[0].id;
    }

    // Criar carteira para o usuário
    await pool.query(`
      INSERT INTO wallets (user_id, balance)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO NOTHING
    `, [userId, 100.00]);

    // Inserir estações de teste
    await pool.query(`
      INSERT INTO stations (name, address, city, state, latitude, longitude, power_kw, price_per_kwh)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8),
        ($9, $10, $11, $12, $13, $14, $15, $16),
        ($17, $18, $19, $20, $21, $22, $23, $24)
      ON CONFLICT DO NOTHING
    `, [
      'Estação Shopping Iguatemi', 'Av. Brigadeiro Luiz Antonio, 3132', 'São Paulo', 'SP', -23.5505, -46.6333, 150.0, 0.85,
      'Estação Parque Villa-Lobos', 'Av. Prof. Fonseca Rodrigues, 2001', 'São Paulo', 'SP', -23.5444, -46.7289, 120.0, 0.90,
      'Estação Terminal Tietê', 'Av. Cruzeiro do Sul, 1800', 'São Paulo', 'SP', -23.5200, -46.6300, 200.0, 0.80
    ]);

    // Inserir veículo de teste
    await pool.query(`
      INSERT INTO vehicles (user_id, model, year, plate, battery_capacity, charging_power)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `, [userId, 'Tesla Model 3', 2022, 'ABC-1234', 75.0, 11.0]);

    console.log('✅ Seed executado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed().catch(console.error);
}

module.exports = seed;
