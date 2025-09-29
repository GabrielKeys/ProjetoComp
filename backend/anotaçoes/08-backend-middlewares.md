# ⚙️ Fase 8: Middlewares e Configurações do Express

Este arquivo explica os middlewares usados no `server.js` e como eles funcionam.

## 📋 O que são Middlewares

**Middlewares** são funções que executam **entre** a requisição HTTP e a resposta. Eles podem:
- **Modificar** a requisição ou resposta
- **Executar** código antes/depois da rota
- **Terminar** o ciclo da requisição
- **Passar** para o próximo middleware

## 🔧 Middlewares Implementados

### **1. CORS (Cross-Origin Resource Sharing)**
```javascript
app.use(cors());
```
- **O que faz:** Permite requisições de outros domínios
- **Por que precisa:** Frontend (localhost:8080) chama API (localhost:3000)
- **Configuração:** Permite todos os origins (desenvolvimento)

### **2. Express JSON Parser**
```javascript
app.use(express.json());
```
- **O que faz:** Converte JSON do body em objeto JavaScript
- **Quando usar:** Para requisições POST/PUT com JSON
- **Exemplo:** `{"nome": "João"}` → `req.body.nome = "João"`

### **3. Express Static**
```javascript
app.use(express.static(path.join(__dirname, '../')));
```
- **O que faz:** Serve arquivos estáticos (HTML, CSS, JS)
- **Por que:** Frontend está na pasta pai (`../`)
- **Exemplo:** `http://localhost:3000/index.html` serve o arquivo

### **4. Middleware de Logging**
```javascript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```
- **O que faz:** Loga todas as requisições
- **Informações:** Timestamp, método HTTP, caminho
- **Importante:** Chama `next()` para continuar

## 🛡️ Middlewares de Segurança (Futuro)

### **Helmet**
```javascript
app.use(helmet());
```
- **O que faz:** Adiciona headers de segurança
- **Proteções:** XSS, clickjacking, MIME sniffing
- **Headers:** X-Frame-Options, X-Content-Type-Options

### **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requisições por IP
});
app.use(limiter);
```
- **O que faz:** Limita requisições por IP
- **Proteção:** Contra ataques de força bruta
- **Configuração:** 100 req/15min por IP

## 🔍 Middleware de Erro 404

### **No final do server.js:**
```javascript
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    path: req.path,
    method: req.method
  });
});
```
- **O que faz:** Captura rotas não encontradas
- **Quando executa:** Se nenhuma rota anterior respondeu
- **Resposta:** JSON com erro 404

## 📝 Middleware de Logging Avançado

### **Versão mais detalhada:**
```javascript
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log da requisição
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  
  // Interceptar resposta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    console.log(`Resposta: ${res.statusCode} - ${duration}ms`);
    originalSend.call(this, data);
  };
  
  next();
});
```
- **O que faz:** Loga requisição E resposta
- **Informações:** Status code, tempo de resposta
- **Útil para:** Debug e monitoramento

## 🔐 Middleware de Autenticação (Futuro)

### **Estrutura básica:**
```javascript
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Usar em rotas protegidas
app.get('/api/usuarios', authenticateToken, (req, res) => {
  // Só executa se token for válido
});
```

## 📊 Middleware de Validação

### **Exemplo para usuários:**
```javascript
const validateUser = (req, res, next) => {
  const { nome, email } = req.body;
  
  if (!nome || !email) {
    return res.status(400).json({
      success: false,
      error: 'Nome e email são obrigatórios'
    });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Email inválido'
    });
  }
  
  next(); // Passa para a rota
};

// Usar na rota
app.post('/api/usuarios', validateUser, (req, res) => {
  // Só executa se validação passar
});
```

## 🔄 Ordem dos Middlewares

### **Ordem correta:**
```javascript
// 1. Segurança (primeiro)
app.use(helmet());
app.use(rateLimit());

// 2. Parsing (antes das rotas)
app.use(cors());
app.use(express.json());

// 3. Logging
app.use(loggingMiddleware);

// 4. Rotas
app.get('/api/usuarios', ...);
app.post('/api/usuarios', ...);

// 5. Erro 404 (por último)
app.use(notFoundMiddleware);
```

### **Por que a ordem importa:**
- **Segurança primeiro:** Protege antes de processar
- **Parsing antes das rotas:** Dados prontos para usar
- **404 por último:** Só executa se nenhuma rota respondeu

## 🚨 Tratamento de Erros Global

### **Middleware de erro:**
```javascript
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```
- **O que faz:** Captura erros não tratados
- **Quando executa:** Se `next(err)` for chamado
- **Resposta:** Erro 500 padronizado

## ⚡ Middlewares de Performance

### **Compression:**
```javascript
const compression = require('compression');
app.use(compression());
```
- **O que faz:** Comprime respostas HTTP
- **Benefício:** Reduz tamanho das respostas
- **Uso:** Especialmente útil para APIs com muitos dados

### **Request ID:**
```javascript
const { v4: uuidv4 } = require('uuid');
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});
```
- **O que faz:** Adiciona ID único a cada requisição
- **Útil para:** Rastrear requisições nos logs
- **Header:** `X-Request-ID` na resposta

## 🎯 Próximo Passo

Após entender os middlewares, prossiga para:
**[09-api-usuarios.md](./09-api-usuarios.md)** - Endpoints de usuários

---

**Tempo estimado:** 15-20 minutos  
**Dificuldade:** Intermediário  
**Próximo:** Implementação da API de usuários
