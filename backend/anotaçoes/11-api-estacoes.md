# ⚡ Fase 11: API de Estações

Este arquivo explica como implementar os endpoints para gerenciar estações de carregamento no sistema VoltWay.

## 📋 O que a API de Estações faz

A API de estações permite:
- **Listar** estações com filtros avançados
- **Buscar** estação específica por ID
- **Criar** novas estações
- **Atualizar** dados de estações
- **Deletar** estações (futuro)
- **Buscar por localização** (futuro)

## 🔍 Endpoint: GET /api/estacoes

### **O que faz:**
Lista todas as estações com filtros opcionais e paginação.

### **Parâmetros de Query:**
- `cidade` - Filtrar por cidade (busca parcial)
- `estado` - Filtrar por estado (busca parcial)
- `potencia_min` - Potência mínima em kW
- `potencia_max` - Potência máxima em kW
- `preco_max` - Preço máximo por kWh
- `ativa` - Apenas estações ativas (true/false)
- `abertura` - Horário de abertura
- `fechamento` - Horário de fechamento
- `limit` - Limite de resultados
- `offset` - Offset para paginação

### **Como funciona:**
1. **Constrói query SQL** com filtros dinâmicos
2. **Aplica validações** nos parâmetros numéricos
3. **Retorna dados** das estações

### **Query SQL base:**
```sql
SELECT 
  id, nome, email, rua, numero, cidade, estado,
  potencia, abertura, fechamento, tempo_espera, preco, ativa,
  criado_em, atualizado_em
FROM estacoes
WHERE 1=1
-- + filtros dinâmicos
```

## 🔍 Endpoint: GET /api/estacoes/:id

### **O que faz:**
Busca uma estação específica pelo ID.

### **Dados retornados:**
- **Informações básicas:** nome, email, endereço
- **Especificações técnicas:** potência, preço, horários
- **Status:** ativa/inativa, tempo de espera
- **Timestamps:** criado_em, atualizado_em

## ➕ Endpoint: POST /api/estacoes

### **O que faz:**
Cria uma nova estação de carregamento.

### **Validações:**
- **nome obrigatório** - não pode estar vazio
- **email obrigatório** - não pode estar vazio
- **email único** - não pode duplicar
- **endereço completo** - rua, número, cidade, estado
- **potencia válida** - deve ser > 0
- **horários válidos** - abertura e fechamento
- **preco válido** - deve ser >= 0
- **tempo_espera válido** - deve ser >= 0

### **Como funciona:**
1. **Valida dados** de entrada
2. **Verifica email único** (constraint do banco)
3. **Valida horários** (formato HH:MM)
4. **Insere no banco** com prepared statement
5. **Retorna dados** da estação criada

## 🔄 Endpoint: PUT /api/estacoes/:id (Futuro)

### **O que fará:**
Atualiza dados de uma estação existente.

### **Campos atualizáveis:**
- Nome, email, endereço, potência, preço
- Horários de funcionamento, tempo de espera
- Status ativa/inativa
- **Não atualiza:** ID, timestamps

## 🗑️ Endpoint: DELETE /api/estacoes/:id (Futuro)

### **O que fará:**
Remove uma estação do sistema.

### **Considerações:**
- **Verificar reservas** ativas
- **Soft delete** vs hard delete
- **Cascata** para reservas relacionadas

## 🔐 Validações Específicas

### **Validação de Horários:**
```javascript
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
if (!timeRegex.test(abertura) || !timeRegex.test(fechamento)) {
  return res.status(400).json({
    success: false,
    error: 'Horários devem estar no formato HH:MM'
  });
}

// Verificar se abertura é antes do fechamento
if (abertura >= fechamento) {
  return res.status(400).json({
    success: false,
    error: 'Horário de abertura deve ser antes do fechamento'
  });
}
```

### **Validação de Potência:**
```javascript
if (potencia <= 0) {
  return res.status(400).json({
    success: false,
    error: 'Potência deve ser maior que zero'
  });
}

// Potências comuns: 11, 22, 50, 75, 100, 150 kW
const potenciasValidas = [11, 22, 50, 75, 100, 150];
if (!potenciasValidas.includes(potencia)) {
  console.warn(`Potência não comum: ${potencia} kW`);
}
```

### **Validação de Preço:**
```javascript
if (preco < 0) {
  return res.status(400).json({
    success: false,
    error: 'Preço não pode ser negativo'
  });
}

// Preço em reais por kWh (ex: 0.85)
if (preco > 5.0) {
  console.warn(`Preço alto: R$ ${preco}/kWh`);
}
```

## 📊 Filtros Avançados

### **Filtro por Potência:**
```sql
-- Potência mínima
WHERE potencia >= $1

-- Potência máxima
WHERE potencia <= $1

-- Faixa de potência
WHERE potencia BETWEEN $1 AND $2
```

### **Filtro por Preço:**
```sql
-- Preço máximo
WHERE preco <= $1

-- Faixa de preço
WHERE preco BETWEEN $1 AND $2
```

