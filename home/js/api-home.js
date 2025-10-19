// VoltWay Home com API - Substitui localStorage
// ===============================

class VoltWayHomeAPI {
  constructor() {
    this.api = window.api;
    this.currentUser = null;
    this.userVehicles = [];
    this.userWallet = null;
    this.userReservations = [];
  }

  // ===============================
  // INICIALIZAÇÃO
  // ===============================
  
  async init() {
    console.log('🏠 VoltWay Home API inicializado');
    
    try {
      // Verificar se usuário está logado
      if (!this.api.isLoggedIn()) {
        this.redirectToLogin();
        return;
      }

      // Carregar dados do usuário
      await this.loadUserData();
      
      // Carregar dados da página
      await this.loadPageData();
      
      // Configurar event listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Erro na inicialização:', error);
      this.showError('Erro ao carregar dados da página');
    }
  }

  async loadUserData() {
    try {
      // Obter dados do usuário atual
      const userResponse = await this.api.getCurrentUser();
      if (userResponse.success) {
        this.currentUser = userResponse.data.user;
        this.userWallet = userResponse.data.wallet;
      }

      // Obter veículos do usuário
      const vehiclesResponse = await this.api.getVehicles();
      if (vehiclesResponse.success) {
        this.userVehicles = vehiclesResponse.data.vehicles;
      }

      // Obter reservas do usuário
      const reservationsResponse = await this.api.getReservations();
      if (reservationsResponse.success) {
        this.userReservations = reservationsResponse.data.reservations;
      }

    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      throw error;
    }
  }

  async loadPageData() {
    // Atualizar UI com dados carregados
    this.updateUserInfo();
    this.updateWalletDisplay();
    this.updateVehiclesDisplay();
    this.updateReservationsDisplay();
  }

  // ===============================
  // ATUALIZAÇÃO DA UI
  // ===============================

  updateUserInfo() {
    if (this.currentUser) {
      // Atualizar nome do usuário na UI
      const userNameElements = document.querySelectorAll('.user-name, .usuario-nome');
      userNameElements.forEach(el => {
        el.textContent = this.currentUser.fullName || this.currentUser.email;
      });

      // Atualizar foto do usuário se disponível
      if (this.currentUser.photoUrl) {
        const userPhotoElements = document.querySelectorAll('.user-photo, .usuario-foto');
        userPhotoElements.forEach(el => {
          el.src = this.currentUser.photoUrl;
        });
      }
    }
  }

  updateWalletDisplay() {
    if (this.userWallet) {
      // Atualizar saldo da carteira
      const saldoElements = document.querySelectorAll('.saldo-valor, .wallet-balance');
      saldoElements.forEach(el => {
        el.textContent = `R$ ${this.userWallet.balance.toFixed(2)}`;
      });

      // Atualizar histórico de transações
      this.updateTransactionsDisplay();
    }
  }

