// Reservation Repository - Responsabilidade: Acesso ao banco de dados de reservas
// Aplica SRP: Apenas operações de banco relacionadas a reservas

const { query } = require('../db');

class ReservationRepository {
  async findByUserId(userId, filters = {}) {
    let sql = 'SELECT * FROM reservations WHERE user_id = $1';
    const params = [userId];
    let paramCount = 2;

    if (filters.status) {
      sql += ` AND status = $${paramCount++}`;
      params.push(filters.status);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(filters.limit || 50, filters.offset || 0);

    const result = await query(sql, params);
    return result.rows;
  }

  async findById(id) {
    const result = await query(
      'SELECT * FROM reservations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(reservationData) {
    const result = await query(
      `INSERT INTO reservations (user_id, station_id, reservation_date, start_time, end_time, status, total_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        reservationData.userId,
        reservationData.stationId,
        reservationData.reservationDate,
        reservationData.startTime,
        reservationData.endTime,
        reservationData.status || 'pending',
        reservationData.totalCost || 0.00
      ]
    );
    return result.rows[0];
  }

  async updateStatus(id, status) {
    const result = await query(
      'UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0] || null;
  }

  async update(id, reservationData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (reservationData.status) {
      fields.push(`status = $${paramCount++}`);
      values.push(reservationData.status);
    }
    if (reservationData.totalCost !== undefined) {
      fields.push(`total_cost = $${paramCount++}`);
      values.push(reservationData.totalCost);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE reservations SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }
}

module.exports = new ReservationRepository();

