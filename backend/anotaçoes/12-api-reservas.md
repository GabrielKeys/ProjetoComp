# 📅 Fase 12: API de Reservas

Este arquivo explica como implementar os endpoints para gerenciar reservas de carregamento no sistema VoltWay.

## 📋 O que a API de Reservas faz

A API de reservas permite:
- **Listar** reservas com filtros avançados
- **Buscar** reserva específica por ID
- **Criar** novas reservas
- **Atualizar** status de reservas
- **Cancelar** reservas
- **Confirmar** reservas

## 🔍 Endpoint: GET /api/reservas

### **O que faz:**
Lista todas as reservas com filtros opcionais e paginação.

### **Parâmetros de Query:**
- `usuario_id` - Filtrar por usuário
- `estacao_id` - Filtrar por estação
- `veiculo_id` - Filtrar por veículo
- `status` - Filtrar por status
- `data_inicio` - Data inicial (YYYY-MM-DD)
- `data_fim` - Data final (YYYY-MM-DD)
- `hora_inicio` - Hora inicial (HH:MM)
- `hora_fim` - Hora final (HH:MM)
- `limit` - Limite de resultados
- `offset` - Offset para paginação

### **Como funciona:**
1. **Constrói query SQL** com JOINs para dados completos
2. **Aplica filtros** dinamicamente
3. **Retorna dados** da reserva + informações relacionadas

### **Query SQL base:**
```sql
SELECT 
  r.*,
  u.nome as usuario_nome,
  u.email as usuario_email,
  v.modelo as veiculo_modelo,
  v.placa as veiculo_placa,
  e.nome as estacao_nome,
  e.cidade as estacao_cidade,
  e.estado as estacao_estado,
  e.preco as estacao_preco
FROM reservas r
JOIN usuarios u ON r.usuario_id = u.id
JOIN veiculos v ON r.veiculo_id = v.id
JOIN estacoes e ON r.estacao_id = e.id
WHERE 1=1
-- + filtros dinâmicos
```

## 🔍 Endpoint: GET /api/reservas/:id

### **O que faz:**
Busca uma reserva específica pelo ID.

### **Dados retornados:**
- **Informações da reserva:** data, hora, status, observações
- **Dados do usuário:** nome, email
- **Dados do veículo:** modelo, placa
- **Dados da estação:** nome, endereço, preço

## ➕ Endpoint: POST /api/reservas

### **O que faz:**
Cria uma nova reserva de carregamento.

### **Validações:**
- **usuario_id obrigatório** - deve existir na tabela usuarios
- **estacao_id obrigatório** - deve existir na tabela estacoes
- **veiculo_id obrigatório** - deve existir na tabela veiculos
- **data obrigatória** - formato YYYY-MM-DD
- **hora obrigatória** - formato HH:MM
- **data não pode ser no passado** - exceto para hoje
- **hora deve estar dentro do horário de funcionamento**
- **não pode haver reserva duplicada** no mesmo horário

### **Como funciona:**
1. **Valida dados** de entrada
2. **Verifica se usuário, estação e veículo existem**
3. **Verifica se data/hora são válidas**
4. **Verifica se estação está ativa**
5. **Verifica se horário está disponível**
6. **Insere no banco** com prepared statement
7. **Retorna dados** da reserva criada

## 🔄 Endpoint: PUT /api/reservas/:id

### **O que faz:**
Atualiza uma reserva existente.

### **Campos atualizáveis:**
- **status** - pendente, confirmada, cancelada, concluida
- **observacoes** - notas adicionais
- **data/hora** - com validações

### **Validações:**
- **Status válido** - deve ser um dos valores permitidos
- **Data/hora válidas** se alteradas
- **Não pode alterar** para status cancelada se já confirmada

## 🗑️ Endpoint: DELETE /api/reservas/:id (Futuro)

### **O que fará:**
Remove uma reserva do sistema.

### **Considerações:**
- **Soft delete** vs hard delete
- **Verificar se pode ser cancelada** (não confirmada)
- **Notificar usuário** sobre cancelamento

## 🔐 Validações Específicas

