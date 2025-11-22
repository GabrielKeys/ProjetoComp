// Reservation Controller - Responsabilidade: Receber requests e retornar responses
// Aplica SRP: Apenas comunicação HTTP

const reservationService = require('../services/reservation.service');

class ReservationController {
  async getReservations(req, res, next) {
    try {
      const reservations = await reservationService.getReservations(
        req.userId,
        req.query
      );
      res.json({
        success: true,
        data: { reservations }
      });
    } catch (error) {
      next(error);
    }
  }

  async getReservationById(req, res, next) {
    try {
      const reservation = await reservationService.getReservationById(req.params.id);
      res.json({
        success: true,
        data: { reservation }
      });
    } catch (error) {
      next(error);
    }
  }

  async createReservation(req, res, next) {
    try {
      const reservation = await reservationService.createReservation(
        req.userId,
        req.body
      );
      res.status(201).json({
        success: true,
        data: { reservation }
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelReservation(req, res, next) {
    try {
      const reservation = await reservationService.cancelReservation(
        req.params.id,
        req.userId
      );
      res.json({
        success: true,
        data: { reservation }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReservationController();


