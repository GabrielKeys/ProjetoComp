# 🚗 Fase 10: API de Veículos

Este arquivo explica como implementar os endpoints para gerenciar veículos elétricos no sistema VoltWay.

## 📋 O que a API de Veículos faz

A API de veículos permite:
- **Listar** veículos com filtros
- **Buscar** veículo específico por ID
- **Criar** novos veículos
- **Atualizar** dados de veículos
- **Deletar** veículos (futuro)

## 🔍 Endpoint: GET /api/veiculos

### **O que faz:**
Lista todos os veículos com filtros opcionais e paginação.

### **Parâmetros de Query:**
- `usuario_id` - Filtrar por dono do veículo
- `modelo` - Filtrar por modelo (busca parcial)
- `ano` - Filtrar por ano específico
- `placa` - Filtrar por placa (busca exata)
- `bateria` - Filtrar por capacidade da bateria
- `carga` - Filtrar por tipo de carregamento
- `limit` - Limite de resultados
- `offset` - Offset para paginação

### **Como funciona:**
1. **Constrói query SQL** com JOIN para incluir dados do usuário
2. **Aplica filtros** dinamicamente
3. **Retorna dados** do veículo + informações do dono

### **Query SQL base:**
```sql
SELECT 
  v.*,
  u.nome as usuario_nome,
  u.email as usuario_email
FROM veiculos v
JOIN usuarios u ON v.usuario_id = u.id
WHERE 1=1
-- + filtros dinâmicos
```

## 🔍 Endpoint: GET /api/veiculos/:id

### **O que faz:**
Busca um veículo específico pelo ID.

### **Dados retornados:**
- **Informações do veículo:** modelo, ano, placa, bateria, carga
- **Informações do dono:** nome, email, cidade
- **Timestamps:** criado_em, atualizado_em

## ➕ Endpoint: POST /api/veiculos

### **O que faz:**
Cria um novo veículo para um usuário.

### **Validações:**
- **usuario_id obrigatório** - deve existir na tabela usuarios
- **modelo obrigatório** - não pode estar vazio
- **ano válido** - entre 1900 e ano atual + 1
- **placa obrigatória** - não pode estar vazia
- **placa única** - não pode duplicar
- **bateria opcional** - formato como "75 kWh"
- **carga opcional** - tipo como "Tipo 2", "CCS", "CHAdeMO"

### **Como funciona:**
1. **Valida dados** de entrada
2. **Verifica se usuário existe** (foreign key)
3. **Verifica placa única** (constraint do banco)
4. **Insere no banco** com prepared statement
5. **Retorna dados** do veículo criado

## 🔄 Endpoint: PUT /api/veiculos/:id (Futuro)

### **O que fará:**
Atualiza dados de um veículo existente.

### **Campos atualizáveis:**
- Modelo, ano, bateria, carga
- **Não atualiza:** ID, usuario_id, placa, timestamps

### **Validações:**
- **Ano válido** se alterado
- **Bateria no formato correto** se alterada

## 🗑️ Endpoint: DELETE /api/veiculos/:id (Futuro)

### **O que fará:**
Remove um veículo do sistema.

### **Considerações:**
- **Verificar reservas** ativas
- **Cascata** para reservas relacionadas
- **Soft delete** vs hard delete

## 🔐 Relacionamentos e Constraints

### **Foreign Key:**
```sql
-- Veículo pertence a um usuário
usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
```

### **Constraints de Validação:**
```sql
-- Ano deve ser válido
ano INTEGER NOT NULL CHECK (ano >= 1900 AND ano <= EXTRACT(YEAR FROM CURRENT_DATE) + 1)

-- Placa deve ser única
placa VARCHAR(20) NOT NULL UNIQUE
```

### **Como verificar relacionamentos:**
```javascript
// Verificar se usuário existe antes de criar veículo
const userExists = await db.query(
  'SELECT id FROM usuarios WHERE id = $1',
  [usuario_id]
);

if (userExists.rows.length === 0) {
  return res.status(400).json({
    success: false,
    error: 'Usuário não encontrado'
  });
}
```

## 📊 Filtros Especiais

### **Filtro por Usuário:**
```sql
-- Mostrar veículos de um usuário específico
WHERE v.usuario_id = $1
```

### **Filtro por Modelo:**
```sql
-- Busca parcial no modelo
WHERE v.modelo ILIKE $1
-- Parâmetro: '%Tesla%'
```

### **Filtro por Ano:**
```sql
-- Filtro exato por ano
WHERE v.ano = $1
-- Parâmetro: 2023
```

