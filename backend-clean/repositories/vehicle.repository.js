// Vehicle Repository - Responsabilidade: Acesso ao banco de dados de veículos
// Aplica SRP: Apenas operações de banco relacionadas a veículos

const { query } = require('../db');

class VehicleRepository {
  async findByUserId(userId) {
    const result = await query(
      'SELECT * FROM vehicles WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async findById(id) {
    const result = await query(
      'SELECT * FROM vehicles WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(vehicleData) {
    const result = await query(
      `INSERT INTO vehicles (user_id, model, year, plate, battery_capacity, charging_power)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        vehicleData.userId,
        vehicleData.model,
        vehicleData.year,
        vehicleData.plate,
        vehicleData.batteryCapacity || vehicleData.battery_capacity,
        vehicleData.chargingPower || vehicleData.charging_power
      ]
    );
    return result.rows[0];
  }

  async update(id, vehicleData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (vehicleData.model) {
      fields.push(`model = $${paramCount++}`);
      values.push(vehicleData.model);
    }
    if (vehicleData.year) {
      fields.push(`year = $${paramCount++}`);
      values.push(vehicleData.year);
    }
    if (vehicleData.plate) {
      fields.push(`plate = $${paramCount++}`);
      values.push(vehicleData.plate);
    }
    if (vehicleData.batteryCapacity || vehicleData.battery_capacity) {
      fields.push(`battery_capacity = $${paramCount++}`);
      values.push(vehicleData.batteryCapacity || vehicleData.battery_capacity);
    }
    if (vehicleData.chargingPower || vehicleData.charging_power) {
      fields.push(`charging_power = $${paramCount++}`);
      values.push(vehicleData.chargingPower || vehicleData.charging_power);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await query(
      'DELETE FROM vehicles WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = new VehicleRepository();


