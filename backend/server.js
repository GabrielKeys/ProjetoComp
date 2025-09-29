require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

// Importar configuração do banco
const db = require('./config/database');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROTAS DA API
// ============================================
// ============================================
// AUTENTICAÇÃO
// ============================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ success: false, error: 'Email e senha são obrigatórios' });
    }

    // Busca usuário por email
    const userRes = await db.query('SELECT id, nome, email, senha FROM usuarios WHERE LOWER(email) = LOWER($1)', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    const user = userRes.rows[0];

    // Se a senha no banco for hash, comparar com bcrypt; senão, comparar texto puro
    let senhaConfere = false;
    if (user.senha && user.senha.startsWith('$2a$')) {
      senhaConfere = await bcrypt.compare(senha, user.senha);
    } else {
      senhaConfere = (senha === user.senha);
    }

    if (!senhaConfere) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, nome: user.nome, email: user.email }
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// Login com Google: recebe credential (ID token), valida e emite nosso JWT
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body || {};
    if (!credential) {
      return res.status(400).json({ success: false, error: 'credential é obrigatório' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ success: false, error: 'GOOGLE_CLIENT_ID não configurado' });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    const email = payload.email;
    const nome = payload.name || 'Usuário Google';

    // Garante usuário no banco (upsert por email)
    const existing = await db.query('SELECT id, nome, email FROM usuarios WHERE LOWER(email) = LOWER($1)', [email]);
    let userId;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      // Atualiza nome se vazio
      if (!existing.rows[0].nome && nome) {
        await db.query('UPDATE usuarios SET nome = $1 WHERE id = $2', [nome, userId]);
      }
    } else {
      const created = await db.query(
        `INSERT INTO usuarios (nome, email, tipo) VALUES ($1, $2, 'usuario') RETURNING id`,
        [nome, email]
      );
      userId = created.rows[0].id;
    }

    const token = jwt.sign(
      { sub: userId, email },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );

    return res.json({ success: true, data: { token, user: { id: userId, nome, email } } });
  } catch (error) {
    console.error('Erro no auth/google:', error);
    return res.status(401).json({ success: false, error: 'Token Google inválido ou não verificado' });
  }
});


