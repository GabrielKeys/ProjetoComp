# 👥 Fase 9: API de Usuários

Este arquivo explica como implementar os endpoints para gerenciar usuários no sistema VoltWay.

## 📋 O que a API de Usuários faz

A API de usuários permite:
- **Listar** usuários com filtros
- **Buscar** usuário específico por ID
- **Criar** novos usuários
- **Atualizar** dados de usuários
- **Deletar** usuários (futuro)

## 🔍 Endpoint: GET /api/usuarios

### **O que faz:**
Lista todos os usuários com filtros opcionais e paginação.

### **Parâmetros de Query:**
- `tipo` - Filtrar por tipo (`usuario` ou `estacao`)
- `cidade` - Filtrar por cidade (busca parcial)
- `estado` - Filtrar por estado (busca parcial)
- `limit` - Limite de resultados (padrão: 50)
- `offset` - Offset para paginação (padrão: 0)

### **Como funciona:**
1. **Constrói query SQL** dinamicamente baseado nos filtros
2. **Usa prepared statements** para segurança
3. **Aplica paginação** com LIMIT e OFFSET
4. **Retorna dados** sem informações sensíveis (senha)

### **Exemplo de uso:**
```bash
GET /api/usuarios?tipo=usuario&cidade=São Paulo&limit=10
```

### **Resposta esperada:**
```json
{
  "success": true,
  "data": [...],
  "total": 8,
  "limit": 10,
  "offset": 0
}
```

## 🔍 Endpoint: GET /api/usuarios/:id

### **O que faz:**
Busca um usuário específico pelo ID.

### **Como funciona:**
1. **Extrai ID** dos parâmetros da URL
2. **Executa query** com prepared statement
3. **Verifica se existe** - retorna 404 se não encontrar
4. **Retorna dados** do usuário

### **Tratamento de erros:**
- **404:** Usuário não encontrado
- **500:** Erro interno do servidor

## ➕ Endpoint: POST /api/usuarios

### **O que faz:**
Cria um novo usuário no sistema.

### **Validações:**
- **Nome obrigatório** - não pode estar vazio
- **Email obrigatório** - não pode estar vazio
- **Email único** - não pode duplicar
- **Tipo válido** - deve ser `usuario` ou `estacao`

### **Como funciona:**
1. **Valida dados** de entrada
2. **Verifica email único** (constraint do banco)
3. **Insere no banco** com prepared statement
4. **Retorna dados** do usuário criado (sem senha)

### **Tratamento de erros:**
- **400:** Dados inválidos ou obrigatórios faltando
- **409:** Email já está em uso
- **500:** Erro interno do servidor

## 🔄 Endpoint: PUT /api/usuarios/:id (Futuro)

### **O que fará:**
Atualiza dados de um usuário existente.

### **Validações:**
- **ID deve existir**
- **Email único** (se alterado)
- **Dados válidos**

### **Campos atualizáveis:**
- Nome, email, cidade, estado
- **Não atualiza:** ID, senha, timestamps

## 🗑️ Endpoint: DELETE /api/usuarios/:id (Futuro)

### **O que fará:**
Remove um usuário do sistema.

### **Considerações:**
- **Verificar dependências** (veículos, reservas)
- **Soft delete** vs hard delete
- **Cascata** para dados relacionados

## 🔐 Segurança e Validações

### **Prepared Statements:**
```javascript
// ✅ Seguro - usa prepared statement
const result = await db.query(
  'SELECT * FROM usuarios WHERE id = $1',
  [userId]
);

// ❌ Inseguro - vulnerável a SQL injection
const result = await db.query(
  `SELECT * FROM usuarios WHERE id = ${userId}`
);
```

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

### **Sanitização de Dados:**
```javascript
// Remover espaços em branco
const nome = req.body.nome?.trim();
const email = req.body.email?.trim().toLowerCase();
```

## 📊 Filtros e Busca

### **Busca por Cidade:**
```sql
-- Usa ILIKE para busca case-insensitive
WHERE cidade ILIKE $1
-- Parâmetro: '%São Paulo%'
```

### **Busca por Estado:**
```sql
-- Busca parcial no estado
WHERE estado ILIKE $1
-- Parâmetro: '%SP%'
```

### **Filtro por Tipo:**
```sql
-- Filtro exato
WHERE tipo = $1
-- Parâmetro: 'usuario'
```

## 📄 Paginação

### **Como implementar:**
```javascript
const limit = parseInt(req.query.limit) || 50;
const offset = parseInt(req.query.offset) || 0;

// Adicionar à query
query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
params.push(limit, offset);
```

### **Resposta com metadados:**
```json
{
  "success": true,
  "data": [...],
  "total": 8,
  "limit": 10,
  "offset": 0,
  "hasMore": true
}
```

## 🔍 Logs e Debug

### **O que logar:**
- **Requisições recebidas** (método, path, parâmetros)
- **Queries executadas** (texto, parâmetros, duração)
- **Erros encontrados** (tipo, mensagem, stack)

### **Exemplo de log:**
```
GET /api/usuarios?tipo=usuario&limit=10
Query: SELECT * FROM usuarios WHERE tipo = $1 LIMIT $2
Parâmetros: ['usuario', 10]
Duração: 15ms
Resultado: 6 registros
```

## ⚡ Otimizações

### **Índices no Banco:**
```sql
-- Índices para melhor performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_usuarios_cidade_estado ON usuarios(cidade, estado);
```

### **Cache (Futuro):**
```javascript
// Cache de usuários frequentes
const userCache = new Map();

const getCachedUser = (id) => {
  if (userCache.has(id)) {
    return userCache.get(id);
  }
  // Buscar no banco e cachear
};
```

## 🧪 Testes da API

### **Teste de listagem:**
```bash
curl http://localhost:3000/api/usuarios
```

### **Teste com filtros:**
```bash
curl "http://localhost:3000/api/usuarios?tipo=usuario&cidade=São Paulo"
```

### **Teste de criação:**
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@email.com","tipo":"usuario"}'
```

### **Teste de validação:**
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome":"","email":"email-invalido"}'
```

## 🎯 Próximo Passo

Após implementar a API de usuários, prossiga para:
**[10-api-veiculos.md](./10-api-veiculos.md)** - Endpoints de veículos

---

**Tempo estimado:** 20-25 minutos  
**Dificuldade:** Intermediário  
**Próximo:** API de veículos
