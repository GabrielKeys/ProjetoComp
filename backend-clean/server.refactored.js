// Server Refactored - Aplicando SOLID e Arquitetura em Camadas
// Responsabilidade: Configuração do servidor Express

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./db');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT || 3000;


// ROTA: Toggle favorito (adicionar / remover)
app.post("/favorites/toggle", async (req, res) => {
  try {
    const { userEmail, stationEmail } = req.body;
    if (!userEmail || !stationEmail) return res.status(400).json({ error: "userEmail e stationEmail são obrigatórios" });

    // tenta encontrar favorito existente
    const { data: existing, error: selErr } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_email", userEmail)
      .eq("station_email", stationEmail)
      .maybeSingle();

    if (selErr) throw selErr;

    if (existing) {
      // remove favorito
      const { error: delErr } = await supabase
        .from("favorites")
        .delete()
        .eq("id", existing.id);
      if (delErr) throw delErr;
      return res.json({ success: true, action: "removed" });
    } else {
      // insere favorito
      const payload = { user_email: userEmail, station_email: stationEmail, created_at: new Date().toISOString() };
      const { data: inserted, error: insErr } = await supabase
        .from("favorites")
        .insert([payload])
        .select()
        .single();
      if (insErr) throw insErr;
      return res.json({ success: true, action: "added", favorite: inserted });
    }
  } catch (err) {
    console.error("❌ Erro em /favorites/toggle:", err);
    res.status(500).json({ error: err.message || "Erro interno" });
  }
});

// ...existing code...

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

// CORS - Permitir todas as origens em desenvolvimento (incluindo file://)
const corsOptions = {
  origin: function (origin, callback) {
    // Em desenvolvimento, permitir todas as origens (incluindo file:// e null)
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      return callback(null, true);
    }
    
    // Em produção, verificar origens permitidas
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:8080',
      'http://localhost:3000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000'
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
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

// Rotas da API
app.use('/api', routes);

// Middleware para rotas não encontradas
app.use(notFoundHandler);

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor VoltWay rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  
  // Testar conexão com banco
  await testConnection();
});

module.exports = app;