### **Filtro por Status:**
```sql
-- Apenas estações ativas
WHERE ativa = true

-- Apenas estações inativas
WHERE ativa = false
```

### **Filtro por Horário:**
```sql
-- Estações abertas 24h
WHERE abertura = '00:00' AND fechamento = '23:59'

-- Estações abertas em horário específico
WHERE abertura <= $1 AND fechamento >= $1
```

## 🔍 Busca por Localização

### **Filtro por Cidade:**
```sql
-- Busca parcial na cidade
WHERE cidade ILIKE $1
-- Parâmetro: '%São Paulo%'
```

### **Filtro por Estado:**
```sql
-- Busca parcial no estado
WHERE estado ILIKE $1
-- Parâmetro: '%SP%'
```

### **Busca por Endereço:**
```sql
-- Busca na rua
WHERE rua ILIKE $1
-- Parâmetro: '%Paulista%'
```

## 📄 Resposta com Dados Completos

### **Estrutura da resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "EletroPosto Central",
      "email": "contato@eletropostocentral.com",
      "rua": "Av. Paulista",
      "numero": "1000",
      "cidade": "São Paulo",
      "estado": "SP",
      "potencia": 50,
      "abertura": "06:00",
      "fechamento": "22:00",
      "tempo_espera": 15,
      "preco": 0.85,
      "ativa": true,
      "criado_em": "2024-09-29T10:30:00.000Z"
    }
  ],
  "total": 11,
  "limit": 50,
  "offset": 0
}
```

## 🚨 Tratamento de Erros

### **Erros específicos:**
- **400:** Dados inválidos (horários, potência, preço)
- **404:** Estação não encontrada
- **409:** Email já está em uso
- **500:** Erro interno do servidor

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

### **Validação de Endereço:**
```javascript
if (!rua || !numero || !cidade || !estado) {
  return res.status(400).json({
    success: false,
    error: 'Endereço completo é obrigatório (rua, número, cidade, estado)'
  });
}
```

## ⚡ Otimizações

### **Índices no Banco:**
```sql
-- Índices para melhor performance
CREATE INDEX idx_estacoes_cidade_estado ON estacoes(cidade, estado);
CREATE INDEX idx_estacoes_ativa ON estacoes(ativa);
CREATE INDEX idx_estacoes_preco ON estacoes(preco);
CREATE INDEX idx_estacoes_potencia ON estacoes(potencia);
CREATE INDEX idx_estacoes_email ON estacoes(email);
```

### **Query Otimizada:**
```sql
-- Usar EXPLAIN para analisar performance
EXPLAIN ANALYZE 
SELECT * FROM estacoes 
WHERE cidade = 'São Paulo' 
AND ativa = true 
AND potencia >= 50;
```

## 🧪 Testes da API

### **Teste de listagem:**
```bash
curl http://localhost:3000/api/estacoes
```

### **Teste com filtros:**
```bash
curl "http://localhost:3000/api/estacoes?cidade=São Paulo&potencia_min=50&ativa=true"
```

### **Teste de criação:**
```bash
curl -X POST http://localhost:3000/api/estacoes \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Nova Estação",
    "email": "contato@novaestacao.com",
    "rua": "Rua Nova",
    "numero": "123",
    "cidade": "São Paulo",
    "estado": "SP",
    "potencia": 75,
    "abertura": "08:00",
    "fechamento": "20:00",
    "tempo_espera": 10,
    "preco": 0.90,
    "ativa": true
  }'
```

### **Teste de validação:**
```bash
curl -X POST http://localhost:3000/api/estacoes \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "",
    "email": "email-invalido",
    "potencia": -10,
    "preco": -5.0
  }'
```

## 📊 Estatísticas de Estações

### **Endpoint futuro: GET /api/estacoes/stats**
```javascript
// Estatísticas por cidade
const statsByCity = await db.query(`
  SELECT cidade, estado, COUNT(*) as quantidade
  FROM estacoes
  GROUP BY cidade, estado
  ORDER BY quantidade DESC
`);

// Estatísticas por potência
const statsByPower = await db.query(`
  SELECT 
    CASE 
      WHEN potencia <= 22 THEN 'Baixa (≤22kW)'
      WHEN potencia <= 50 THEN 'Média (23-50kW)'
      WHEN potencia <= 100 THEN 'Alta (51-100kW)'
      ELSE 'Muito Alta (>100kW)'
    END as categoria,
    COUNT(*) as quantidade
  FROM estacoes
  GROUP BY categoria
  ORDER BY quantidade DESC
`);

// Estatísticas de preço
const statsByPrice = await db.query(`
  SELECT 
    AVG(preco) as preco_medio,
    MIN(preco) as preco_minimo,
    MAX(preco) as preco_maximo
  FROM estacoes
  WHERE ativa = true
`);
```

## 🎯 Próximo Passo

Após implementar a API de estações, prossiga para:
**[12-api-reservas.md](./12-api-reservas.md)** - Endpoints de reservas

---

**Tempo estimado:** 25-30 minutos  
**Dificuldade:** Intermediário  
**Próximo:** API de reservas
