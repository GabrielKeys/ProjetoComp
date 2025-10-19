const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em 15 minutos.'
  }
});

app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'VoltWay API está funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rotas básicas para teste
app.get('/api/stations', (req, res) => {
  res.json({
    success: true,
    data: {
      stations: [
        {
          id: '1',
          name: 'Estação Teste',
          address: 'Rua Teste, 123',
          city: 'São Paulo',
          state: 'SP',
          latitude: -23.5505,
          longitude: -46.6333,
          powerKw: 150,
          pricePerKwh: 0.85
        }
      ]
    }
  });
});

app.get('/api/wallet', (req, res) => {
  res.json({
    success: true,
    data: {
      wallet: {
        id: '1',
        userId: '1',
        balance: 100.00,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  });
});

app.get('/api/vehicles', (req, res) => {
  res.json({
    success: true,
    data: {
      vehicles: [
        {
          id: '1',
          userId: '1',
          model: 'Tesla Model 3',
          year: 2022,
          plate: 'ABC-1234',
          batteryCapacity: 75.0,
          chargingPower: 11.0
        }
      ]
    }
  });
});

app.get('/api/reservations', (req, res) => {
  res.json({
    success: true,
    data: {
      reservations: [
        {
          id: '1',
          userId: '1',
          stationId: '1',
          reservationDate: '2024-01-15',
          startTime: '10:00:00',
          endTime: '12:00:00',
          status: 'confirmed',
          totalCost: 10.00
        }
      ]
    }
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor VoltWay rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});

module.exports = app;
