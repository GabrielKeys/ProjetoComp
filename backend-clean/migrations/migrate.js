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

async function migrate() {
  try {
    console.log('🔄 Iniciando migrações...');
    
    // Criar tabelas básicas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        phone VARCHAR(20),
        photo_url TEXT,
        google_id VARCHAR(255) UNIQUE,
        is_google_user BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(2) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        power_kw DECIMAL(5, 2) NOT NULL,
        price_per_kwh DECIMAL(5, 2) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        model VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        plate VARCHAR(10) NOT NULL,
        battery_capacity DECIMAL(5, 2) NOT NULL,
        charging_power DECIMAL(5, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
        reservation_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        total_cost DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Migrações executadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro nas migrações:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = migrate;
