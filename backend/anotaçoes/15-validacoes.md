# ✅ Fase 15: Validações e Tratamento de Erros

Este arquivo explica como implementar validações robustas e tratamento de erros no sistema VoltWay.

## 📋 O que as Validações fazem

As validações garantem:
- **Dados corretos** antes de processar
- **Segurança** contra ataques
- **Consistência** dos dados
- **Experiência do usuário** com mensagens claras
- **Integridade** do banco de dados

## 🔍 Tipos de Validação

### **1. Validação de Entrada (Input Validation)**
- **Formato** dos dados
- **Tipos** corretos
- **Campos obrigatórios**
- **Tamanhos** adequados

### **2. Validação de Negócio (Business Validation)**
- **Regras específicas** do domínio
- **Relacionamentos** entre entidades
- **Estados válidos** para transições

### **3. Validação de Segurança (Security Validation)**
- **Sanitização** de dados
- **Prevenção** de SQL injection
- **Validação** de permissões

## 🔧 Validações de Entrada

### **Validação de Email:**
```javascript
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { valid: false, error: 'Email é obrigatório' };
  }
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Email inválido' };
  }
  
  if (email.length > 255) {
    return { valid: false, error: 'Email muito longo' };
  }
  
  return { valid: true };
};
```

### **Validação de Senha:**
```javascript
const validatePassword = (password) => {
  if (!password) {
    return { valid: false, error: 'Senha é obrigatória' };
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'Senha deve ter pelo menos 6 caracteres' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Senha muito longa' };
  }
  
  // Senha forte (opcional)
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  if (!strongPasswordRegex.test(password)) {
    return { valid: false, error: 'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número' };
  }
  
  return { valid: true };
};
```

### **Validação de Nome:**
```javascript
const validateName = (name) => {
  if (!name) {
    return { valid: false, error: 'Nome é obrigatório' };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, error: 'Nome deve ter pelo menos 2 caracteres' };
  }
  
  if (name.length > 255) {
    return { valid: false, error: 'Nome muito longo' };
  }
  
  // Verificar caracteres especiais
  const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
  if (!nameRegex.test(name)) {
    return { valid: false, error: 'Nome deve conter apenas letras e espaços' };
  }
  
  return { valid: true };
};
```

### **Validação de Data:**
```javascript
const validateDate = (date) => {
  if (!date) {
    return { valid: false, error: 'Data é obrigatória' };
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { valid: false, error: 'Data deve estar no formato YYYY-MM-DD' };
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Data inválida' };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (dateObj < today) {
    return { valid: false, error: 'Data não pode ser no passado' };
  }
  
  return { valid: true };
};
```

### **Validação de Horário:**
```javascript
const validateTime = (time) => {
  if (!time) {
    return { valid: false, error: 'Horário é obrigatório' };
  }
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return { valid: false, error: 'Horário deve estar no formato HH:MM' };
  }
  
  return { valid: true };
};
```

### **Validação de Placa:**
```javascript
const validatePlate = (plate) => {
  if (!plate) {
    return { valid: false, error: 'Placa é obrigatória' };
  }
  
  // Formato brasileiro: ABC-1234
  const plateRegex = /^[A-Z]{3}-[0-9]{4}$/;
  if (!plateRegex.test(plate)) {
    return { valid: false, error: 'Placa deve estar no formato ABC-1234' };
  }
  
  return { valid: true };
};
```

## 🔧 Validações de Negócio

### **Validação de Reserva:**
```javascript
const validateReservation = async (reservationData) => {
  const { usuario_id, estacao_id, veiculo_id, data, hora } = reservationData;
  
  // Verificar se usuário existe
  const user = await db.query('SELECT id FROM usuarios WHERE id = $1', [usuario_id]);
  if (user.rows.length === 0) {
    return { valid: false, error: 'Usuário não encontrado' };
  }
  
  // Verificar se estação existe e está ativa
  const station = await db.query('SELECT id, ativa FROM estacoes WHERE id = $1', [estacao_id]);
  if (station.rows.length === 0) {
    return { valid: false, error: 'Estação não encontrada' };
  }
  
  if (!station.rows[0].ativa) {
    return { valid: false, error: 'Estação não está ativa' };
  }
  
  // Verificar se veículo existe e pertence ao usuário
  const vehicle = await db.query('SELECT id, usuario_id FROM veiculos WHERE id = $1', [veiculo_id]);
  if (vehicle.rows.length === 0) {
    return { valid: false, error: 'Veículo não encontrado' };
  }
  
  if (vehicle.rows[0].usuario_id !== usuario_id) {
    return { valid: false, error: 'Veículo não pertence ao usuário' };
  }
  
  // Verificar se horário está disponível
  const existingReservation = await db.query(`
    SELECT id FROM reservas 
    WHERE estacao_id = $1 AND data = $2 AND hora = $3 
    AND status IN ('pendente', 'confirmada')
  `, [estacao_id, data, hora]);
  
  if (existingReservation.rows.length > 0) {
    return { valid: false, error: 'Horário já está reservado' };
  }
  
  return { valid: true };
};
```

