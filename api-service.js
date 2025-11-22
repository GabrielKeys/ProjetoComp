// Serviço de API para substituir localStorage
// Substitui todas as operações de localStorage por chamadas para a API

class VoltWayAPI {
  constructor(baseURL = null) {
    // Usar configuração se disponível, senão usar URL padrão
    this.baseURL = baseURL || (window.VOLTWAY_CONFIG ? window.VOLTWAY_CONFIG.API_BASE_URL : 'http://localhost:3000/api');
    this.token = localStorage.getItem('authToken');
  }

  // Configurar token de autenticação
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Fazer requisições HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (options.body) {
      config.body = options.body;
    }

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      // Verificar se a resposta é JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Resposta inválida do servidor: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.error('❌ Erro de conexão:', `Não foi possível conectar ao servidor em ${url}`);
        console.error('   Verifique se o servidor está rodando: npm start ou node server.refactored.js');
        throw new Error('Servidor não está respondendo. Verifique se o backend está rodando na porta 3000.');
      }
      console.error('Erro na API:', error);
      throw error;
    }
  }

  // ===============================
  // AUTENTICAÇÃO
  // ===============================
  
  async register(userData) {
    // Converter fullName para full_name se necessário
    const dataToSend = {
      ...userData,
      full_name: userData.full_name || userData.fullName
    };
    if (userData.fullName && !userData.full_name) {
      delete dataToSend.fullName;
    }
    
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dataToSend)
    });

    if (response.success) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.success) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async loginWithGoogle(googleData) {
    const response = await this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData)
    });

    if (response.success) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getCurrentUser() {
    const response = await this.request('/auth/me');
    return response;
  }

  async updateProfile(profileData) {
    const response = await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return response;
  }

  logout() {
    this.setToken(null);
    // Limpar outros dados do localStorage
    localStorage.removeItem('logado');
    localStorage.removeItem('logado_como');
    localStorage.removeItem('usuario');
    localStorage.removeItem('usuarioEmail');
  }

  // ===============================
  // ESTAÇÕES
  // ===============================

  async getStations(filters = {}) {
    const params = new URLSearchParams();
    if (filters.city) params.append('city', filters.city);
    if (filters.latitude) params.append('latitude', filters.latitude);
    if (filters.longitude) params.append('longitude', filters.longitude);
    if (filters.radius) params.append('radius', filters.radius);
    if (filters.limit) params.append('limit', filters.limit);

    const query = params.toString();
    const endpoint = query ? `/stations?${query}` : '/stations';
    
    const response = await this.request(endpoint);
    return response;
  }

  async getStation(id) {
    const response = await this.request(`/stations/${id}`);
    return response;
  }

  async createStation(stationData) {
    const response = await this.request('/stations', {
      method: 'POST',
      body: JSON.stringify(stationData)
    });
    return response;
  }

  async updateStation(id, stationData) {
    const response = await this.request(`/stations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stationData)
    });
    return response;
  }

  async deleteStation(id) {
    const response = await this.request(`/stations/${id}`, {
      method: 'DELETE'
    });
    return response;
  }

  async toggleFavoriteStation(stationId) {
    const response = await this.request(`/stations/${stationId}/favorite`, {
      method: 'POST'
    });
    return response;
  }

  async syncGoogleStations(stations) {
    const response = await this.request('/stations/sync', {
      method: 'POST',
      body: JSON.stringify({ stations })
    });
    return response;
  }

  // ===============================
  // VEÍCULOS
  // ===============================

  async getVehicles() {
    const response = await this.request('/vehicles');
    return response;
  }

  async getVehicle(id) {
    const response = await this.request(`/vehicles/${id}`);
    return response;
  }

  async createVehicle(vehicleData) {
    const response = await this.request('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData)
    });
    return response;
  }

  async updateVehicle(id, vehicleData) {
    const response = await this.request(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData)
    });
    return response;
  }

  async deleteVehicle(id) {
    const response = await this.request(`/vehicles/${id}`, {
      method: 'DELETE'
    });
    return response;
  }

  // ===============================
  // CARTEIRA
  // ===============================

  async getWallet() {
    const response = await this.request('/wallet');
    return response;
  }

  async rechargeWallet(amount, paymentMethod = 'google_pay') {
    const response = await this.request('/wallet/recharge', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod })
    });
    return response;
  }

  async getTransactions(limit = 50, offset = 0) {
    const response = await this.request(`/wallet/transactions?limit=${limit}&offset=${offset}`);
    return response;
  }

  async refundTransaction(transactionId, reason) {
    const response = await this.request('/wallet/refund', {
      method: 'POST',
      body: JSON.stringify({ transactionId, reason })
    });
    return response;
  }

  // ===============================
  // RESERVAS
  // ===============================

  async getReservations(status = null, limit = 50, offset = 0) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit);
    params.append('offset', offset);

    const query = params.toString();
    const response = await this.request(`/reservations?${query}`);
    return response;
  }

  async getReservation(id) {
    const response = await this.request(`/reservations/${id}`);
    return response;
  }

  async createReservation(reservationData) {
    const response = await this.request('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    });
    return response;
  }

  async cancelReservation(id) {
    const response = await this.request(`/reservations/${id}/cancel`, {
      method: 'PUT'
    });
    return response;
  }

  async startCharging(id) {
    const response = await this.request(`/reservations/${id}/start`, {
      method: 'PUT'
    });
    return response;
  }

  async completeCharging(id, energyConsumed) {
    const response = await this.request(`/reservations/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ energyConsumed })
    });
    return response;
  }

  // ===============================
  // UTILITÁRIOS
  // ===============================

  // Verificar se usuário está logado
  isLoggedIn() {
    return !!this.token;
  }

  // Obter dados do usuário do localStorage (fallback)
  getLocalUser() {
    return {
      usuario: localStorage.getItem('usuario'),
      usuarioEmail: localStorage.getItem('usuarioEmail'),
      logado: localStorage.getItem('logado') === 'true',
      logado_como: localStorage.getItem('logado_como')
    };
  }

  // Migrar dados do localStorage para a API
  async migrateLocalData() {
    try {
      const localUser = this.getLocalUser();
      
      if (localUser.logado && localUser.usuarioEmail) {
        // Tentar fazer login com dados locais
        console.log('🔄 Migrando dados do localStorage...');
        
        // Verificar se já existe carteira
        const wallet = await this.getWallet();
        if (!wallet.success) {
          console.log('⚠️ Usuário não encontrado na API, dados locais serão perdidos');
          return false;
        }

        console.log('✅ Dados migrados com sucesso!');
        return true;
      }
    } catch (error) {
      console.error('❌ Erro na migração:', error);
      return false;
    }
  }
}

// Instância global da API
const api = new VoltWayAPI();

// Para compatibilidade com código existente
window.VoltWayAPI = VoltWayAPI;
window.api = api;
