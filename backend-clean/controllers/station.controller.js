// Station Controller - Responsabilidade: Receber requests e retornar responses
// Aplica SRP: Apenas comunicação HTTP

const stationService = require('../services/station.service');

class StationController {
  async getAllStations(req, res, next) {
    try {
      const stations = await stationService.getAllStations(req.query);
      res.json({
        success: true,
        data: { stations }
      });
    } catch (error) {
      next(error);
    }
  }

  async getStationById(req, res, next) {
    try {
      const station = await stationService.getStationById(req.params.id);
      res.json({
        success: true,
        data: { station }
      });
    } catch (error) {
      next(error);
    }
  }

  async syncGoogleStations(req, res, next) {
    try {
      const { stations } = req.body;
      const result = await stationService.syncGoogleStations(stations);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StationController();




