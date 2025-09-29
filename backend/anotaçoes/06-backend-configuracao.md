# ⚙️ Fase 6: Configuração do Backend Node.js

Agora vamos configurar o servidor Express.js e a conexão com o banco de dados PostgreSQL.

## 📋 Pré-requisitos

- ✅ Node.js instalado
- ✅ Dependências instaladas (express, pg, cors, dotenv)
- ✅ Banco de dados configurado com dados de teste
- ✅ Arquivo `.env` configurado

## 🏗️ Estrutura do Backend

Vamos criar a seguinte estrutura:

```
backend/
├── config/
│   └── database.js          # Configuração do banco
├── server.js                # Servidor principal
├── package.json             # Dependências
└── .env                     # Variáveis de ambiente
```

---

## 📝 Passo 1: Criar Configuração do Banco

### **1.1 Criar arquivo config/database.js**
Crie o arquivo `config/database.js` com o seguinte conteúdo:

```javascript
// ============================================
// VoltWay - Configuração do Banco de Dados
// ============================================

require('dotenv').config();
const { Pool } = require('pg');

// Configuração da conexão com PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'voltway_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'voltway',
  password: process.env.DB_PASSWORD || 'voltway123',
  port: process.env.DB_PORT || 5432,
  
  // Configurações de conexão
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000, // Tempo limite para conexões ociosas
  connectionTimeoutMillis: 2000, // Tempo limite para estabelecer conexão
});

// Evento de conexão bem-sucedida
pool.on('connect', () => {
  console.log('✅ Conectado ao banco de dados PostgreSQL');
});

// Evento de erro na conexão
pool.on('error', (err) => {
  console.error('❌ Erro na conexão com o banco de dados:', err);
  process.exit(-1);
});

// Função para testar a conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('🔍 Teste de conexão realizado:', result.rows[0].current_time);
    console.log('📊 Versão do PostgreSQL:', result.rows[0].postgres_version.split(' ')[0]);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Falha no teste de conexão:', err.message);
    return false;
  }
};

// Função para executar queries com tratamento de erro
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📝 Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('❌ Erro na query:', { text, error: err.message });
    throw err;
  }
};

// Função para executar transações
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Função para verificar se as tabelas existem
const checkTables = async () => {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const tables = result.rows.map(row => row.table_name);
    const expectedTables = ['usuarios', 'veiculos', 'estacoes', 'reservas'];
    const missingTables = expectedTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      console.warn('⚠️  Tabelas não encontradas:', missingTables);
      console.log('💡 Execute o script schema.sql para criar as tabelas');
      return false;
    } else {
      console.log('✅ Todas as tabelas estão presentes:', tables);
      return true;
    }
  } catch (err) {
    console.error('❌ Erro ao verificar tabelas:', err.message);
    return false;
  }
};

// Função para obter estatísticas do banco
const getStats = async () => {
  try {
    const stats = await query(`
      SELECT 
        'usuarios' as tabela, COUNT(*) as registros FROM usuarios
      UNION ALL
      SELECT 
        'veiculos' as tabela, COUNT(*) as registros FROM veiculos
      UNION ALL
      SELECT 
        'estacoes' as tabela, COUNT(*) as registros FROM estacoes
      UNION ALL
      SELECT 
        'reservas' as tabela, COUNT(*) as registros FROM reservas
      ORDER BY tabela;
    `);
    
    console.log('📊 Estatísticas do banco:');
    stats.rows.forEach(row => {
      console.log(`   ${row.tabela}: ${row.registros} registros`);
    });
    
    return stats.rows;
  } catch (err) {
    console.error('❌ Erro ao obter estatísticas:', err.message);
    return [];
  }
};

// Função para fechar todas as conexões
const closePool = async () => {
  try {
    await pool.end();
    console.log('🔌 Pool de conexões fechado');
  } catch (err) {
    console.error('❌ Erro ao fechar pool:', err.message);
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  checkTables,
  getStats,
  closePool
};
```

---

## 🚀 Passo 2: Criar Servidor Principal