### **Validação de Data:**
```javascript
const dataReserva = new Date(data);
const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

if (dataReserva < hoje) {
  return res.status(400).json({
    success: false,
    error: 'Data não pode ser no passado'
  });
}

// Verificar se não é muito longe no futuro (ex: 30 dias)
const limiteFuturo = new Date();
limiteFuturo.setDate(limiteFuturo.getDate() + 30);

if (dataReserva > limiteFuturo) {
  return res.status(400).json({
    success: false,
    error: 'Reserva não pode ser feita com mais de 30 dias de antecedência'
  });
}
```

### **Validação de Horário:**
```javascript
// Verificar se horário está dentro do funcionamento da estação
const estacao = await db.query(
  'SELECT abertura, fechamento FROM estacoes WHERE id = $1',
  [estacao_id]
);

if (estacao.rows.length === 0) {
  return res.status(400).json({
    success: false,
    error: 'Estação não encontrada'
  });
}

const { abertura, fechamento } = estacao.rows[0];

if (hora < abertura || hora > fechamento) {
  return res.status(400).json({
    success: false,
    error: `Horário deve estar entre ${abertura} e ${fechamento}`
  });
}
```

### **Validação de Disponibilidade:**
```javascript
// Verificar se horário está disponível
const reservaExistente = await db.query(`
  SELECT id FROM reservas 
  WHERE estacao_id = $1 
  AND data = $2 
  AND hora = $3 
  AND status IN ('pendente', 'confirmada')
`, [estacao_id, data, hora]);

if (reservaExistente.rows.length > 0) {
  return res.status(409).json({
    success: false,
    error: 'Já existe uma reserva para este horário'
  });
}
```

### **Validação de Relacionamentos:**
```javascript
// Verificar se usuário, estação e veículo existem
const [usuario, estacao, veiculo] = await Promise.all([
  db.query('SELECT id FROM usuarios WHERE id = $1', [usuario_id]),
  db.query('SELECT id, ativa FROM estacoes WHERE id = $1', [estacao_id]),
  db.query('SELECT id, usuario_id FROM veiculos WHERE id = $1', [veiculo_id])
]);

if (usuario.rows.length === 0) {
  return res.status(400).json({
    success: false,
    error: 'Usuário não encontrado'
  });
}

if (estacao.rows.length === 0) {
  return res.status(400).json({
    success: false,
    error: 'Estação não encontrada'
  });
}

if (!estacao.rows[0].ativa) {
  return res.status(400).json({
    success: false,
    error: 'Estação não está ativa'
  });
}

if (veiculo.rows.length === 0) {
  return res.status(400).json({
    success: false,
    error: 'Veículo não encontrado'
  });
}

// Verificar se veículo pertence ao usuário
if (veiculo.rows[0].usuario_id !== usuario_id) {
  return res.status(400).json({
    success: false,
    error: 'Veículo não pertence ao usuário'
  });
}
```

## 📊 Filtros Avançados

### **Filtro por Status:**
```sql
-- Filtro exato por status
WHERE r.status = $1
-- Parâmetro: 'confirmada'
```

### **Filtro por Data:**
```sql
-- Data específica
WHERE r.data = $1
-- Parâmetro: '2024-01-15'

-- Faixa de datas
WHERE r.data BETWEEN $1 AND $2
-- Parâmetros: ['2024-01-15', '2024-01-20']
```

### **Filtro por Horário:**
```sql
-- Horário específico
WHERE r.hora = $1
-- Parâmetro: '14:00'

-- Faixa de horários
WHERE r.hora BETWEEN $1 AND $2
-- Parâmetros: ['08:00', '18:00']
```

### **Filtro por Usuário:**
```sql
-- Reservas de um usuário específico
WHERE r.usuario_id = $1
```

### **Filtro por Estação:**
```sql
-- Reservas de uma estação específica
WHERE r.estacao_id = $1
```

## 📄 Resposta com Dados Completos

