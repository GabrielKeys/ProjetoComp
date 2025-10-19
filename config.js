// Configuração da API VoltWay
// ===============================

const CONFIG = {
  // URL da API (altere conforme seu deploy)
  API_BASE_URL: 'http://localhost:3000/api',
  
  // URLs de produção (descomente após deploy)
  // API_BASE_URL: 'https://voltway-backend-production.up.railway.app/api',
  
  // Configurações do Google
  GOOGLE_CLIENT_ID: '288143953215-o49d879dqorujtkpgfqg80gp7u9ai9ra.apps.googleusercontent.com',
  
  // Configurações do mapa
  MAP_CENTER: {
    lat: -23.5505,
    lng: -46.6333
  },
  
  MAP_ZOOM: 13,
  MAP_MIN_ZOOM: 12,
  MAP_MAX_ZOOM: 25,
  
  // Configurações da aplicação
  APP_NAME: 'VoltWay',
  APP_VERSION: '2.0.0',
  
  // Timeouts
  API_TIMEOUT: 30000,
  MAP_TIMEOUT: 20000,
  
  // Limites
  MAX_STATIONS_PER_REQUEST: 100,
  MAX_RESERVATIONS_PER_REQUEST: 50,
  MAX_VEHICLES_PER_USER: 10,
  
  // Preços
  RESERVATION_COST: 10.00, // R$ 10,00 por reserva
  
  // Configurações de desenvolvimento
  DEBUG: true,
  LOG_API_CALLS: true
};

// Função para obter URL da API baseada no ambiente
function getApiUrl() {
  // Se estiver em produção (HTTPS), usar URL de produção
  if (window.location.protocol === 'https:') {
    return 'https://voltway-backend-production.up.railway.app/api';
  }
  
  // Se estiver em localhost, usar URL local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  
  // Fallback para configuração padrão
  return CONFIG.API_BASE_URL;
}

// Atualizar configuração com URL correta
CONFIG.API_BASE_URL = getApiUrl();

// Log da configuração (apenas em desenvolvimento)
if (CONFIG.DEBUG) {
  console.log('🔧 VoltWay Config:', CONFIG);
}

// Exportar configuração
window.VOLTWAY_CONFIG = CONFIG;