  async updateTransactionsDisplay() {
    try {
      const transactionsResponse = await this.api.getTransactions(10);
      if (transactionsResponse.success) {
        const transactions = transactionsResponse.data.transactions;
        this.renderTransactions(transactions);
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  }

  renderTransactions(transactions) {
    const container = document.getElementById('transacoes-container');
    if (!container) return;

    container.innerHTML = '';
    
    transactions.forEach(transaction => {
      const transactionEl = document.createElement('div');
      transactionEl.className = 'transacao-item';
      
      const valor = parseFloat(transaction.amount);
      const tipo = transaction.type;
      const data = new Date(transaction.created_at).toLocaleDateString('pt-BR');
      
      transactionEl.innerHTML = `
        <div class="transacao-info">
          <span class="transacao-tipo">${this.getTransactionTypeLabel(tipo)}</span>
          <span class="transacao-data">${data}</span>
        </div>
        <div class="transacao-valor ${valor >= 0 ? 'positivo' : 'negativo'}">
          ${valor >= 0 ? '+' : ''}R$ ${valor.toFixed(2)}
        </div>
      `;
      
      container.appendChild(transactionEl);
    });
  }

  getTransactionTypeLabel(type) {
    const labels = {
      'recarga': 'Recarga',
      'reserva': 'Reserva',
      'carregamento': 'Carregamento',
      'pagamento': 'Pagamento',
      'estorno': 'Estorno'
    };
    return labels[type] || type;
  }

  updateVehiclesDisplay() {
    const container = document.getElementById('veiculos-container');
    if (!container) return;

    container.innerHTML = '';
    
    this.userVehicles.forEach(vehicle => {
      const vehicleEl = document.createElement('div');
      vehicleEl.className = 'veiculo-card';
      
      vehicleEl.innerHTML = `
        <div class="veiculo-info">
          <h3>${vehicle.model}</h3>
          <p>${vehicle.year} • ${vehicle.plate}</p>
          <p>Bateria: ${vehicle.batteryCapacity || 'N/D'} kWh</p>
          <p>Carregamento: ${vehicle.chargingPower || 'N/D'} kW</p>
        </div>
        <div class="veiculo-actions">
          <button onclick="homeAPI.editVehicle('${vehicle.id}')" class="btn-edit">Editar</button>
          <button onclick="homeAPI.deleteVehicle('${vehicle.id}')" class="btn-delete">Excluir</button>
        </div>
      `;
      
      container.appendChild(vehicleEl);
    });
  }

  updateReservationsDisplay() {
    const container = document.getElementById('reservas-container');
    if (!container) return;

    container.innerHTML = '';
    
    this.userReservations.forEach(reservation => {
      const reservationEl = document.createElement('div');
      reservationEl.className = 'reserva-card';
      
      const statusClass = this.getReservationStatusClass(reservation.status);
      const data = new Date(reservation.reservation_date).toLocaleDateString('pt-BR');
      
      reservationEl.innerHTML = `
        <div class="reserva-info">
          <h3>${reservation.station_name || 'Estação'}</h3>
          <p>${data} • ${reservation.start_time} - ${reservation.end_time}</p>
          <p>Status: <span class="status ${statusClass}">${this.getReservationStatusLabel(reservation.status)}</span></p>
          <p>Custo: R$ ${reservation.total_cost || 0}</p>
        </div>
        <div class="reserva-actions">
          ${this.getReservationActions(reservation)}
        </div>
      `;
      
      container.appendChild(reservationEl);
    });
  }

  getReservationStatusClass(status) {
    const classes = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'active': 'status-active',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return classes[status] || 'status-pending';
  }

  getReservationStatusLabel(status) {
    const labels = {
      'pending': 'Pendente',
      'confirmed': 'Confirmada',
      'active': 'Ativa',
      'completed': 'Concluída',
      'cancelled': 'Cancelada'
    };
    return labels[status] || status;
  }

  getReservationActions(reservation) {
    const actions = [];
    
    if (reservation.status === 'confirmed') {
      actions.push(`<button onclick="homeAPI.startCharging('${reservation.id}')" class="btn-start">Iniciar</button>`);
      actions.push(`<button onclick="homeAPI.cancelReservation('${reservation.id}')" class="btn-cancel">Cancelar</button>`);
    } else if (reservation.status === 'active') {
      actions.push(`<button onclick="homeAPI.completeCharging('${reservation.id}')" class="btn-complete">Finalizar</button>`);
    }
    
    return actions.join(' ');
  }

  // ===============================
  // AÇÕES DA CARTEIRA
  // ===============================

  async recarregarCarteira(valor) {
    try {
      this.showLoading('Processando recarga...');
      
      const response = await this.api.rechargeWallet(valor);
      
      if (response.success) {
        this.userWallet = response.data.wallet;
        this.updateWalletDisplay();
        this.showSuccess('Recarga realizada com sucesso!');
      }
    } catch (error) {
      console.error('Erro na recarga:', error);
      this.showError('Erro ao realizar recarga');
    }
  }

  // ===============================
  // AÇÕES DE VEÍCULOS
  // ===============================

  async addVehicle(vehicleData) {
    try {
      this.showLoading('Cadastrando veículo...');
      
      const response = await this.api.createVehicle(vehicleData);
      
      if (response.success) {
        this.userVehicles.push(response.data.vehicle);
        this.updateVehiclesDisplay();
        this.showSuccess('Veículo cadastrado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao cadastrar veículo:', error);
      this.showError('Erro ao cadastrar veículo');
    }
  }

  async editVehicle(vehicleId) {
    const vehicle = this.userVehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    // Implementar modal de edição
    const newModel = prompt('Modelo:', vehicle.model);
    const newYear = prompt('Ano:', vehicle.year);
    const newPlate = prompt('Placa:', vehicle.plate);

    if (newModel && newYear && newPlate) {
      try {
        this.showLoading('Atualizando veículo...');
        
        const response = await this.api.updateVehicle(vehicleId, {
          model: newModel,
          year: parseInt(newYear),
          plate: newPlate
        });
        
        if (response.success) {
          const index = this.userVehicles.findIndex(v => v.id === vehicleId);
          this.userVehicles[index] = response.data.vehicle;
          this.updateVehiclesDisplay();
          this.showSuccess('Veículo atualizado com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao atualizar veículo:', error);
        this.showError('Erro ao atualizar veículo');
      }
    }
  }

  async deleteVehicle(vehicleId) {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return;

    try {
      this.showLoading('Excluindo veículo...');
      
      const response = await this.api.deleteVehicle(vehicleId);
      
      if (response.success) {
        this.userVehicles = this.userVehicles.filter(v => v.id !== vehicleId);
        this.updateVehiclesDisplay();
        this.showSuccess('Veículo excluído com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao excluir veículo:', error);
      this.showError('Erro ao excluir veículo');
    }
  }

  // ===============================
  // AÇÕES DE RESERVAS
  // ===============================

  async cancelReservation(reservationId) {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;

    try {
      this.showLoading('Cancelando reserva...');
      
      const response = await this.api.cancelReservation(reservationId);
      
      if (response.success) {
        const index = this.userReservations.findIndex(r => r.id === reservationId);
        this.userReservations[index] = response.data.reservation;
        this.updateReservationsDisplay();
        this.showSuccess('Reserva cancelada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      this.showError('Erro ao cancelar reserva');
    }
  }

  async startCharging(reservationId) {
    try {
      this.showLoading('Iniciando carregamento...');
      
      const response = await this.api.startCharging(reservationId);
      
      if (response.success) {
        const index = this.userReservations.findIndex(r => r.id === reservationId);
        this.userReservations[index] = response.data.reservation;
        this.updateReservationsDisplay();
        this.showSuccess('Carregamento iniciado!');
      }
    } catch (error) {
      console.error('Erro ao iniciar carregamento:', error);
      this.showError('Erro ao iniciar carregamento');
    }
  }

  async completeCharging(reservationId) {
    const energyConsumed = prompt('Energia consumida (kWh):');
    if (!energyConsumed || isNaN(energyConsumed)) return;

    try {
      this.showLoading('Finalizando carregamento...');
      
      const response = await this.api.completeCharging(reservationId, parseFloat(energyConsumed));
      
      if (response.success) {
        const index = this.userReservations.findIndex(r => r.id === reservationId);
        this.userReservations[index] = response.data.reservation;
        this.updateReservationsDisplay();
        this.updateWalletDisplay(); // Atualizar saldo
        this.showSuccess('Carregamento finalizado!');
      }
    } catch (error) {
      console.error('Erro ao finalizar carregamento:', error);
      this.showError('Erro ao finalizar carregamento');
    }
  }

  // ===============================
  // EVENT LISTENERS
  // ===============================

  setupEventListeners() {
    // Botão de recarga da carteira
    const recargaBtn = document.getElementById('recarga-btn');
    if (recargaBtn) {
      recargaBtn.addEventListener('click', () => {
        const valor = prompt('Valor da recarga:');
        if (valor && !isNaN(valor)) {
          this.recarregarCarteira(parseFloat(valor));
        }
      });
    }

    // Botão de adicionar veículo
    const addVehicleBtn = document.getElementById('add-vehicle-btn');
    if (addVehicleBtn) {
      addVehicleBtn.addEventListener('click', () => {
        this.showAddVehicleModal();
      });
    }

    // Botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }
  }

  showAddVehicleModal() {
    // Implementar modal de adicionar veículo
    const model = prompt('Modelo do veículo:');
    const year = prompt('Ano:');
    const plate = prompt('Placa:');
    const battery = prompt('Capacidade da bateria (kWh):');
    const power = prompt('Potência de carregamento (kW):');

    if (model && year && plate) {
      this.addVehicle({
        model,
        year: parseInt(year),
        plate,
        batteryCapacity: battery ? parseFloat(battery) : null,
        chargingPower: power ? parseFloat(power) : null
      });
    }
  }

  logout() {
    this.api.logout();
    this.redirectToLogin();
  }

  redirectToLogin() {
    window.location.href = '../login/login.html';
  }

  // ===============================
  // UTILITÁRIOS
  // ===============================

  showLoading(message) {
    // Implementar loading
    console.log('Loading:', message);
  }

  showSuccess(message) {
    // Implementar notificação de sucesso
    alert(message);
  }

  showError(message) {
    // Implementar notificação de erro
    alert('Erro: ' + message);
  }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  window.homeAPI = new VoltWayHomeAPI();
  window.homeAPI.init();
});
