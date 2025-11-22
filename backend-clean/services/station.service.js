// Station Service - Responsabilidade: Lógica de negócio de estações
// Aplica SRP: Apenas lógica de estações

const stationRepository = require('../repositories/station.repository');

class StationService {
  async getAllStations(filters = {}) {
    const stations = await stationRepository.findAll(filters);
    
    // Transformar dados do banco para formato da API
    return stations.map(station => this.transformStation(station));
  }

  async getStationById(id) {
    const station = await stationRepository.findById(id);
    if (!station) {
      throw new Error('Estação não encontrada');
    }
    return this.transformStation(station);
  }

  async syncGoogleStations(stations) {
    // Validar dados
    const validStations = stations.filter(station => 
      station.name && station.latitude && station.longitude
    );

    if (validStations.length === 0) {
      throw new Error('Nenhuma estação válida fornecida');
    }

    // Processar estações (extrair cidade/estado, gerar valores)
    const processedStations = validStations.map(station => 
      this.processGoogleStation(station)
    );

    // Sincronizar com banco
    const results = await stationRepository.syncStations(processedStations);

    return {
      message: `Sincronização concluída: ${results.inserted} inseridas, ${results.skipped} ignoradas`,
      ...results
    };
  }

  processGoogleStation(station) {
    // Extrair cidade e estado do endereço
    const { city, state } = this.parseAddress(station.address || station.formattedAddress || '');
    
    // Gerar valores realistas
    const { powerKw, pricePerKwh } = this.generateRealisticValues();

    return {
      name: station.name,
      address: station.address || station.formattedAddress || '',
      city,
      state,
      latitude: station.latitude,
      longitude: station.longitude,
      powerKw,
      pricePerKwh
    };
  }

  parseAddress(address) {
    const parts = address.split(',');
    if (parts.length >= 2) {
      const cityState = parts[parts.length - 1].trim();
      const cityStateParts = cityState.split(' - ');
      return {
        city: cityStateParts[0] || 'São Paulo',
        state: cityStateParts[1] || 'SP'
      };
    }
    return { city: 'São Paulo', state: 'SP' };
  }

  generateRealisticValues() {
    const powerKw = Math.floor(Math.random() * 150) + 50; // 50-200kW
    const pricePerKwh = (Math.random() * 0.5 + 0.7).toFixed(2); // R$ 0,70 - R$ 1,20
    
    return {
      powerKw: parseFloat(powerKw.toFixed(1)),
      pricePerKwh: parseFloat(pricePerKwh)
    };
  }

  transformStation(station) {
    return {
      id: station.id,
      name: station.name,
      address: station.address,
      city: station.city,
      state: station.state,
      latitude: parseFloat(station.latitude),
      longitude: parseFloat(station.longitude),
      powerKw: parseFloat(station.power_kw),
      pricePerKwh: parseFloat(station.price_per_kwh),
      isActive: station.is_active
    };
  }
}

module.exports = new StationService();

