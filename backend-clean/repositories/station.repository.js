// Station Repository - Responsabilidade: Acesso ao banco de dados de estações
// Aplica SRP: Apenas operações de banco relacionadas a estações

const { query } = require('../db');

class StationRepository {
  async findAll(filters = {}) {
    let sql = 'SELECT * FROM stations WHERE is_active = true';
    const params = [];
    let paramCount = 1;

    if (filters.city) {
      sql += ` AND city = $${paramCount++}`;
      params.push(filters.city);
    }

    sql += ` ORDER BY name LIMIT $${paramCount}`;
    params.push(filters.limit || 100);

    const result = await query(sql, params);
    return result.rows;
  }

  async findById(id) {
    const result = await query(
      'SELECT * FROM stations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(stationData) {
    const result = await query(
      `INSERT INTO stations (name, address, city, state, latitude, longitude, power_kw, price_per_kwh, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        stationData.name,
        stationData.address,
        stationData.city,
        stationData.state,
        stationData.latitude,
        stationData.longitude,
        stationData.powerKw || stationData.power_kw,
        stationData.pricePerKwh || stationData.price_per_kwh,
        stationData.isActive !== undefined ? stationData.isActive : true
      ]
    );
    return result.rows[0];
  }

  async findNearby(latitude, longitude, radius = 0.001) {
    const result = await query(
      `SELECT * FROM stations 
       WHERE is_active = true 
       AND ABS(latitude - $1) < $3 
       AND ABS(longitude - $2) < $3`,
      [latitude, longitude, radius]
    );
    return result.rows;
  }

  async findByNameOrLocation(name, latitude, longitude) {
    const result = await query(
      `SELECT id FROM stations 
       WHERE name = $1 
       OR (ABS(latitude - $2) < 0.001 AND ABS(longitude - $3) < 0.001)`,
      [name, latitude, longitude]
    );
    return result.rows[0] || null;
  }

  async syncStations(stations) {
    const results = {
      inserted: 0,
      skipped: 0,
      errors: []
    };

    for (const station of stations) {
      try {
        const existing = await this.findByNameOrLocation(
          station.name,
          station.latitude,
          station.longitude
        );

        if (existing) {
          results.skipped++;
          continue;
        }

        await this.create(station);
        results.inserted++;
      } catch (error) {
        results.errors.push(`Erro ao inserir ${station.name}: ${error.message}`);
      }
    }

    return results;
  }
}

module.exports = new StationRepository();

