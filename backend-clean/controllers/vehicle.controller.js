// Vehicle Controller - Responsabilidade: Receber requests e retornar responses
// Aplica SRP: Apenas comunicação HTTP

const vehicleService = require('../services/vehicle.service');

class VehicleController {
  async getVehicles(req, res, next) {
    try {
      const vehicles = await vehicleService.getVehicles(req.userId);
      res.json({
        success: true,
        data: { vehicles }
      });
    } catch (error) {
      next(error);
    }
  }

  async getVehicleById(req, res, next) {
    try {
      const vehicle = await vehicleService.getVehicleById(req.params.id);
      res.json({
        success: true,
        data: { vehicle }
      });
    } catch (error) {
      next(error);
    }
  }

  async createVehicle(req, res, next) {
    try {
      const vehicle = await vehicleService.createVehicle(req.userId, req.body);
      res.status(201).json({
        success: true,
        data: { vehicle }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateVehicle(req, res, next) {
    try {
      const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
      res.json({
        success: true,
        data: { vehicle }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteVehicle(req, res, next) {
    try {
      const result = await vehicleService.deleteVehicle(req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VehicleController();

