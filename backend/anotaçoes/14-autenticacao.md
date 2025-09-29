# 🔐 Fase 14: Sistema de Autenticação JWT

Este arquivo explica como implementar autenticação JWT no sistema VoltWay.

## 📋 O que o Sistema de Autenticação faz

O sistema de autenticação permite:
- **Registro** de novos usuários
- **Login** com email e senha
- **Geração** de tokens JWT
- **Validação** de tokens em rotas protegidas
- **Refresh** de tokens expirados
- **Logout** e invalidação de tokens

## 🔑 Conceitos de JWT

### **O que é JWT:**
- **JSON Web Token** - padrão para autenticação
- **Stateless** - não precisa armazenar no servidor
- **Self-contained** - contém todas as informações necessárias
- **Seguro** - assinado digitalmente

### **Estrutura do JWT:**
```
header.payload.signature
```

### **Payload típico:**
```json
{
  "sub": "user_id",
  "email": "user@email.com",
  "tipo": "usuario",
  "iat": 1640995200,
  "exp": 1641081600
}
```

## 🔧 Implementação Básica

### **1. Middleware de Autenticação**
```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acesso não fornecido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }
    
    req.user = user;
    next();
  });
};
```

### **2. Função de Geração de Token**
```javascript
const generateToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    tipo: user.tipo,
    nome: user.nome
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'voltway-api',
    audience: 'voltway-client'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};
```

### **3. Função de Hash de Senha**
```javascript
const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

## 🔍 Endpoint: POST /api/auth/register

### **O que faz:**
Registra um novo usuário no sistema.

### **Validações:**
- **Nome obrigatório** - não pode estar vazio
- **Email obrigatório** - formato válido
- **Email único** - não pode duplicar
- **Senha obrigatória** - mínimo 6 caracteres
- **Tipo válido** - usuario ou estacao

### **Como funciona:**
1. **Valida dados** de entrada
2. **Verifica email único**
3. **Hash da senha** com bcrypt
4. **Insere usuário** no banco
5. **Gera token JWT**
6. **Retorna token** e dados do usuário

### **Exemplo de uso:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@email.com",
    "senha": "senha123",
    "tipo": "usuario",
    "cidade": "São Paulo",
    "estado": "SP"
  }'
```

### **Resposta esperada:**
```json
{
  "success": true,
  "message": "Usuário registrado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@email.com",
      "tipo": "usuario",
      "cidade": "São Paulo",
      "estado": "SP"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 🔍 Endpoint: POST /api/auth/login

### **O que faz:**
Autentica um usuário existente.

### **Validações:**
- **Email obrigatório** - formato válido
- **Senha obrigatória** - não pode estar vazia
- **Usuário existe** - email deve estar cadastrado
- **Senha correta** - deve coincidir com hash

### **Como funciona:**
1. **Valida dados** de entrada
2. **Busca usuário** por email
3. **Verifica senha** com bcrypt
4. **Gera token JWT**
5. **Retorna token** e dados do usuário

### **Exemplo de uso:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "senha": "senha123"
  }'
```

### **Resposta esperada:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@email.com",
      "tipo": "usuario"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 🔍 Endpoint: GET /api/auth/me

### **O que faz:**
Retorna dados do usuário autenticado.

### **Como funciona:**
1. **Valida token** JWT
2. **Busca dados** do usuário no banco
3. **Retorna dados** atualizados

### **Exemplo de uso:**
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🔍 Endpoint: POST /api/auth/refresh

### **O que faz:**
Renova token JWT expirado.

### **Como funciona:**
1. **Valida token** atual
2. **Verifica se** não está muito expirado
3. **Gera novo token** com dados atualizados
4. **Retorna novo token**

## 🔍 Endpoint: POST /api/auth/logout

### **O que faz:**
Invalida token JWT (logout).

### **Como funciona:**
1. **Valida token** atual
2. **Adiciona à blacklist** (se implementada)
3. **Retorna confirmação**

## 🛡️ Proteção de Rotas

### **Aplicar middleware:**
```javascript
// Rota protegida
app.get('/api/usuarios', authenticateToken, (req, res) => {
  // req.user contém dados do usuário autenticado
  res.json({
    success: true,
    data: req.user
  });
});

// Rota protegida com verificação de tipo
app.get('/api/admin/stats', authenticateToken, (req, res) => {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado'
    });
  }
  // Lógica para admin
});
```

### **Middleware de autorização:**
```javascript
const authorize = (allowedTypes) => {
  return (req, res, next) => {
    if (!allowedTypes.includes(req.user.tipo)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado para este tipo de usuário'
      });
    }
    next();
  };
};

// Usar em rotas
app.get('/api/estacoes', authenticateToken, authorize(['usuario', 'estacao']), (req, res) => {
  // Só usuários e estações podem acessar
});
```

## 🔐 Validações de Segurança

### **Validação de Email:**
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({
    success: false,
    error: 'Email inválido'
  });
}
```

### **Validação de Senha:**
```javascript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
if (!passwordRegex.test(senha)) {
  return res.status(400).json({
    success: false,
    error: 'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número'
  });
}
```

### **Rate Limiting para Login:**
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas
  message: {
    success: false,
    error: 'Muitas tentativas de login, tente novamente em 15 minutos'
  }
});

app.post('/api/auth/login', loginLimiter, (req, res) => {
  // Lógica de login
});
```

## 🔄 Refresh Token (Opcional)

### **Implementação básica:**
```javascript
const generateRefreshToken = (user) => {
  const payload = {
    sub: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });
};

// Endpoint para refresh
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Refresh token inválido'
      });
    }
    
    // Gerar novo access token
    const newToken = generateToken({ id: decoded.sub });
    res.json({
      success: true,
      data: { token: newToken }
    });
  });
});
```

## 🚨 Tratamento de Erros

### **Erros específicos:**
- **400:** Dados inválidos
- **401:** Não autenticado
- **403:** Token inválido ou expirado
- **409:** Email já está em uso
- **429:** Muitas tentativas de login
- **500:** Erro interno do servidor

### **Middleware de erro para JWT:**
```javascript
app.use((err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    return res.status(403).json({
      success: false,
      error: 'Token inválido'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(403).json({
      success: false,
      error: 'Token expirado'
    });
  }
  
  next(err);
});
```

## ⚡ Otimizações

### **Blacklist de tokens:**
```javascript
// Para logout seguro
const tokenBlacklist = new Set();

const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

// Adicionar à blacklist no logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];
  tokenBlacklist.add(token);
  
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});
```

### **Cache de usuários:**
```javascript
const userCache = new Map();

const getCachedUser = async (id) => {
  if (userCache.has(id)) {
    return userCache.get(id);
  }
  
  const user = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  if (user.rows.length > 0) {
    userCache.set(id, user.rows[0]);
    // Cache por 5 minutos
    setTimeout(() => userCache.delete(id), 5 * 60 * 1000);
  }
  
  return user.rows[0];
};
```

## 🧪 Testes da API

### **Teste de registro:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste User",
    "email": "teste@email.com",
    "senha": "senha123",
    "tipo": "usuario"
  }'
```

### **Teste de login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@email.com",
    "senha": "senha123"
  }'
```

### **Teste de rota protegida:**
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### **Teste de validação:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "email-invalido",
    "senha": "123"
  }'
```

## 🎯 Próximo Passo

Após implementar a autenticação, prossiga para:
**[15-validacoes.md](./15-validacoes.md)** - Validações e tratamento de erros

---

**Tempo estimado:** 25-30 minutos  
**Dificuldade:** Intermediário  
**Próximo:** Validações e tratamento de erros