### **Validação de Estação:**
```javascript
const validateStation = async (stationData) => {
  const { nome, email, potencia, preco, abertura, fechamento } = stationData;
  
  // Verificar se email já está em uso
  const existingStation = await db.query('SELECT id FROM estacoes WHERE email = $1', [email]);
  if (existingStation.rows.length > 0) {
    return { valid: false, error: 'Email já está em uso' };
  }
  
  // Verificar se nome já está em uso
  const existingName = await db.query('SELECT id FROM estacoes WHERE nome = $1', [nome]);
  if (existingName.rows.length > 0) {
    return { valid: false, error: 'Nome já está em uso' };
  }
  
  // Verificar potência
  if (potencia <= 0) {
    return { valid: false, error: 'Potência deve ser maior que zero' };
  }
  
  if (potencia > 500) {
    return { valid: false, error: 'Potência muito alta' };
  }
  
  // Verificar preço
  if (preco < 0) {
    return { valid: false, error: 'Preço não pode ser negativo' };
  }
  
  if (preco > 10) {
    return { valid: false, error: 'Preço muito alto' };
  }
  
  // Verificar horários
  if (abertura >= fechamento) {
    return { valid: false, error: 'Horário de abertura deve ser antes do fechamento' };
  }
  
  return { valid: true };
};
```

## 🔧 Middleware de Validação

### **Middleware genérico:**
```javascript
const validate = (validationRules) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(validationRules)) {
      const value = req.body[field];
      
      for (const rule of rules) {
        const result = rule(value);
        if (!result.valid) {
          errors.push({
            field,
            error: result.error
          });
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: errors
      });
    }
    
    next();
  };
};
```

### **Uso do middleware:**
```javascript
// Validação para criação de usuário
const userValidationRules = {
  nome: [validateName],
  email: [validateEmail],
  senha: [validatePassword],
  tipo: [(value) => {
    if (!value) return { valid: false, error: 'Tipo é obrigatório' };
    if (!['usuario', 'estacao'].includes(value)) {
      return { valid: false, error: 'Tipo deve ser usuario ou estacao' };
    }
    return { valid: true };
  }]
};

app.post('/api/usuarios', validate(userValidationRules), (req, res) => {
  // Lógica da rota
});
```

## 🚨 Tratamento de Erros

### **Middleware de erro global:**
```javascript
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  // Erro de validação do banco
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      success: false,
      error: 'Dados duplicados',
      details: 'Já existe um registro com estes dados'
    });
  }
  
  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      success: false,
      error: 'Referência inválida',
      details: 'Dados referenciados não existem'
    });
  }
  
  if (err.code === '23514') { // Check constraint violation
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: 'Valores não atendem às regras de validação'
    });
  }
  
  // Erro de JWT
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
  
  // Erro genérico
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

### **Tratamento de erros específicos:**
```javascript
const handleDatabaseError = (err) => {
  switch (err.code) {
    case '23505':
      return { status: 409, message: 'Dados duplicados' };
    case '23503':
      return { status: 400, message: 'Referência inválida' };
    case '23514':
      return { status: 400, message: 'Dados inválidos' };
    case '42P01':
      return { status: 500, message: 'Tabela não encontrada' };
    case '42703':
      return { status: 500, message: 'Coluna não encontrada' };
    default:
      return { status: 500, message: 'Erro interno do servidor' };
  }
};
```

## 🔧 Sanitização de Dados

### **Sanitização básica:**
```javascript
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeInput(value);
  }
  return sanitized;
};
```

### **Middleware de sanitização:**
```javascript
const sanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

app.use(sanitize);
```

## 🔧 Validação de Tipos

### **Validação de tipos:**
```javascript
const validateTypes = (data, schema) => {
  const errors = [];
  
  for (const [field, expectedType] of Object.entries(schema)) {
    const value = data[field];
    const actualType = typeof value;
    
    if (expectedType === 'number' && isNaN(value)) {
      errors.push({ field, error: `${field} deve ser um número` });
    } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
      errors.push({ field, error: `${field} deve ser um booleano` });
    } else if (expectedType === 'string' && typeof value !== 'string') {
      errors.push({ field, error: `${field} deve ser uma string` });
    }
  }
  
  return errors;
};
```

### **Uso da validação de tipos:**
```javascript
const stationSchema = {
  nome: 'string',
  potencia: 'number',
  preco: 'number',
  ativa: 'boolean'
};

const typeErrors = validateTypes(req.body, stationSchema);
if (typeErrors.length > 0) {
  return res.status(400).json({
    success: false,
    error: 'Tipos de dados inválidos',
    details: typeErrors
  });
}
```

## 🧪 Testes de Validação

### **Teste de validação de email:**
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste",
    "email": "email-invalido",
    "senha": "senha123"
  }'
```

### **Teste de validação de senha:**
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste",
    "email": "teste@email.com",
    "senha": "123"
  }'
```

### **Teste de validação de negócio:**
```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 999,
    "estacao_id": 1,
    "veiculo_id": 1,
    "data": "2020-01-01",
    "hora": "14:00"
  }'
```

## 🎯 Próximo Passo

Após implementar as validações, prossiga para:
**[16-seguranca.md](./16-seguranca.md)** - Implementação de segurança

---

**Tempo estimado:** 20-25 minutos  
**Dificuldade:** Intermediário  
**Próximo:** Implementação de segurança
