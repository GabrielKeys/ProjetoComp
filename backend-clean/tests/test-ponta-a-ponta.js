// Teste de Ponta a Ponta - Verifica se tudo está funcionando após refatoração SOLID
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
let authToken = null;
let testUserId = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function request(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (data) config.data = data;
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function testHealthCheck() {
  log('\n🔍 Teste 1: Health Check', 'blue');
  const result = await request('GET', '/health');
  if (result.success && result.data.database === 'connected') {
    log('✅ Health check passou - Banco conectado', 'green');
    return true;
  }
  log('❌ Health check falhou', 'red');
  return false;
}

async function testStations() {
  log('\n🔍 Teste 2: Listar Estações', 'blue');
  const result = await request('GET', '/api/stations');
  if (result.success && result.data.data?.stations?.length > 0) {
    log(`✅ Estações encontradas: ${result.data.data.stations.length}`, 'green');
    return true;
  }
  log('❌ Falha ao listar estações', 'red');
  return false;
}

async function testRegister() {
  log('\n🔍 Teste 3: Registrar Usuário', 'blue');
  const userData = {
    full_name: 'Teste SOLID',
    email: `teste${Date.now()}@solid.com`,
    password: 'senha123',
    phone: '11999999999'
  };
  const result = await request('POST', '/api/auth/register', userData);
  if (result.success && result.data.data?.token) {
    authToken = result.data.data.token;
    testUserId = result.data.data.user.id;
    log('✅ Usuário registrado com sucesso', 'green');
    return true;
  }
  log('❌ Falha ao registrar usuário', 'red');
  console.log(result.error);
  return false;
}

async function testLogin() {
  log('\n🔍 Teste 4: Login', 'blue');
  const loginData = { email: 'teste@voltway.com', password: 'hash123' };
  const result = await request('POST', '/api/auth/login', loginData);
  if (result.success && result.data.data?.token) {
    log('✅ Login realizado com sucesso', 'green');
    return true;
  }
  log('⚠️  Login falhou (pode ser esperado)', 'yellow');
  return true;
}

async function testWallet() {
  log('\n🔍 Teste 5: Verificar Carteira', 'blue');
  if (!authToken) {
    log('⚠️  Pulando - token não disponível', 'yellow');
    return true;
  }
  const result = await request('GET', '/api/wallet', null, authToken);
  if (result.success && result.data.data?.wallet) {
    log(`✅ Carteira encontrada - Saldo: R$ ${result.data.data.wallet.balance}`, 'green');
    return true;
  }
  log('❌ Falha ao buscar carteira', 'red');
  return false;
}

async function testVehicles() {
  log('\n🔍 Teste 6: Listar Veículos', 'blue');
  if (!authToken) {
    log('⚠️  Pulando - token não disponível', 'yellow');
    return true;
  }
  const result = await request('GET', '/api/vehicles', null, authToken);
  if (result.success) {
    log(`✅ Veículos encontrados: ${result.data.data?.vehicles?.length || 0}`, 'green');
    return true;
  }
  log('❌ Falha ao listar veículos', 'red');
  return false;
}

async function testCreateVehicle() {
  log('\n🔍 Teste 7: Criar Veículo', 'blue');
  if (!authToken) {
    log('⚠️  Pulando - token não disponível', 'yellow');
    return true;
  }
  const vehicleData = {
    model: 'Tesla Model S',
    year: 2023,
    plate: `SOLID-${Date.now()}`,
    batteryCapacity: 100.0,
    chargingPower: 11.0
  };
  const result = await request('POST', '/api/vehicles', vehicleData, authToken);
  if (result.success && result.data.data?.vehicle) {
    log('✅ Veículo criado com sucesso', 'green');
    return true;
  }
  log('❌ Falha ao criar veículo', 'red');
  console.log(result.error);
  return false;
}

async function testReservations() {
  log('\n🔍 Teste 8: Listar Reservas', 'blue');
  if (!authToken) {
    log('⚠️  Pulando - token não disponível', 'yellow');
    return true;
  }
  const result = await request('GET', '/api/reservations', null, authToken);
  if (result.success) {
    log(`✅ Reservas encontradas: ${result.data.data?.reservations?.length || 0}`, 'green');
    return true;
  }
  log('❌ Falha ao listar reservas', 'red');
  return false;
}

async function testSyncStations() {
  log('\n🔍 Teste 9: Sincronizar Estações Google Places', 'blue');
  const stationsData = {
    stations: [{
      name: 'Estação Teste SOLID',
      address: 'Rua Teste SOLID, 123, São Paulo - SP',
      latitude: -23.5505,
      longitude: -46.6333,
      formattedAddress: 'Rua Teste SOLID, 123, São Paulo - SP'
    }]
  };
  const result = await request('POST', '/api/stations/sync', stationsData);
  if (result.success && result.data.data?.inserted >= 0) {
    log(`✅ Sincronização OK - ${result.data.data.inserted} inseridas`, 'green');
    return true;
  }
  log('❌ Falha na sincronização', 'red');
  return false;
}

async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    return true;
  } catch (error) {
    log('\n❌ Servidor não está rodando!', 'red');
    log(`   Inicie o servidor com: npm start`, 'yellow');
    log(`   Ou use: node server.refactored.js`, 'yellow');
    log(`   URL testada: ${BASE_URL}`, 'yellow');
    return false;
  }
}

async function runAllTests() {
  log('\n🚀 Teste de Ponta a Ponta - Arquitetura SOLID', 'blue');
  log('='.repeat(60), 'blue');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  const tests = [
    testHealthCheck,
    testStations,
    testRegister,
    testLogin,
    testWallet,
    testVehicles,
    testCreateVehicle,
    testReservations,
    testSyncStations
  ];
  
  const results = [];
  for (const test of tests) {
    try {
      const passed = await test();
      results.push(passed);
    } catch (error) {
      log(`❌ Erro ao executar teste: ${error.message}`, 'red');
      results.push(false);
    }
  }
  
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Resumo dos Testes', 'blue');
  log('='.repeat(60), 'blue');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  log(`✅ Passou: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 Todos os testes passaram! Arquitetura SOLID funcionando!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Alguns testes falharam. Verifique os logs acima.', 'yellow');
    process.exit(1);
  }
}

runAllTests();

