// Auth Controller - Responsabilidade: Receber requests e retornar responses
// Aplica SRP: Apenas comunicação HTTP
// Aplica DIP: Depende de abstrações (services)

const authService = require('../services/auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.userId);
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  async loginWithGoogle(req, res, next) {
    try {
      const result = await authService.loginWithGoogle(req.body);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();


