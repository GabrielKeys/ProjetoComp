// Wallet Service - Responsabilidade: Lógica de negócio de carteiras
// Aplica SRP: Apenas lógica de carteiras

const walletRepository = require('../repositories/wallet.repository');

class WalletService {
  async getWallet(userId) {
    const wallet = await walletRepository.getOrCreate(userId);
    return {
      id: wallet.id,
      userId: wallet.user_id,
      balance: parseFloat(wallet.balance),
      createdAt: wallet.created_at,
      updatedAt: wallet.updated_at
    };
  }

  async recharge(userId, amount) {
    if (amount <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }

    const wallet = await walletRepository.credit(userId, amount);
    return {
      id: wallet.id,
      userId: wallet.user_id,
      balance: parseFloat(wallet.balance)
    };
  }

  async debit(userId, amount) {
    const wallet = await walletRepository.findByUserId(userId);
    
    if (!wallet) {
      throw new Error('Carteira não encontrada');
    }

    if (parseFloat(wallet.balance) < amount) {
      throw new Error('Saldo insuficiente');
    }

    const updatedWallet = await walletRepository.debit(userId, amount);
    return {
      id: updatedWallet.id,
      userId: updatedWallet.user_id,
      balance: parseFloat(updatedWallet.balance)
    };
  }

  async checkBalance(userId, requiredAmount) {
    const wallet = await walletRepository.findByUserId(userId);
    
    if (!wallet) {
      return false;
    }

    return parseFloat(wallet.balance) >= requiredAmount;
  }
}

module.exports = new WalletService();




