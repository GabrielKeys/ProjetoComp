const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Reservation = require('../models/Reservation');
const Station = require('../models/Station');
const Vehicle = require('../models/Vehicle');
const Wallet = require('../models/Wallet');
const router = express.Router();

// GET /api/reservations - Buscar reservas do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    
    let reservations = await Reservation.findByUserId(req.user.id, parseInt(limit), parseInt(offset));
    
    if (status) {
      reservations = reservations.filter(r => r.status === status);
    }

    res.json({
      success: true,
      data: {
        reservations: reservations.map(r => r.toJSON())
      }
    });

  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/reservations/:id - Buscar reserva por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    // Verificar se o usuário tem acesso à reserva
    if (reservation.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    res.json({
      success: true,
      data: {
        reservation: reservation.toJSON()
      }
    });

  } catch (error) {
    console.error('Erro ao buscar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/reservations - Criar nova reserva
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      stationId,
      vehicleId,
      reservationDate,
      startTime,
      endTime,
      notes
    } = req.body;

    // Validações básicas
    if (!stationId || !reservationDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Estação, data, horário de início e fim são obrigatórios'
      });
    }

    // Verificar se a estação existe
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Estação não encontrada'
      });
    }

    // Verificar se o veículo pertence ao usuário (se fornecido)
    if (vehicleId) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle || vehicle.userId !== req.user.id) {
        return res.status(404).json({
          success: false,
          message: 'Veículo não encontrado ou não pertence ao usuário'
        });
      }
    }

    // Verificar conflitos de horário
    const hasConflict = await Reservation.checkTimeConflict(
      stationId, reservationDate, startTime, endTime
    );

    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'Já existe uma reserva neste horário'
      });
    }

    // Calcular custo da reserva (R$ 10,00 fixo)
    const reservationCost = 10.00;

    // Verificar saldo da carteira
    const wallet = await Wallet.findByUserId(req.user.id);
    if (!wallet || !wallet.hasEnoughBalance(reservationCost)) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente para realizar a reserva'
      });
    }

    // Criar reserva
    const reservation = await Reservation.create({
      userId: req.user.id,
      stationId,
      vehicleId,
      reservationDate,
      startTime,
      endTime,
      totalCost: reservationCost,
      notes
    });

    // Cobrar valor da reserva
    await wallet.subtractBalance(reservationCost);
    const paymentTransaction = await wallet.addTransaction({
      amount: -reservationCost,
      type: 'reserva',
      description: `Reserva na estação ${station.name}`,
      status: 'completed',
      referenceId: reservation.id
    });

    // Atualizar reserva com ID da transação
    await reservation.updateStatus('confirmed', {
      paymentTransactionId: paymentTransaction.id
    });

    res.status(201).json({
      success: true,
      message: 'Reserva criada com sucesso',
      data: {
        reservation: reservation.toJSON(),
        paymentTransaction
      }
    });

  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    
    if (error.message === 'Saldo insuficiente') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/reservations/:id/cancel - Cancelar reserva
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    // Verificar se o usuário tem acesso à reserva
    if (reservation.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Verificar se pode cancelar
    if (['completed', 'cancelled'].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: 'Esta reserva não pode ser cancelada'
      });
    }

    // Cancelar reserva
    await reservation.cancel();

    // Estornar pagamento se a reserva foi paga
    if (reservation.paymentTransactionId) {
      const wallet = await Wallet.findByUserId(req.user.id);
      if (wallet) {
        await wallet.addBalance(reservation.totalCost);
        await wallet.addTransaction({
          amount: reservation.totalCost,
          type: 'estorno',
          description: `Estorno - Cancelamento de reserva`,
          status: 'completed',
          referenceId: reservation.paymentTransactionId
        });
      }
    }

    res.json({
      success: true,
      message: 'Reserva cancelada com sucesso',
      data: {
        reservation: reservation.toJSON()
      }
    });

  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/reservations/:id/start - Iniciar carregamento
router.put('/:id/start', authenticateToken, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    // Verificar se o usuário tem acesso à reserva
    if (reservation.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    if (reservation.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Apenas reservas confirmadas podem iniciar carregamento'
      });
    }

    await reservation.startCharging();

    res.json({
      success: true,
      message: 'Carregamento iniciado',
      data: {
        reservation: reservation.toJSON()
      }
    });

  } catch (error) {
    console.error('Erro ao iniciar carregamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/reservations/:id/complete - Finalizar carregamento
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { energyConsumed } = req.body;
    
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    // Verificar se o usuário tem acesso à reserva
    if (reservation.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    if (reservation.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Apenas carregamentos ativos podem ser finalizados'
      });
    }

    if (!energyConsumed || energyConsumed <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Energia consumida é obrigatória'
      });
    }

    // Calcular custo do carregamento
    const station = await Station.findById(reservation.stationId);
    const energyCost = energyConsumed * (station.pricePerKwh || 1.00);
    
    // Verificar saldo para cobrança adicional
    const wallet = await Wallet.findByUserId(req.user.id);
    if (energyCost > 0 && (!wallet || !wallet.hasEnoughBalance(energyCost))) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente para finalizar carregamento'
      });
    }

    // Cobrar energia consumida
    let paymentTransaction = null;
    if (energyCost > 0) {
      await wallet.subtractBalance(energyCost);
      paymentTransaction = await wallet.addTransaction({
        amount: -energyCost,
        type: 'carregamento',
        description: `Carregamento: ${energyConsumed}kWh`,
        status: 'completed',
        referenceId: reservation.id
      });
    }

    // Finalizar carregamento
    await reservation.completeCharging(energyConsumed, paymentTransaction?.id);

    res.json({
      success: true,
      message: 'Carregamento finalizado',
      data: {
        reservation: reservation.toJSON(),
        paymentTransaction: paymentTransaction
      }
    });

  } catch (error) {
    console.error('Erro ao finalizar carregamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;