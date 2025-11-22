// User Repository - Responsabilidade: Acesso ao banco de dados de usuários
// Aplica SRP: Apenas operações de banco relacionadas a usuários

const { query } = require('../db');

class UserRepository {
  async findByEmail(email) {
    const result = await query(
      'SELECT id, full_name, email, password_hash, phone, photo_url, google_id, is_google_user FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findById(id) {
    const result = await query(
      'SELECT id, full_name, email, phone, photo_url FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(userData) {
    const result = await query(
      'INSERT INTO users (full_name, email, password_hash, phone, google_id, is_google_user) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, full_name, email, phone',
      [
        userData.full_name,
        userData.email,
        userData.password_hash,
        userData.phone || null,
        userData.google_id || null,
        userData.is_google_user || false
      ]
    );
    return result.rows[0];
  }

  async update(id, userData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (userData.full_name) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(userData.full_name);
    }
    if (userData.phone) {
      fields.push(`phone = $${paramCount++}`);
      values.push(userData.phone);
    }
    if (userData.photo_url !== undefined) {
      fields.push(`photo_url = $${paramCount++}`);
      values.push(userData.photo_url);
    }
    if (userData.google_id) {
      fields.push(`google_id = $${paramCount++}`);
      values.push(userData.google_id);
    }
    if (userData.is_google_user !== undefined) {
      fields.push(`is_google_user = $${paramCount++}`);
      values.push(userData.is_google_user);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, full_name, email, phone, photo_url, google_id, is_google_user`,
      values
    );
    return result.rows[0] || null;
  }
}

module.exports = new UserRepository();


