// Script para testar conexão com banco de dados
require('dotenv').config();
const { testConnection } = require('./db');

async function test() {
  console.log('🔍 Testando conexão com banco de dados...');
  console.log('📍 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurado ✅' : 'Não configurado ❌');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não está configurado no .env');
    process.exit(1);
  }

  const connected = await testConnection();
  
  if (connected) {
    console.log('✅ Conexão com banco de dados estabelecida com sucesso!');
    process.exit(0);
  } else {
    console.error('❌ Falha ao conectar com banco de dados');
    process.exit(1);
  }
}

test();

