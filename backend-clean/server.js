const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { query, testConnection } = require('./db');

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
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Lista de origens permitidas
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:8080',
      'http://localhost:3000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000',
      'file://' // Para aplicações locais
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    success: true,
    message: 'VoltWay API está funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// ================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ================================
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'voltway-secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token inválido' });
  }
};

// ================================
// ROTAS DE AUTENTICAÇÃO
// ================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }

    // Verificar se email já existe
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email já cadastrado' });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário
    const userResult = await query(
      'INSERT INTO users (full_name, email, password_hash, phone) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, phone',
      [full_name, email, passwordHash, phone || null]
    );

    const user = userResult.rows[0];

    // Criar carteira
    await query('INSERT INTO wallets (user_id, balance) VALUES ($1, $2)', [user.id, 0.00]);

    // Gerar token
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'voltway-secret', { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ success: false, message: 'Erro ao registrar usuário' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const userResult = await query('SELECT id, full_name, email, password_hash, phone FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    const user = userResult.rows[0];

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'voltway-secret', { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, message: 'Erro ao fazer login' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await query('SELECT id, full_name, email, phone, photo_url FROM users WHERE id = $1', [req.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    res.json({
      success: true,
      data: { user: userResult.rows[0] }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar usuário' });
  }
});

// ================================
// ROTAS DE ESTAÇÕES
// ================================
app.get('/api/stations', async (req, res) => {
  try {
    const { city, latitude, longitude, radius, limit } = req.query;
    
    let stationsQuery = 'SELECT * FROM stations WHERE is_active = true';
    const params = [];
    let paramCount = 1;

    if (city) {
      stationsQuery += ` AND city = $${paramCount}`;
      params.push(city);
      paramCount++;
    }

    stationsQuery += ' ORDER BY name LIMIT $' + paramCount;
    params.push(parseInt(limit) || 100);

    const result = await query(stationsQuery, params);
    
    const stations = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      powerKw: parseFloat(row.power_kw),
      pricePerKwh: parseFloat(row.price_per_kwh),
      isActive: row.is_active
    }));

    res.json({
      success: true,
      data: { stations }
    });
  } catch (error) {
    console.error('Erro ao buscar estações:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar estações' });
  }
});

app.get('/api/stations/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM stations WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Estação não encontrada' });
    }

    const station = result.rows[0];
    res.json({
      success: true,
      data: {
        station: {
          id: station.id,
          name: station.name,
          address: station.address,
          city: station.city,
          state: station.state,
          latitude: parseFloat(station.latitude),
          longitude: parseFloat(station.longitude),
          powerKw: parseFloat(station.power_kw),
          pricePerKwh: parseFloat(station.price_per_kwh)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estação:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar estação' });
  }
});

// Rota para sincronizar estações do Google Places
app.post('/api/stations/sync', async (req, res) => {
  try {
    const { stations } = req.body;
    
    if (!stations || !Array.isArray(stations)) {
      return res.status(400).json({ success: false, message: 'Lista de estações é obrigatória' });
    }

    const results = {
      inserted: 0,
      skipped: 0,
      errors: []
    };

    // Função para extrair cidade e estado do endereço
    const parseAddress = (address) => {
      const parts = address.split(',');
      if (parts.length >= 2) {
        const cityState = parts[parts.length - 1].trim();
        const cityStateParts = cityState.split(' - ');
        return {
          city: cityStateParts[0] || 'São Paulo',
          state: cityStateParts[1] || 'SP'
        };
      }
      return { city: 'São Paulo', state: 'SP' };
    };

    // Função para gerar valores realistas
    const generateValues = () => {
      const powerKw = Math.floor(Math.random() * 150) + 50; // 50-200kW
      const pricePerKwh = (Math.random() * 0.5 + 0.7).toFixed(2); // R$ 0,70 - R$ 1,20
      return {
        powerKw: parseFloat(powerKw.toFixed(1)),
        pricePerKwh: parseFloat(pricePerKwh)
      };
    };

    for (const station of stations) {
      try {
        if (!station.name || !station.latitude || !station.longitude) {
          results.errors.push(`Estação inválida: ${JSON.stringify(station)}`);
          continue;
        }

        // Verificar se já existe (por coordenadas próximas - 100m de tolerância)
        const existing = await query(
          `SELECT id FROM stations 
           WHERE (ABS(latitude - $1) < 0.001 AND ABS(longitude - $2) < 0.001)
           OR name = $3`,
          [station.latitude, station.longitude, station.name]
        );

        if (existing.rows.length > 0) {
          results.skipped++;
          continue;
        }

        // Parse do endereço
        const address = station.address || station.formattedAddress || '';
        const { city, state } = parseAddress(address);

        // Gerar valores realistas
        const { powerKw, pricePerKwh } = generateValues();

        // Inserir estação
        await query(
          `INSERT INTO stations (name, address, city, state, latitude, longitude, power_kw, price_per_kwh, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            station.name,
            address,
            city,
            state,
            station.latitude,
            station.longitude,
            powerKw,
            pricePerKwh,
            true
          ]
        );

        results.inserted++;
      } catch (error) {
        console.error(`Erro ao processar estação ${station.name}:`, error);
        results.errors.push(`Erro ao inserir ${station.name}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      data: {
        message: `Sincronização concluída: ${results.inserted} inseridas, ${results.skipped} ignoradas`,
        ...results
      }
    });
  } catch (error) {
    console.error('Erro ao sincronizar estações:', error);
    res.status(500).json({ success: false, message: 'Erro ao sincronizar estações' });
  }
});

// ================================
// ROTAS DE CARTEIRA
// ================================
app.get('/api/wallet', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM wallets WHERE user_id = $1', [req.userId]);
    
    if (result.rows.length === 0) {
      // Criar carteira se não existir
      await query('INSERT INTO wallets (user_id, balance) VALUES ($1, $2)', [req.userId, 0.00]);
      const newResult = await query('SELECT * FROM wallets WHERE user_id = $1', [req.userId]);
      const wallet = newResult.rows[0];
      return res.json({
        success: true,
        data: {
          wallet: {
            id: wallet.id,
            userId: wallet.user_id,
            balance: parseFloat(wallet.balance),
            createdAt: wallet.created_at,
            updatedAt: wallet.updated_at
          }
        }
      });
    }

    const wallet = result.rows[0];
    res.json({
      success: true,
      data: {
        wallet: {
          id: wallet.id,
          userId: wallet.user_id,
          balance: parseFloat(wallet.balance),
          createdAt: wallet.created_at,
          updatedAt: wallet.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar carteira:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar carteira' });
  }
});

// ================================
// ROTAS DE VEÍCULOS
// ================================
app.get('/api/vehicles', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM vehicles WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    
    const vehicles = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      model: row.model,
      year: row.year,
      plate: row.plate,
      batteryCapacity: parseFloat(row.battery_capacity),
      chargingPower: parseFloat(row.charging_power),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: { vehicles }
    });
  } catch (error) {
    console.error('Erro ao buscar veículos:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar veículos' });
  }
});