### **Filtro por Tipo de Carga:**
```sql
-- Filtrar por tipo de carregamento
WHERE v.carga = $1
-- Parâmetro: 'CCS'
```

## 🔍 Busca Avançada

### **Busca por Capacidade de Bateria:**
```javascript
// Extrair número da string "75 kWh"
const bateriaMin = req.query.bateria_min;
if (bateriaMin) {
  query += ` AND CAST(SPLIT_PART(v.bateria, ' ', 1) AS INTEGER) >= $${paramCount + 1}`;
  params.push(bateriaMin);
}
```

### **Busca por Faixa de Ano:**
```javascript
// Filtro por faixa de anos
if (anoMin) {
  query += ` AND v.ano >= $${paramCount + 1}`;
  params.push(anoMin);
}
if (anoMax) {
  query += ` AND v.ano <= $${paramCount + 1}`;
  params.push(anoMax);
}
```

## 📄 Resposta com Dados Relacionados

### **Estrutura da resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "usuario_id": 1,
      "modelo": "Tesla Model 3",
      "ano": 2023,
      "placa": "ABC-1234",
      "bateria": "75 kWh",
      "carga": "Tipo 2",
      "criado_em": "2024-09-29T10:30:00.000Z",
      "usuario_nome": "João Silva",
      "usuario_email": "joao.silva@email.com"
    }
  ],
  "total": 7,
  "limit": 50,
  "offset": 0
}
```

## 🚨 Tratamento de Erros

### **Erros específicos:**
- **400:** Dados inválidos (ano inválido, campos obrigatórios)
- **404:** Veículo não encontrado
- **409:** Placa já está em uso
- **500:** Erro interno do servidor

### **Validação de Ano:**
```javascript
const currentYear = new Date().getFullYear();
if (ano < 1900 || ano > currentYear + 1) {
  return res.status(400).json({
    success: false,
    error: `Ano deve estar entre 1900 e ${currentYear + 1}`
  });
}
```

### **Validação de Placa:**
```javascript
// Formato básico de placa brasileira
const placaRegex = /^[A-Z]{3}-[0-9]{4}$/;
if (!placaRegex.test(placa)) {
  return res.status(400).json({
    success: false,
    error: 'Formato de placa inválido (ex: ABC-1234)'
  });
}
```

## ⚡ Otimizações

### **Índices no Banco:**
```sql
-- Índices para melhor performance
CREATE INDEX idx_veiculos_usuario_id ON veiculos(usuario_id);
CREATE INDEX idx_veiculos_placa ON veiculos(placa);
CREATE INDEX idx_veiculos_modelo ON veiculos(modelo);
CREATE INDEX idx_veiculos_ano ON veiculos(ano);
```

### **Query Otimizada:**
```sql
-- Usar EXPLAIN para analisar performance
EXPLAIN ANALYZE 
SELECT v.*, u.nome as usuario_nome 
FROM veiculos v 
JOIN usuarios u ON v.usuario_id = u.id 
WHERE v.ano = 2023;
```

## 🧪 Testes da API

### **Teste de listagem:**
```bash
curl http://localhost:3000/api/veiculos
```

### **Teste com filtros:**
```bash
curl "http://localhost:3000/api/veiculos?usuario_id=1&ano=2023"
```

### **Teste de criação:**
```bash
curl -X POST http://localhost:3000/api/veiculos \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "modelo": "Tesla Model Y",
    "ano": 2024,
    "placa": "XYZ-9876",
    "bateria": "100 kWh",
    "carga": "CCS"
  }'
```

### **Teste de validação:**
```bash
curl -X POST http://localhost:3000/api/veiculos \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 999,
    "modelo": "",
    "ano": 1800,
    "placa": "placa-invalida"
  }'
```

## 📊 Estatísticas de Veículos

### **Endpoint futuro: GET /api/veiculos/stats**
```javascript
// Estatísticas por ano
const statsByYear = await db.query(`
  SELECT ano, COUNT(*) as quantidade
  FROM veiculos
  GROUP BY ano
  ORDER BY ano DESC
`);

// Estatísticas por tipo de carga
const statsByCharge = await db.query(`
  SELECT carga, COUNT(*) as quantidade
  FROM veiculos
  WHERE carga IS NOT NULL
  GROUP BY carga
  ORDER BY quantidade DESC
`);
```

## 🎯 Próximo Passo

Após implementar a API de veículos, prossiga para:
**[11-api-estacoes.md](./11-api-estacoes.md)** - Endpoints de estações

---

**Tempo estimado:** 20-25 minutos  
**Dificuldade:** Intermediário  
**Próximo:** API de estações
