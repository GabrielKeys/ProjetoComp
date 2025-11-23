// Reservation Service - Responsabilidade: Lógica de negócio de reservas
// Aplica SRP: Apenas lógica de reservas
// Aplica DIP: Depende de abstrações (repositories, services)

const reservationRepository = require('../repositories/reservation.repository');
const stationRepository = require('../repositories/station.repository');
const walletService = require('./wallet.service');

class ReservationService {
  async getReservations(userId, filters = {}) {
    const reservations = await reservationRepository.findByUserId(userId, filters);
    return reservations.map(reservation => this.transformReservation(reservation));
  }

  async getReservationById(id) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) {
      throw new Error('Reserva não encontrada');
    }
    return this.transformReservation(reservation);
  }

  async createReservation(userId, reservationData) {
    // Validação
    if (!reservationData.stationId || !reservationData.reservationDate || 
        !reservationData.startTime || !reservationData.endTime) {
      throw new Error('Dados incompletos');
    }

    // Verificar se estação existe
    const station = await stationRepository.findById(reservationData.stationId);
    if (!station) {
      throw new Error('Estação não encontrada');
    }

    // Verificar saldo
    const RESERVATION_COST = 10.00;
    const hasBalance = await walletService.checkBalance(userId, RESERVATION_COST);
    if (!hasBalance) {
      throw new Error('Saldo insuficiente');
    }

    // Criar reserva
    const reservation = await reservationRepository.create({
      userId,
      stationId: reservationData.stationId,
      reservationDate: reservationData.reservationDate,
      startTime: reservationData.startTime,
      endTime: reservationData.endTime,
      status: 'confirmed',
      totalCost: RESERVATION_COST
    });

    // Debitar da carteira
    await walletService.debit(userId, RESERVATION_COST);

    return this.transformReservation(reservation);
  }

  async cancelReservation(id, userId) {
    const reservation = await reservationRepository.findById(id);
    
    if (!reservation) {
      throw new Error('Reserva não encontrada');
    }

    if (reservation.user_id !== userId) {
      throw new Error('Não autorizado');
    }

    if (reservation.status === 'cancelled') {
      throw new Error('Reserva já está cancelada');
    }

    // Atualizar status
    const updated = await reservationRepository.updateStatus(id, 'cancelled');

    // Reembolsar (opcional)
    // await walletService.recharge(userId, reservation.total_cost);

    return this.transformReservation(updated);
  }

  transformReservation(reservation) {
    return {
      id: reservation.id,
      userId: reservation.user_id,
      stationId: reservation.station_id,
      reservationDate: reservation.reservation_date,
      startTime: reservation.start_time,
      endTime: reservation.end_time,
      status: reservation.status,
      totalCost: parseFloat(reservation.total_cost),
      createdAt: reservation.created_at,
      updatedAt: reservation.updated_at
    };
  }
}

module.exports = new ReservationService();




