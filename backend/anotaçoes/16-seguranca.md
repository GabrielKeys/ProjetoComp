# 🛡️ Fase 16: Implementação de Segurança

Este arquivo explica como implementar medidas de segurança no sistema VoltWay.

## 📋 O que a Segurança faz

As medidas de segurança protegem:
- **Dados sensíveis** dos usuários
- **Sistema** contra ataques
- **Comunicação** entre cliente e servidor
- **Recursos** contra acesso não autorizado
- **Integridade** dos dados

## 🔐 Medidas de Segurança Implementadas

### **1. Headers de Segurança (Helmet)**
- **X-Frame-Options** - Previne clickjacking
- **X-Content-Type-Options** - Previne MIME sniffing
- **X-XSS-Protection** - Proteção contra XSS
- **Strict-Transport-Security** - Força HTTPS
- **Content-Security-Policy** - Política de conteúdo

### **2. Rate Limiting**
- **Limite de requisições** por IP
- **Proteção contra** ataques de força bruta
- **Diferentes limites** para diferentes endpoints

### **3. Validação e Sanitização**
- **Validação de entrada** rigorosa
- **Sanitização** de dados
- **Prevenção** de SQL injection

### **4. Autenticação e Autorização**
- **JWT** para autenticação
- **Hash de senhas** com bcrypt
- **Controle de acesso** baseado em roles

## 🔧 Configuração do Helmet

### **Configuração básica:**
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### **Headers de segurança:**
```javascript
app.use((req, res, next) => {
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevenir MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Proteção XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Forçar HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Política de referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});
```

## 🔧 Rate Limiting

### **Configuração básica:**
```javascript
const rateLimit = require('express-rate-limit');

// Rate limiting geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: {
    success: false,
    error: 'Muitas requisições deste IP, tente novamente mais tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
```

### **Rate limiting específico:**
```javascript
// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login
  message: {
    success: false,
    error: 'Muitas tentativas de login, tente novamente em 15 minutos.'
  },
  skipSuccessfulRequests: true, // não contar tentativas bem-sucedidas
});

app.post('/api/auth/login', loginLimiter, (req, res) => {
  // Lógica de login
});

// Rate limiting para registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 registros por IP por hora
  message: {
    success: false,
    error: 'Muitos registros deste IP, tente novamente em 1 hora.'
  }
});

app.post('/api/auth/register', registerLimiter, (req, res) => {
  // Lógica de registro
});
```

## 🔧 Validação de Entrada

### **Validação rigorosa:**
```javascript
const validator = require('validator');

const validateInput = (input) => {
  // Verificar se é string
  if (typeof input !== 'string') {
    return false;
  }
  
  // Verificar tamanho
  if (input.length > 1000) {
    return false;
  }
  
  // Verificar caracteres perigosos
  if (input.includes('<script>') || input.includes('javascript:')) {
    return false;
  }
  
  // Verificar SQL injection
  const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION'];
  const upperInput = input.toUpperCase();
  for (const keyword of sqlKeywords) {
    if (upperInput.includes(keyword)) {
      return false;
    }
  }
  
  return true;
};
```

### **Sanitização de dados:**
```javascript
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remover tags HTML
    input = input.replace(/<[^>]*>/g, '');
    
    // Escapar caracteres especiais
    input = input.replace(/[<>]/g, '');
    
    // Remover espaços em branco extras
    input = input.trim();
    
    // Limitar tamanho
    if (input.length > 1000) {
      input = input.substring(0, 1000);
    }
  }
  
  return input;
};
```

## 🔧 Autenticação Segura

