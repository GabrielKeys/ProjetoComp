// Wallet Controller - Responsabilidade: Receber requests e retornar responses
// Aplica SRP: Apenas comunicação HTTP

const walletService = require('../services/wallet.service');

class WalletController {
  async getWallet(req, res, next) {
    try {
      const wallet = await walletService.getWallet(req.userId);
      res.json({
        success: true,
        data: { wallet }
      });
    } catch (error) {
      next(error);
    }
  }

  async recharge(req, res, next) {
    try {
      const { amount } = req.body;
      const wallet = await walletService.recharge(req.userId, amount);
      res.json({
        success: true,
        data: { wallet }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WalletController();




