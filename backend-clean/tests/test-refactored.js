// Teste rápido do servidor refatorado
// Verifica se todas as dependências estão corretas

console.log('🔍 Verificando dependências do servidor refatorado...\n');

const checks = [];

// Verificar imports
try {
  require('../db');
  checks.push({ name: 'db.js', status: '✅' });
} catch (e) {
  checks.push({ name: 'db.js', status: '❌', error: e.message });
}

try {
  require('../routes');
  checks.push({ name: 'routes/index.js', status: '✅' });
} catch (e) {
  checks.push({ name: 'routes/index.js', status: '❌', error: e.message });
}

try {
  require('../middlewares/error.middleware');
  checks.push({ name: 'middlewares/error.middleware.js', status: '✅' });
} catch (e) {
  checks.push({ name: 'middlewares/error.middleware.js', status: '❌', error: e.message });
}

// Verificar controllers
const controllers = ['auth', 'station', 'wallet', 'vehicle', 'reservation'];
controllers.forEach(controller => {
  try {
    require(`../controllers/${controller}.controller`);
    checks.push({ name: `controllers/${controller}.controller.js`, status: '✅' });
  } catch (e) {
    checks.push({ name: `controllers/${controller}.controller.js`, status: '❌', error: e.message });
  }
});

// Verificar services
const services = ['auth', 'station', 'wallet', 'vehicle', 'reservation'];
services.forEach(service => {
  try {
    require(`../services/${service}.service`);
    checks.push({ name: `services/${service}.service.js`, status: '✅' });
  } catch (e) {
    checks.push({ name: `services/${service}.service.js`, status: '❌', error: e.message });
  }
});

// Verificar repositories
const repositories = ['user', 'wallet', 'station', 'vehicle', 'reservation'];
repositories.forEach(repo => {
  try {
    require(`../repositories/${repo}.repository`);
    checks.push({ name: `repositories/${repo}.repository.js`, status: '✅' });
  } catch (e) {
    checks.push({ name: `repositories/${repo}.repository.js`, status: '❌', error: e.message });
  }
});

// Verificar middlewares
try {
  require('../middlewares/auth.middleware');
  checks.push({ name: 'middlewares/auth.middleware.js', status: '✅' });
} catch (e) {
  checks.push({ name: 'middlewares/auth.middleware.js', status: '❌', error: e.message });
}

try {
  require('../middlewares/validation.middleware');
  checks.push({ name: 'middlewares/validation.middleware.js', status: '✅' });
} catch (e) {
  checks.push({ name: 'middlewares/validation.middleware.js', status: '❌', error: e.message });
}

// Resultado
console.log('📊 Resultado das verificações:\n');
checks.forEach(check => {
  console.log(`${check.status} ${check.name}`);
  if (check.error) {
    console.log(`   Erro: ${check.error}\n`);
  }
});

const passed = checks.filter(c => c.status === '✅').length;
const total = checks.length;

console.log(`\n✅ Passou: ${passed}/${total}`);

if (passed === total) {
  console.log('🎉 Todas as dependências estão corretas!');
  process.exit(0);
} else {
  console.log('⚠️  Algumas dependências têm problemas. Verifique os erros acima.');
  process.exit(1);
}

