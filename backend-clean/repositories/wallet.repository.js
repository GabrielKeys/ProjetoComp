// Wallet Repository - Responsabilidade: Acesso ao banco de dados de carteiras
// Aplica SRP: Apenas operações de banco relacionadas a carteiras

const { query } = require('../db');

class WalletRepository {
  async findByUserId(userId) {
    const result = await query(
      'SELECT * FROM wallets WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  async create(userId, initialBalance = 0.00) {
    const result = await query(
      'INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING *',
      [userId, initialBalance]
    );
    return result.rows[0];
  }

  async updateBalance(userId, newBalance) {
    const result = await query(
      'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
      [newBalance, userId]
    );
    return result.rows[0];
  }

  async debit(userId, amount) {
    const result = await query(
      'UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
      [amount, userId]
    );
    return result.rows[0];
  }

  async credit(userId, amount) {
    const result = await query(
      'UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
      [amount, userId]
    );
    return result.rows[0];
  }

  async getOrCreate(userId) {
    let wallet = await this.findByUserId(userId);
    if (!wallet) {
      wallet = await this.create(userId);
    }
    return wallet;
  }
}

module.exports = new WalletRepository();