### **Hash de senhas:**
```javascript
const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const saltRounds = 12; // Alto custo computacional
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

### **Geração de tokens seguros:**
```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    tipo: user.tipo,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
    jti: crypto.randomUUID() // ID único do token
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    issuer: 'voltway-api',
    audience: 'voltway-client'
  });
};
```

### **Validação de tokens:**
```javascript
const validateToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'voltway-api',
      audience: 'voltway-client'
    });
    
    // Verificar se token não está na blacklist
    if (isTokenBlacklisted(token)) {
      throw new Error('Token inválido');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
};
```

## 🔧 Controle de Acesso

### **Middleware de autorização:**
```javascript
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }
    
    if (!allowedRoles.includes(req.user.tipo)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }
    
    next();
  };
};
```

### **Controle de recursos:**
```javascript
const checkResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    const resourceId = req.params.id;
    const userId = req.user.sub;
    
    let query;
    switch (resourceType) {
      case 'veiculo':
        query = 'SELECT usuario_id FROM veiculos WHERE id = $1';
        break;
      case 'reserva':
        query = 'SELECT usuario_id FROM reservas WHERE id = $1';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Tipo de recurso inválido'
        });
    }
    
    const result = await db.query(query, [resourceId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recurso não encontrado'
      });
    }
    
    if (result.rows[0].usuario_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado ao recurso'
      });
    }
    
    next();
  };
};
```

## 🔧 Logs de Segurança

### **Middleware de logging:**
```javascript
const securityLogger = (req, res, next) => {
  const start = Date.now();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  // Log de requisições suspeitas
  if (req.body && JSON.stringify(req.body).includes('<script>')) {
    console.warn(`⚠️  Tentativa de XSS detectada - IP: ${ip}, User-Agent: ${userAgent}`);
  }
  
  if (req.query && Object.values(req.query).some(val => 
    typeof val === 'string' && val.toUpperCase().includes('SELECT')
  )) {
    console.warn(`⚠️  Tentativa de SQL injection detectada - IP: ${ip}, User-Agent: ${userAgent}`);
  }
  
  // Log de tentativas de acesso não autorizado
  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(`🚨 Acesso negado - IP: ${ip}, Status: ${res.statusCode}, Path: ${req.path}`);
    }
  });
  
  next();
};

app.use(securityLogger);
```

### **Log de eventos de segurança:**
```javascript
const logSecurityEvent = (event, details) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
    ip: details.ip,
    userAgent: details.userAgent
  };
  
  console.log(`🔒 Evento de segurança: ${JSON.stringify(logEntry)}`);
  
  // Em produção, salvar em arquivo ou banco de dados
  if (process.env.NODE_ENV === 'production') {
    // Salvar em arquivo de log
    fs.appendFileSync('security.log', JSON.stringify(logEntry) + '\n');
  }
};
```

## 🔧 Configurações de Produção

### **Variáveis de ambiente seguras:**
```env
# Configurações de segurança
NODE_ENV=production
JWT_SECRET=chave_super_secreta_para_producao_2024
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# Configurações de rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5
REGISTER_RATE_LIMIT_MAX=3

# Configurações de CORS
CORS_ORIGIN=https://voltway.com.br
CORS_CREDENTIALS=true

# Configurações de SSL
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

### **Configuração de CORS segura:**
```javascript
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN.split(',');
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));
```

## 🔧 Monitoramento de Segurança

### **Middleware de monitoramento:**
```javascript
const securityMonitor = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  // Detectar padrões suspeitos
  if (req.path.includes('..') || req.path.includes('//')) {
    logSecurityEvent('PATH_TRAVERSAL_ATTEMPT', { ip, userAgent, path: req.path });
    return res.status(400).json({
      success: false,
      error: 'Caminho inválido'
    });
  }
  
  // Detectar tentativas de acesso a arquivos sensíveis
  if (req.path.includes('.env') || req.path.includes('config')) {
    logSecurityEvent('SENSITIVE_FILE_ACCESS_ATTEMPT', { ip, userAgent, path: req.path });
    return res.status(403).json({
      success: false,
      error: 'Acesso negado'
    });
  }
  
  next();
};

app.use(securityMonitor);
```

## 🧪 Testes de Segurança

### **Teste de XSS:**
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "<script>alert(\"XSS\")</script>",
    "email": "teste@email.com",
    "senha": "senha123"
  }'
```

### **Teste de SQL Injection:**
```bash
curl "http://localhost:3000/api/usuarios?nome=teste'; DROP TABLE usuarios; --"
```

### **Teste de Rate Limiting:**
```bash
# Fazer muitas requisições rapidamente
for i in {1..10}; do
  curl http://localhost:3000/api/usuarios &
done
wait
```

### **Teste de CORS:**
```bash
curl -H "Origin: http://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS http://localhost:3000/api/usuarios
```

## 🎯 Próximo Passo

Após implementar a segurança, prossiga para:
**[17-troubleshooting.md](./17-troubleshooting.md)** - Resolução de problemas

---

**Tempo estimado:** 25-30 minutos  
**Dificuldade:** Intermediário  
**Próximo:** Resolução de problemas