app.post('/api/vehicles', authenticateToken, async (req, res) => {
  try {
    const { model, year, plate, batteryCapacity, chargingPower } = req.body;

    if (!model || !year || !plate || !batteryCapacity || !chargingPower) {
      return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }

    const result = await query(
      'INSERT INTO vehicles (user_id, model, year, plate, battery_capacity, charging_power) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.userId, model, year, plate, batteryCapacity, chargingPower]
    );

    const vehicle = result.rows[0];
    res.json({
      success: true,
      data: {
        vehicle: {
          id: vehicle.id,
          userId: vehicle.user_id,
          model: vehicle.model,
          year: vehicle.year,
          plate: vehicle.plate,
          batteryCapacity: parseFloat(vehicle.battery_capacity),
          chargingPower: parseFloat(vehicle.charging_power)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao criar veículo:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar veículo' });
  }
});

// ================================
// ROTAS DE RESERVAS
// ================================
app.get('/api/reservations', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let queryText = 'SELECT * FROM reservations WHERE user_id = $1';
    const params = [req.userId];
    let paramCount = 2;

    if (status) {
      queryText += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);
    
    const reservations = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      stationId: row.station_id,
      reservationDate: row.reservation_date,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      totalCost: parseFloat(row.total_cost),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: { reservations }
    });
  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar reservas' });
  }
});

app.post('/api/reservations', authenticateToken, async (req, res) => {
  try {
    const { stationId, reservationDate, startTime, endTime } = req.body;

    if (!stationId || !reservationDate || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }

    // Verificar se estação existe
    const stationResult = await query('SELECT * FROM stations WHERE id = $1', [stationId]);
    if (stationResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Estação não encontrada' });
    }

    // Verificar saldo na carteira
    const walletResult = await query('SELECT balance FROM wallets WHERE user_id = $1', [req.userId]);
    if (walletResult.rows.length === 0 || parseFloat(walletResult.rows[0].balance) < 10.00) {
      return res.status(400).json({ success: false, message: 'Saldo insuficiente' });
    }

    // Criar reserva
    const reservationResult = await query(
      'INSERT INTO reservations (user_id, station_id, reservation_date, start_time, end_time, status, total_cost) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.userId, stationId, reservationDate, startTime, endTime, 'confirmed', 10.00]
    );

    // Debitar da carteira
    await query('UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [10.00, req.userId]);

    const reservation = reservationResult.rows[0];
    res.json({
      success: true,
      data: {
        reservation: {
          id: reservation.id,
          userId: reservation.user_id,
          stationId: reservation.station_id,
          reservationDate: reservation.reservation_date,
          startTime: reservation.start_time,
          endTime: reservation.end_time,
          status: reservation.status,
          totalCost: parseFloat(reservation.total_cost)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar reserva' });
  }
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
app.listen(PORT, async () => {
  console.log(`🚀 Servidor VoltWay rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  
  // Testar conexão com banco
  await testConnection();
});

module.exports = app;