// Rota de teste
app.get('/', (req, res) => {
  res.json({
    message: 'VoltWay API está rodando!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Rota de health check
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await db.testConnection();
    const stats = await db.getStats();
    
    res.json({
      success: true,
      status: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// ============================================
// ROTAS DE USUÁRIOS
// ============================================

// GET /api/usuarios - Listar usuários (suporta filtro por email)
app.get('/api/usuarios', async (req, res) => {
  try {
    const { tipo, cidade, estado, email, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT id, nome, email, tipo, cidade, estado, criado_em FROM usuarios WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (email) {
      paramCount++;
      query += ` AND email = $${paramCount}`;
      params.push(email);
    }
    
    if (tipo) {
      paramCount++;
      query += ` AND tipo = $${paramCount}`;
      params.push(tipo);
    }
    
    if (cidade) {
      paramCount++;
      query += ` AND cidade ILIKE $${paramCount}`;
      params.push(`%${cidade}%`);
    }
    
    if (estado) {
      paramCount++;
      query += ` AND estado ILIKE $${paramCount}`;
      params.push(`%${estado}%`);
    }
    
    query += ` ORDER BY criado_em DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/usuarios/:id - Buscar usuário por ID
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT id, nome, email, tipo, cidade, estado, criado_em FROM usuarios WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/usuarios - Criar usuário
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nome, email, tipo = 'usuario', senha, cidade, estado } = req.body;
    
    // Validações básicas
    if (!nome || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nome e email são obrigatórios'
      });
    }
    
    const result = await db.query(
      `INSERT INTO usuarios (nome, email, tipo, senha, cidade, estado) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, nome, email, tipo, cidade, estado, criado_em`,
      [nome, email, tipo, senha, cidade, estado]
    );
    
    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({
        success: false,
        error: 'Email já está em uso'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
});

// ============================================
// ROTAS DE VEÍCULOS
// ============================================

// GET /api/veiculos - Listar veículos
app.get('/api/veiculos', async (req, res) => {
  try {
    const { usuario_id, modelo, ano, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT v.*, u.nome as usuario_nome 
      FROM veiculos v 
      JOIN usuarios u ON v.usuario_id = u.id 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    if (usuario_id) {
      paramCount++;
      query += ` AND v.usuario_id = $${paramCount}`;
      params.push(usuario_id);
    }
    
    if (modelo) {
      paramCount++;
      query += ` AND v.modelo ILIKE $${paramCount}`;
      params.push(`%${modelo}%`);
    }
    
    if (ano) {
      paramCount++;
      query += ` AND v.ano = $${paramCount}`;
      params.push(ano);
    }
    
    query += ` ORDER BY v.criado_em DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar veículos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================
// ROTAS DE ESTAÇÕES
// ============================================

// GET /api/estacoes - Listar estações
app.get('/api/estacoes', async (req, res) => {
  try {
    const { 
      cidade, 
      estado, 
      ativa = 'true', 
      potencia_min, 
      potencia_max, 
      preco_max,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = 'SELECT * FROM estacoes WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (cidade) {
      paramCount++;
      query += ` AND cidade ILIKE $${paramCount}`;
      params.push(`%${cidade}%`);
    }
    
    if (estado) {
      paramCount++;
      query += ` AND estado ILIKE $${paramCount}`;
      params.push(`%${estado}%`);
    }
    
    if (ativa !== 'all') {
      paramCount++;
      query += ` AND ativa = $${paramCount}`;
      params.push(ativa === 'true');
    }
    
    if (potencia_min) {
      paramCount++;
      query += ` AND potencia >= $${paramCount}`;
      params.push(potencia_min);
    }
    
    if (potencia_max) {
      paramCount++;
      query += ` AND potencia <= $${paramCount}`;
      params.push(potencia_max);
    }
    
    if (preco_max) {
      paramCount++;
      query += ` AND preco <= $${paramCount}`;
      params.push(preco_max);
    }
    
    query += ` ORDER BY nome LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar estações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================
// ROTAS DE RESERVAS
// ============================================

// GET /api/reservas - Listar reservas (suporta usuario_email)
app.get('/api/reservas', async (req, res) => {
  try {
    const { 
      usuario_id, 
      usuario_email,
      estacao_id, 
      veiculo_id, 
      status, 
      data_inicio, 
      data_fim,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = 'SELECT * FROM vw_reservas_completas WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (usuario_id) {
      paramCount++;
      query += ` AND usuario_id = $${paramCount}`;
      params.push(usuario_id);
    }
    
    if (usuario_email) {
      paramCount++;
      query += ` AND LOWER(usuario_email) = LOWER($${paramCount})`;
      params.push(usuario_email);
    }
    
    if (estacao_id) {
      paramCount++;
      query += ` AND estacao_id = $${paramCount}`;
      params.push(estacao_id);
    }
    
    if (veiculo_id) {
      paramCount++;
      query += ` AND veiculo_id = $${paramCount}`;
      params.push(veiculo_id);
    }
    
    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }
    
    if (data_inicio) {
      paramCount++;
      query += ` AND data >= $${paramCount}`;
      params.push(data_inicio);
    }
    
    if (data_fim) {
      paramCount++;
      query += ` AND data <= $${paramCount}`;
      params.push(data_fim);
    }
    
    query += ` ORDER BY data DESC, hora DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/reservas - Criar reserva (aceita ids OU emails/nomes e resolve automaticamente)
app.post('/api/reservas', async (req, res) => {
  try {
    let { usuario_id, estacao_id, veiculo_id, data, hora, observacoes, usuario_email, estacao_email, estacao_nome, veiculo } = req.body;
    
    // Validar campos essenciais
    if (!data || !hora) {
      return res.status(400).json({
        success: false,
        error: 'Data e hora são obrigatórios'
      });
    }
    
    // Resolver usuario_id via usuario_email, se necessário
    if (!usuario_id && usuario_email) {
      const u = await db.query('SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)', [usuario_email]);
      if (u.rows.length > 0) usuario_id = u.rows[0].id;
    }

    // Resolver estacao_id via estacao_email ou estacao_nome
    if (!estacao_id && (estacao_email || estacao_nome)) {
      if (estacao_email) {
        const e = await db.query('SELECT id FROM estacoes WHERE LOWER(email) = LOWER($1)', [estacao_email]);
        if (e.rows.length > 0) estacao_id = e.rows[0].id;
      }
      if (!estacao_id && estacao_nome) {
        const e2 = await db.query('SELECT id FROM estacoes WHERE LOWER(nome) = LOWER($1)', [estacao_nome]);
        if (e2.rows.length > 0) estacao_id = e2.rows[0].id;
      }
    }

    // Resolver veiculo_id: se não informado, tenta criar/usar um veículo básico do usuário
    if (!veiculo_id && usuario_id) {
      // Se veio objeto veiculo com placa/modelo, tenta achar por placa, senão cria
      if (veiculo && veiculo.placa) {
        const v = await db.query('SELECT id FROM veiculos WHERE usuario_id = $1 AND placa = $2', [usuario_id, veiculo.placa]);
        if (v.rows.length > 0) {
          veiculo_id = v.rows[0].id;
        } else {
          const created = await db.query(
            `INSERT INTO veiculos (usuario_id, modelo, ano, placa) VALUES ($1, $2, $3, $4) RETURNING id`,
            [usuario_id, veiculo.modelo || 'Desconhecido', veiculo.ano || null, veiculo.placa]
          );
          veiculo_id = created.rows[0].id;
        }
      } else {
        // pega qualquer veículo do usuário como default
        const v2 = await db.query('SELECT id FROM veiculos WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 1', [usuario_id]);
        if (v2.rows.length > 0) {
          veiculo_id = v2.rows[0].id;
        }
      }
    }

    if (!usuario_id || !estacao_id || !veiculo_id) {
      return res.status(400).json({
        success: false,
        error: 'Não foi possível resolver usuário, estação ou veículo. Informe IDs ou emails/nomes válidos.'
      });
    }
    
    const result = await db.query(
      `INSERT INTO reservas (usuario_id, estacao_id, veiculo_id, data, hora, observacoes) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [usuario_id, estacao_id, veiculo_id, data, hora, observacoes]
    );
    
    res.status(201).json({
      success: true,
      message: 'Reserva criada com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({
        success: false,
        error: 'Já existe uma reserva para este horário'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
});

// ============================================
// ROTAS DE ESTATÍSTICAS
// ============================================

// GET /api/stats/dashboard - Estatísticas gerais
app.get('/api/stats/dashboard', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios WHERE tipo = 'usuario') as total_usuarios,
        (SELECT COUNT(*) FROM veiculos) as total_veiculos,
        (SELECT COUNT(*) FROM estacoes WHERE ativa = true) as total_estacoes,
        (SELECT COUNT(*) FROM reservas) as total_reservas
    `);
    
    const statusStats = await db.query(`
      SELECT status, COUNT(*) as quantidade 
      FROM reservas 
      GROUP BY status
    `);
    
    const cidadeStats = await db.query(`
      SELECT cidade, COUNT(*) as quantidade 
      FROM estacoes 
      WHERE ativa = true 
      GROUP BY cidade 
      ORDER BY quantidade DESC 
      LIMIT 10
    `);
    
    const reservasPorStatus = {};
    statusStats.rows.forEach(row => {
      reservasPorStatus[row.status] = parseInt(row.quantidade);
    });
    
    res.json({
      success: true,
      data: {
        ...stats.rows[0],
        reservas_por_status: reservasPorStatus,
        estacoes_por_cidade: cidadeStats.rows
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================
// MIDDLEWARE DE ERRO 404
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    path: req.path,
    method: req.method
  });
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Testar conexão com o banco
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      console.error('❌ Falha na conexão com o banco de dados');
      process.exit(1);
    }
    
    // Verificar se as tabelas existem
    const tablesExist = await db.checkTables();
    if (!tablesExist) {
      console.warn('⚠️  Algumas tabelas podem estar faltando');
    }
    
    // Mostrar estatísticas do banco
    await db.getStats();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor VoltWay rodando na porta ${PORT}`);
      console.log(`📊 API disponível em: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📚 Documentação: docs/API.md`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await db.closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await db.closePool();
  process.exit(0);
});

// Iniciar servidor
startServer();