### **Estrutura da resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "usuario_id": 1,
      "estacao_id": 1,
      "veiculo_id": 1,
      "data": "2024-01-15",
      "hora": "14:00",
      "status": "confirmada",
      "observacoes": "Primeira carga do dia",
      "criado_em": "2024-09-29T10:30:00.000Z",
      "usuario_nome": "João Silva",
      "usuario_email": "joao.silva@email.com",
      "veiculo_modelo": "Tesla Model 3",
      "veiculo_placa": "ABC-1234",
      "estacao_nome": "EletroPosto Central",
      "estacao_cidade": "São Paulo",
      "estacao_estado": "SP",
      "estacao_preco": 0.85
    }
  ],
  "total": 12,
  "limit": 50,
  "offset": 0
}
```

## 🚨 Tratamento de Erros

### **Erros específicos:**
- **400:** Dados inválidos (data, horário, relacionamentos)
- **404:** Reserva não encontrada
- **409:** Conflito (horário já reservado)
- **500:** Erro interno do servidor

### **Validação de Status:**
```javascript
const statusValidos = ['pendente', 'confirmada', 'cancelada', 'concluida'];
if (!statusValidos.includes(status)) {
  return res.status(400).json({
    success: false,
    error: `Status deve ser um dos seguintes: ${statusValidos.join(', ')}`
  });
}
```

## ⚡ Otimizações

### **Índices no Banco:**
```sql
-- Índices para melhor performance
CREATE INDEX idx_reservas_usuario_id ON reservas(usuario_id);
CREATE INDEX idx_reservas_estacao_id ON reservas(estacao_id);
CREATE INDEX idx_reservas_veiculo_id ON reservas(veiculo_id);
CREATE INDEX idx_reservas_data_hora ON reservas(data, hora);
CREATE INDEX idx_reservas_status ON reservas(status);
CREATE INDEX idx_reservas_estacao_data_hora ON reservas(estacao_id, data, hora);
```

### **Constraint de Unicidade:**
```sql
-- Evitar reservas duplicadas
CREATE UNIQUE INDEX idx_reservas_unicas 
ON reservas(estacao_id, data, hora) 
WHERE status IN ('pendente', 'confirmada');
```

## 🧪 Testes da API

### **Teste de listagem:**
```bash
curl http://localhost:3000/api/reservas
```

### **Teste com filtros:**
```bash
curl "http://localhost:3000/api/reservas?usuario_id=1&status=confirmada&data_inicio=2024-01-15"
```

### **Teste de criação:**
```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "estacao_id": 1,
    "veiculo_id": 1,
    "data": "2024-01-25",
    "hora": "14:00",
    "observacoes": "Carga rápida"
  }'
```

### **Teste de atualização:**
```bash
curl -X PUT http://localhost:3000/api/reservas/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmada",
    "observacoes": "Reserva confirmada"
  }'
```

### **Teste de validação:**
```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 999,
    "estacao_id": 1,
    "veiculo_id": 1,
    "data": "2020-01-01",
    "hora": "25:00"
  }'
```

## 📊 Estatísticas de Reservas

### **Endpoint futuro: GET /api/reservas/stats**
```javascript
// Estatísticas por status
const statsByStatus = await db.query(`
  SELECT status, COUNT(*) as quantidade
  FROM reservas
  GROUP BY status
  ORDER BY quantidade DESC
`);

// Estatísticas por data
const statsByDate = await db.query(`
  SELECT data, COUNT(*) as quantidade
  FROM reservas
  WHERE data >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY data
  ORDER BY data DESC
`);

// Estatísticas por estação
const statsByStation = await db.query(`
  SELECT e.nome, COUNT(r.id) as total_reservas
  FROM estacoes e
  LEFT JOIN reservas r ON e.id = r.estacao_id
  GROUP BY e.id, e.nome
  ORDER BY total_reservas DESC
`);
```

## 🎯 Próximo Passo

Após implementar a API de reservas, prossiga para:
**[13-api-estatisticas.md](./13-api-estatisticas.md)** - Endpoints de estatísticas

---

**Tempo estimado:** 25-30 minutos  
**Dificuldade:** Intermediário  
**Próximo:** API de estatísticas