### **2.1 Criar arquivo server.js**
Crie o arquivo `server.js` na raiz da pasta backend:

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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

// GET /api/usuarios - Listar usuários
app.get('/api/usuarios', async (req, res) => {
  try {
    const { tipo, cidade, estado, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT id, nome, email, tipo, cidade, estado, criado_em FROM usuarios WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
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
```

---

## 🧪 Passo 3: Testar o Servidor

### **3.1 Iniciar o servidor**
```bash
# Iniciar o servidor
npm start
```

**Resultado esperado:**
```
✅ Conectado ao banco de dados PostgreSQL
🔍 Teste de conexão realizado: 2024-09-29T10:30:00.000Z
📊 Versão do PostgreSQL: PostgreSQL
✅ Todas as tabelas estão presentes: [ 'estacoes', 'reservas', 'usuarios', 'veiculos' ]
📊 Estatísticas do banco:
   estacoes: 11 registros
   reservas: 12 registros
   usuarios: 8 registros
   veiculos: 7 registros
🚀 Servidor VoltWay rodando na porta 3000
📊 API disponível em: http://localhost:3000
🏥 Health check: http://localhost:3000/api/health
```

### **3.2 Testar endpoints**
```bash
# Testar rota principal (em outro terminal)
curl http://localhost:3000
```

**Resultado esperado:**
```json
{
  "message": "VoltWay API está rodando!",
  "version": "1.0.0",
  "timestamp": "2024-09-29T10:30:00.000Z"
}
```

### **3.3 Testar health check**
```bash
# Testar health check
curl http://localhost:3000/api/health
```

**Resultado esperado:**
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-09-29T10:30:00.000Z",
  "stats": [
    { "tabela": "estacoes", "registros": "11" },
    { "tabela": "reservas", "registros": "12" },
    { "tabela": "usuarios", "registros": "8" },
    { "tabela": "veiculos", "registros": "7" }
  ]
}
```

### **3.4 Testar endpoint de usuários**
```bash
# Listar usuários
curl http://localhost:3000/api/usuarios
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "João Silva",
      "email": "joao.silva@email.com",
      "tipo": "usuario",
      "cidade": "São Paulo",
      "estado": "SP",
      "criado_em": "2024-09-29T10:30:00.000Z"
    },
    ...
  ],
  "total": 8,
  "limit": 50,
  "offset": 0
}
```

---

## 🔧 Passo 4: Configurar Scripts de Desenvolvimento

### **4.1 Adicionar script de desenvolvimento**
No `package.json`, adicione:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

### **4.2 Testar modo desenvolvimento**
```bash
# Iniciar em modo desenvolvimento (com auto-reload)
npm run dev
```

---

## ✅ Verificação Final

### **Checklist de Funcionamento:**
- [ ] Servidor inicia sem erros
- [ ] Conexão com banco estabelecida
- [ ] Health check retorna status "healthy"
- [ ] Endpoint de usuários retorna dados
- [ ] Logs aparecem no console
- [ ] Servidor responde na porta 3000

### **Teste de Performance:**
```bash
# Testar múltiplas requisições
for i in {1..5}; do curl -s http://localhost:3000/api/health | jq .status; done
```

---

## 🚨 Problemas Comuns

### **Erro: "Cannot find module './config/database'"**
```bash
# Solução: Verificar se o arquivo existe
ls -la config/database.js
```

### **Erro: "ECONNREFUSED"**
```bash
# Solução: Verificar se PostgreSQL está rodando
Get-Service | Where-Object {$_.Name -like "*postgres*"}
```

### **Erro: "authentication failed"**
```bash
# Solução: Verificar credenciais no .env
cat .env | grep DB_
```

### **Erro: "port 3000 already in use"**
```bash
# Solução: Mudar porta ou matar processo
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 🎯 Próximo Passo

Após completar a configuração do backend, prossiga para:
**[07-backend-conexao-db.md](./07-backend-conexao-db.md)** - Detalhes da conexão com banco

---

**Tempo estimado:** 20-30 minutos  
**Dificuldade:** Intermediário  
**Próximo:** Detalhes da conexão com banco
