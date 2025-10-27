// Teste automático do deploy
const https = require('https');
const http = require('http');

console.log('🧪 VoltWay - Teste de Deploy Automático');
console.log('=====================================');

// Função para testar endpoint
function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ ${description}: ${json.message || 'OK'}`);
          resolve(true);
        } catch (e) {
          console.log(`❌ ${description}: Erro ao parsear JSON`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve(false);
    });
  });
}

// Testes
async function runTests() {
  console.log('\n🔍 Testando endpoints...\n');
  
  // Substitua pela URL do seu deploy
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  
  const tests = [
    { url: `${baseUrl}/health`, desc: 'Health Check' },
    { url: `${baseUrl}/api/stations`, desc: 'Estações' },
    { url: `${baseUrl}/api/wallet`, desc: 'Carteira' },
    { url: `${baseUrl}/api/vehicles`, desc: 'Veículos' },
    { url: `${baseUrl}/api/reservations`, desc: 'Reservas' }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = await testEndpoint(test.url, test.desc);
    if (result) passed++;
  }
  
  console.log(`\n📊 Resultado: ${passed}/${tests.length} testes passaram`);
  
  if (passed === tests.length) {
    console.log('🎉 Deploy realizado com sucesso!');
    console.log('✅ Todas as APIs estão funcionando');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique os logs.');
  }
}

runTests().catch(console.error);
