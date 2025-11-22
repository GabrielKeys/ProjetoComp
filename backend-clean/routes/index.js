// Routes - Responsabilidade: Definir rotas da aplicação
// Aplica SRP: Apenas definição de rotas

const express = require('express');
const router = express.Router();

// Controllers
const authController = require('../controllers/auth.controller');
const stationController = require('../controllers/station.controller');
const walletController = require('../controllers/wallet.controller');
const vehicleController = require('../controllers/vehicle.controller');
const reservationController = require('../controllers/reservation.controller');

// Middlewares
const { authenticateToken } = require('../middlewares/auth.middleware');
const { 
  validateRegister, 
  validateLogin, 
  validateVehicle, 
  validateReservation 
} = require('../middlewares/validation.middleware');

// Rotas de Autenticação
router.post('/auth/register', validateRegister, authController.register.bind(authController));
router.post('/auth/login', validateLogin, authController.login.bind(authController));
router.post('/auth/google', authController.loginWithGoogle.bind(authController));
router.get('/auth/me', authenticateToken, authController.getCurrentUser.bind(authController));

// Rotas de Estações (públicas)
router.get('/stations', stationController.getAllStations.bind(stationController));
router.get('/stations/:id', stationController.getStationById.bind(stationController));
router.post('/stations/sync', stationController.syncGoogleStations.bind(stationController));

// Rotas de Carteira (protegidas)
router.get('/wallet', authenticateToken, walletController.getWallet.bind(walletController));
router.post('/wallet/recharge', authenticateToken, walletController.recharge.bind(walletController));

// Rotas de Veículos (protegidas)
router.get('/vehicles', authenticateToken, vehicleController.getVehicles.bind(vehicleController));
router.get('/vehicles/:id', authenticateToken, vehicleController.getVehicleById.bind(vehicleController));
router.post('/vehicles', authenticateToken, validateVehicle, vehicleController.createVehicle.bind(vehicleController));
router.put('/vehicles/:id', authenticateToken, vehicleController.updateVehicle.bind(vehicleController));
router.delete('/vehicles/:id', authenticateToken, vehicleController.deleteVehicle.bind(vehicleController));

// Rotas de Reservas (protegidas)
router.get('/reservations', authenticateToken, reservationController.getReservations.bind(reservationController));
router.get('/reservations/:id', authenticateToken, reservationController.getReservationById.bind(reservationController));
router.post('/reservations', authenticateToken, validateReservation, reservationController.createReservation.bind(reservationController));
router.put('/reservations/:id/cancel', authenticateToken, reservationController.cancelReservation.bind(reservationController));

module.exports = router;


