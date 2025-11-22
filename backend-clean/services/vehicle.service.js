// Vehicle Service - Responsabilidade: Lógica de negócio de veículos
// Aplica SRP: Apenas lógica de veículos

const vehicleRepository = require('../repositories/vehicle.repository');

class VehicleService {
  async getVehicles(userId) {
    const vehicles = await vehicleRepository.findByUserId(userId);
    return vehicles.map(vehicle => this.transformVehicle(vehicle));
  }

  async getVehicleById(id) {
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) {
      throw new Error('Veículo não encontrado');
    }
    return this.transformVehicle(vehicle);
  }

  async createVehicle(userId, vehicleData) {
    // Validação
    if (!vehicleData.model || !vehicleData.year || !vehicleData.plate || 
        !vehicleData.batteryCapacity || !vehicleData.chargingPower) {
      throw new Error('Dados incompletos');
    }

    const vehicle = await vehicleRepository.create({
      userId,
      ...vehicleData
    });

    return this.transformVehicle(vehicle);
  }

  async updateVehicle(id, vehicleData) {
    const vehicle = await vehicleRepository.update(id, vehicleData);
    if (!vehicle) {
      throw new Error('Veículo não encontrado');
    }
    return this.transformVehicle(vehicle);
  }

  async deleteVehicle(id) {
    const vehicle = await vehicleRepository.delete(id);
    if (!vehicle) {
      throw new Error('Veículo não encontrado');
    }
    return { message: 'Veículo deletado com sucesso' };
  }

  transformVehicle(vehicle) {
    return {
      id: vehicle.id,
      userId: vehicle.user_id,
      model: vehicle.model,
      year: vehicle.year,
      plate: vehicle.plate,
      batteryCapacity: parseFloat(vehicle.battery_capacity),
      chargingPower: parseFloat(vehicle.charging_power),
      createdAt: vehicle.created_at,
      updatedAt: vehicle.updated_at
    };
  }
}

module.exports = new VehicleService();

