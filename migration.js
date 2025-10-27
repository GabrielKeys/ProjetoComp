// Script de migração do localStorage para API
// ===============================

class VoltWayMigration {
  constructor() {
    this.api = window.api;
  }

  // ===============================
  // MIGRAÇÃO AUTOMÁTICA
  // ===============================

  async migrateAll() {
    console.log('🔄 Iniciando migração do localStorage para API...');

    try {
      // 1. Verificar se usuário está logado
      if (!this.api.isLoggedIn()) {
        console.log('⚠️ Usuário não está logado, migração não necessária');
        return false;
      }

      // 2. Migrar dados do usuário
      await this.migrateUserData();

      // 3. Migrar veículos
      await this.migrateVehicles();

      // 4. Migrar reservas (se houver)
      await this.migrateReservations();

      // 5. Migrar dados da carteira
      await this.migrateWallet();

      console.log('✅ Migração concluída com sucesso!');
      return true;

    } catch (error) {
      console.error('❌ Erro na migração:', error);
      return false;
    }
  }

  // ===============================
  // MIGRAÇÃO DE DADOS DO USUÁRIO
  // ===============================

  async migrateUserData() {
    console.log('👤 Migrando dados do usuário...');

    const localUser = {
      usuario: localStorage.getItem('usuario'),
      usuarioEmail: localStorage.getItem('usuarioEmail'),
      logado_como: localStorage.getItem('logado_como')
    };

    if (localUser.usuario && localUser.usuarioEmail) {
      try {
        // Verificar se usuário existe na API
        const response = await this.api.getCurrentUser();
        
        if (response.success) {
          console.log('✅ Dados do usuário já existem na API');
          
          // Atualizar dados locais com dados da API
          const apiUser = response.data.user;
          localStorage.setItem('usuario', apiUser.fullName || apiUser.email);
          localStorage.setItem('usuarioEmail', apiUser.email);
          
          return true;
        }
      } catch (error) {
        console.warn('⚠️ Usuário não encontrado na API, dados locais serão perdidos');
      }
    }

    return false;
  }

  // ===============================
  // MIGRAÇÃO DE VEÍCULOS
  // ===============================

  async migrateVehicles() {
    console.log('🚗 Migrando veículos...');

    const localVehicles = this.getLocalVehicles();
    
    if (localVehicles.length === 0) {
      console.log('ℹ️ Nenhum veículo encontrado no localStorage');
      return;
    }

    try {
      // Obter veículos da API
      const apiVehiclesResponse = await this.api.getVehicles();
      const apiVehicles = apiVehiclesResponse.success ? apiVehiclesResponse.data.vehicles : [];

      // Migrar veículos que não existem na API
      for (const localVehicle of localVehicles) {
        const existsInAPI = apiVehicles.some(apiVehicle => 
          apiVehicle.plate === localVehicle.plate
        );

        if (!existsInAPI) {
          try {
            await this.api.createVehicle({
              model: localVehicle.model,
              year: localVehicle.year,
              plate: localVehicle.plate,
              batteryCapacity: localVehicle.batteryCapacity,
              chargingPower: localVehicle.chargingPower
            });
            
            console.log(`✅ Veículo migrado: ${localVehicle.model} (${localVehicle.plate})`);
          } catch (error) {
            console.warn(`⚠️ Erro ao migrar veículo ${localVehicle.plate}:`, error);
          }
        }
      }

    } catch (error) {
      console.error('❌ Erro na migração de veículos:', error);
    }
  }

  getLocalVehicles() {
    const vehicles = [];
    const userEmail = localStorage.getItem('usuarioEmail');
    
    if (!userEmail) return vehicles;

    // Buscar dados de veículo no localStorage
    const model = localStorage.getItem(`veiculoModelo_${userEmail}`);
    const year = localStorage.getItem(`veiculoAno_${userEmail}`);
    const plate = localStorage.getItem(`veiculoPlaca_${userEmail}`);
    const battery = localStorage.getItem(`veiculoBateria_${userEmail}`);
    const power = localStorage.getItem(`veiculoCarregamento_${userEmail}`);

    if (model || year || plate) {
      vehicles.push({
        model: model || 'Veículo',
        year: year ? parseInt(year) : null,
        plate: plate || '',
        batteryCapacity: battery ? parseFloat(battery.replace(/[^\d.,]/g, '')) : null,
        chargingPower: power ? parseFloat(power.replace(/[^\d.,]/g, '')) : null
      });
    }

    return vehicles;
  }

  // ===============================
  // MIGRAÇÃO DE RESERVAS
  // ===============================

  async migrateReservations() {
    console.log('📅 Migrando reservas...');

    // Reservas não são migradas pois são específicas de data/hora
    // e podem causar conflitos
    console.log('ℹ️ Reservas não são migradas automaticamente (dados temporários)');
  }

  // ===============================
  // MIGRAÇÃO DA CARTEIRA
  // ===============================

  async migrateWallet() {
    console.log('💰 Migrando dados da carteira...');

    const userEmail = localStorage.getItem('usuarioEmail');
    if (!userEmail) return;

    try {
      // Verificar carteira na API
      const walletResponse = await this.api.getWallet();
      
      if (walletResponse.success) {
        console.log('✅ Carteira já existe na API');
        return;
      }

      // Buscar dados locais da carteira
      const localSaldo = localStorage.getItem(`saldoCarteira_${userEmail}`);
      const localTransacoes = localStorage.getItem(`transacoesCarteira_${userEmail}`);

      if (localSaldo && parseFloat(localSaldo) > 0) {
        console.log(`ℹ️ Saldo local encontrado: R$ ${localSaldo}`);
        console.log('⚠️ Saldo local não pode ser migrado automaticamente por segurança');
      }

    } catch (error) {
      console.error('❌ Erro na migração da carteira:', error);
    }
  }

  // ===============================
  // LIMPEZA DO LOCALSTORAGE
  // ===============================

  async cleanupLocalStorage() {
    console.log('🧹 Limpando dados antigos do localStorage...');

    const keysToKeep = [
      'authToken',
      'logado',
      'logado_como',
      'usuario',
      'usuarioEmail',
      'filtroRecarga'
    ];

    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && !keysToKeep.includes(key)) {
        // Remover chaves antigas que não são mais necessárias
        if (key.startsWith('veiculo') || 
            key.startsWith('saldoCarteira_') || 
            key.startsWith('transacoesCarteira_') ||
            key.startsWith('favoritos_') ||
            key.startsWith('users') ||
            key.startsWith('stations')) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removido: ${key}`);
    });

    console.log(`✅ ${keysToRemove.length} itens removidos do localStorage`);
  }

  // ===============================
  // MIGRAÇÃO COMPLETA
  // ===============================

  async runCompleteMigration() {
    console.log('🚀 Iniciando migração completa...');

    const migrationSuccess = await this.migrateAll();
    
    if (migrationSuccess) {
      // Aguardar um pouco antes de limpar
      setTimeout(() => {
        this.cleanupLocalStorage();
      }, 2000);
    }

    return migrationSuccess;
  }
}

// Função global para executar migração
window.runVoltWayMigration = async function() {
  const migration = new VoltWayMigration();
  return await migration.runCompleteMigration();
};

// Executar migração automaticamente quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
  // Aguardar um pouco para garantir que a API esteja carregada
  setTimeout(async () => {
    if (window.api && window.api.isLoggedIn()) {
      const migration = new VoltWayMigration();
      await migration.migrateAll();
    }
  }, 1000);
});
