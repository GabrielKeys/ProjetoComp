# 📊 Fase 13: API de Estatísticas

Este arquivo explica como implementar os endpoints para estatísticas e relatórios do sistema VoltWay.

## 📋 O que a API de Estatísticas faz

A API de estatísticas permite:
- **Dashboard geral** com métricas do sistema
- **Estatísticas de usuários** por região
- **Estatísticas de veículos** por modelo/ano
- **Estatísticas de estações** por cidade/potência
- **Estatísticas de reservas** por status/período
- **Relatórios personalizados** com filtros

## 🔍 Endpoint: GET /api/stats/dashboard

### **O que faz:**
Retorna estatísticas gerais do sistema para dashboard.

### **Dados retornados:**
- **Totais:** usuários, veículos, estações, reservas
- **Reservas por status:** confirmadas, pendentes, canceladas, concluídas
- **Estações por cidade:** distribuição geográfica
- **Veículos por ano:** distribuição temporal
- **Métricas de uso:** reservas por dia, estações mais usadas

### **Como funciona:**
1. **Executa múltiplas queries** em paralelo
2. **Agrega dados** de diferentes tabelas
3. **Calcula métricas** derivadas
4. **Retorna objeto** com todas as estatísticas

### **Query SQL base:**
```sql
-- Total de usuários
SELECT COUNT(*) as total_usuarios FROM usuarios WHERE tipo = 'usuario';

-- Total de veículos
SELECT COUNT(*) as total_veiculos FROM veiculos;

-- Total de estações
SELECT COUNT(*) as total_estacoes FROM estacoes;

-- Total de reservas
SELECT COUNT(*) as total_reservas FROM reservas;

-- Reservas por status
SELECT status, COUNT(*) as quantidade 
FROM reservas 
GROUP BY status;

-- Estações por cidade
SELECT cidade, COUNT(*) as quantidade 
FROM estacoes 
GROUP BY cidade 
ORDER BY quantidade DESC;

-- Veículos por ano
SELECT ano, COUNT(*) as quantidade 
FROM veiculos 
GROUP BY ano 
ORDER BY ano DESC;
```

## 🔍 Endpoint: GET /api/stats/usuarios

### **O que faz:**
Retorna estatísticas detalhadas dos usuários.

### **Dados retornados:**
- **Distribuição por tipo:** usuários vs estações
- **Distribuição geográfica:** por cidade/estado
- **Usuários ativos:** com veículos cadastrados
- **Usuários inativos:** sem veículos
- **Crescimento:** novos usuários por período

### **Métricas calculadas:**
```sql
-- Usuários por tipo
SELECT tipo, COUNT(*) as quantidade 
FROM usuarios 
GROUP BY tipo;

-- Usuários por cidade
SELECT cidade, estado, COUNT(*) as quantidade 
FROM usuarios 
WHERE tipo = 'usuario'
GROUP BY cidade, estado 
ORDER BY quantidade DESC;

-- Usuários com veículos
SELECT COUNT(DISTINCT u.id) as usuarios_com_veiculos
FROM usuarios u
JOIN veiculos v ON u.id = v.usuario_id
WHERE u.tipo = 'usuario';

-- Novos usuários por mês
SELECT 
  DATE_TRUNC('month', criado_em) as mes,
  COUNT(*) as novos_usuarios
FROM usuarios 
WHERE tipo = 'usuario'
GROUP BY mes 
ORDER BY mes DESC;
```

## 🔍 Endpoint: GET /api/stats/veiculos

### **O que faz:**
Retorna estatísticas detalhadas dos veículos.

### **Dados retornados:**
- **Distribuição por modelo:** marcas mais populares
- **Distribuição por ano:** veículos por ano de fabricação
- **Distribuição por bateria:** capacidades mais comuns
- **Distribuição por carga:** tipos de carregamento
- **Veículos por usuário:** média de veículos por dono

### **Métricas calculadas:**
```sql
-- Veículos por modelo
SELECT modelo, COUNT(*) as quantidade 
FROM veiculos 
GROUP BY modelo 
ORDER BY quantidade DESC;

-- Veículos por ano
SELECT ano, COUNT(*) as quantidade 
FROM veiculos 
GROUP BY ano 
ORDER BY ano DESC;

-- Veículos por capacidade de bateria
SELECT bateria, COUNT(*) as quantidade 
FROM veiculos 
WHERE bateria IS NOT NULL
GROUP BY bateria 
ORDER BY quantidade DESC;

-- Veículos por tipo de carga
SELECT carga, COUNT(*) as quantidade 
FROM veiculos 
WHERE carga IS NOT NULL
GROUP BY carga 
ORDER BY quantidade DESC;

-- Média de veículos por usuário
SELECT 
  COUNT(*) as total_veiculos,
  COUNT(DISTINCT usuario_id) as total_usuarios,
  ROUND(COUNT(*)::DECIMAL / COUNT(DISTINCT usuario_id), 2) as media_veiculos_por_usuario
FROM veiculos;
```

## 🔍 Endpoint: GET /api/stats/estacoes

### **O que faz:**
Retorna estatísticas detalhadas das estações.

### **Dados retornados:**
- **Distribuição geográfica:** por cidade/estado
- **Distribuição por potência:** faixas de potência
- **Distribuição de preços:** faixas de preço
- **Estações ativas/inativas:** status operacional
- **Tempo de espera:** médias por estação

### **Métricas calculadas:**
```sql
-- Estações por cidade
SELECT cidade, estado, COUNT(*) as quantidade 
FROM estacoes 
GROUP BY cidade, estado 
ORDER BY quantidade DESC;

-- Estações por faixa de potência
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
ORDER BY quantidade DESC;

-- Estações por faixa de preço
SELECT 
  CASE 
    WHEN preco <= 0.50 THEN 'Baixo (≤R$0,50)'
    WHEN preco <= 0.80 THEN 'Médio (R$0,51-0,80)'
    WHEN preco <= 1.00 THEN 'Alto (R$0,81-1,00)'
    ELSE 'Muito Alto (>R$1,00)'
  END as categoria,
  COUNT(*) as quantidade
FROM estacoes
GROUP BY categoria
ORDER BY quantidade DESC;

-- Estações ativas vs inativas
SELECT ativa, COUNT(*) as quantidade 
FROM estacoes 
GROUP BY ativa;

-- Tempo de espera médio
SELECT 
  AVG(tempo_espera) as tempo_medio,
  MIN(tempo_espera) as tempo_minimo,
  MAX(tempo_espera) as tempo_maximo
FROM estacoes 
WHERE tempo_espera > 0;
```

## 🔍 Endpoint: GET /api/stats/reservas

### **O que faz:**
Retorna estatísticas detalhadas das reservas.

### **Dados retornados:**
- **Reservas por status:** distribuição atual
- **Reservas por período:** diárias, semanais, mensais
- **Reservas por estação:** estações mais usadas
- **Reservas por usuário:** usuários mais ativos
- **Taxa de cancelamento:** percentual de cancelamentos

### **Métricas calculadas:**
```sql
-- Reservas por status
SELECT status, COUNT(*) as quantidade 
FROM reservas 
GROUP BY status 
ORDER BY quantidade DESC;

-- Reservas por dia da semana
SELECT 
  EXTRACT(DOW FROM data) as dia_semana,
  COUNT(*) as quantidade
FROM reservas 
GROUP BY dia_semana 
ORDER BY dia_semana;

-- Reservas por horário
SELECT 
  EXTRACT(HOUR FROM hora) as hora,
  COUNT(*) as quantidade
FROM reservas 
GROUP BY hora 
ORDER BY hora;

-- Estações mais usadas
SELECT 
  e.nome,
  e.cidade,
  COUNT(r.id) as total_reservas
FROM estacoes e
LEFT JOIN reservas r ON e.id = r.estacao_id
GROUP BY e.id, e.nome, e.cidade
ORDER BY total_reservas DESC
LIMIT 10;

-- Usuários mais ativos
SELECT 
  u.nome,
  u.cidade,
  COUNT(r.id) as total_reservas
FROM usuarios u
LEFT JOIN reservas r ON u.id = r.usuario_id
WHERE u.tipo = 'usuario'
GROUP BY u.id, u.nome, u.cidade
ORDER BY total_reservas DESC
LIMIT 10;

-- Taxa de cancelamento
SELECT 
  COUNT(*) as total_reservas,
  COUNT(CASE WHEN status = 'cancelada' THEN 1 END) as reservas_canceladas,
  ROUND(
    COUNT(CASE WHEN status = 'cancelada' THEN 1 END)::DECIMAL / COUNT(*) * 100, 
    2
  ) as taxa_cancelamento
FROM reservas;
```

## 🔍 Endpoint: GET /api/stats/relatorio

### **O que faz:**
Retorna relatório personalizado com filtros.

### **Parâmetros de Query:**
- `tipo` - Tipo de relatório (usuarios, veiculos, estacoes, reservas)
- `periodo_inicio` - Data inicial (YYYY-MM-DD)
- `periodo_fim` - Data final (YYYY-MM-DD)
- `cidade` - Filtrar por cidade
- `estado` - Filtrar por estado
- `formato` - Formato de saída (json, csv)

### **Como funciona:**
1. **Valida parâmetros** de entrada
2. **Constrói query** baseada no tipo e filtros
3. **Executa query** com parâmetros
4. **Formata resposta** conforme solicitado

## 📊 Agregações Complexas

### **Métricas de Performance:**
```sql
-- Reservas por hora do dia
SELECT 
  EXTRACT(HOUR FROM hora) as hora,
  COUNT(*) as quantidade,
  ROUND(COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM reservas) * 100, 2) as percentual
FROM reservas 
GROUP BY hora 
ORDER BY hora;

-- Crescimento mensal de reservas
SELECT 
  DATE_TRUNC('month', criado_em) as mes,
  COUNT(*) as novas_reservas,
  SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', criado_em)) as total_acumulado
FROM reservas 
GROUP BY mes 
ORDER BY mes;
```

### **Métricas de Negócio:**
```sql
-- Receita potencial por estação
SELECT 
  e.nome,
  e.cidade,
  e.preco,
  COUNT(r.id) as total_reservas,
  ROUND(e.preco * COUNT(r.id), 2) as receita_potencial
FROM estacoes e
LEFT JOIN reservas r ON e.id = r.estacao_id
WHERE r.status = 'confirmada'
GROUP BY e.id, e.nome, e.cidade, e.preco
ORDER BY receita_potencial DESC;

-- Eficiência das estações
SELECT 
  e.nome,
  e.cidade,
  e.potencia,
  COUNT(r.id) as total_reservas,
  ROUND(COUNT(r.id)::DECIMAL / e.potencia, 2) as eficiencia
FROM estacoes e
LEFT JOIN reservas r ON e.id = r.estacao_id
GROUP BY e.id, e.nome, e.cidade, e.potencia
ORDER BY eficiencia DESC;
```

## 🚨 Tratamento de Erros

### **Erros específicos:**
- **400:** Parâmetros inválidos
- **500:** Erro interno do servidor

### **Validação de parâmetros:**
```javascript
// Validar formato de data
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (periodo_inicio && !dateRegex.test(periodo_inicio)) {
  return res.status(400).json({
    success: false,
    error: 'Formato de data inválido (YYYY-MM-DD)'
  });
}

// Validar período
if (periodo_inicio && periodo_fim && periodo_inicio > periodo_fim) {
  return res.status(400).json({
    success: false,
    error: 'Data inicial deve ser anterior à data final'
  });
}
```

## ⚡ Otimizações

### **Índices para estatísticas:**
```sql
-- Índices para melhor performance das consultas
CREATE INDEX idx_usuarios_tipo_criado_em ON usuarios(tipo, criado_em);
CREATE INDEX idx_veiculos_ano_modelo ON veiculos(ano, modelo);
CREATE INDEX idx_estacoes_cidade_ativa ON estacoes(cidade, ativa);
CREATE INDEX idx_reservas_data_status ON reservas(data, status);
CREATE INDEX idx_reservas_criado_em ON reservas(criado_em);
```

### **Cache de estatísticas:**
```javascript
// Cache simples para estatísticas que não mudam frequentemente
const statsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const getCachedStats = async (key, queryFunction) => {
  if (statsCache.has(key)) {
    const { data, timestamp } = statsCache.get(key);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  const data = await queryFunction();
  statsCache.set(key, { data, timestamp: Date.now() });
  return data;
};
```

## 🧪 Testes da API

### **Teste de dashboard:**
```bash
curl http://localhost:3000/api/stats/dashboard
```

### **Teste de estatísticas de usuários:**
```bash
curl http://localhost:3000/api/stats/usuarios
```

### **Teste de relatório personalizado:**
```bash
curl "http://localhost:3000/api/stats/relatorio?tipo=reservas&periodo_inicio=2024-01-01&periodo_fim=2024-01-31"
```

### **Teste com filtros:**
```bash
curl "http://localhost:3000/api/stats/estacoes?cidade=São Paulo&estado=SP"
```

## 📊 Exemplo de Resposta

### **Dashboard completo:**
```json
{
  "success": true,
  "data": {
    "totais": {
      "usuarios": 6,
      "veiculos": 7,
      "estacoes": 11,
      "reservas": 12
    },
    "reservas_por_status": {
      "confirmada": 6,
      "pendente": 4,
      "cancelada": 1,
      "concluida": 1
    },
    "estacoes_por_cidade": [
      { "cidade": "São Paulo", "quantidade": 4 },
      { "cidade": "Rio de Janeiro", "quantidade": 2 },
      { "cidade": "Belo Horizonte", "quantidade": 2 }
    ],
    "veiculos_por_ano": [
      { "ano": 2023, "quantidade": 5 },
      { "ano": 2022, "quantidade": 2 }
    ],
    "metricas": {
      "taxa_cancelamento": 8.33,
      "media_veiculos_por_usuario": 1.17,
      "estacoes_ativas": 11
    }
  }
}
```

## 🎯 Próximo Passo

Após implementar a API de estatísticas, prossiga para:
**[14-autenticacao.md](./14-autenticacao.md)** - Sistema de autenticação JWT

---

**Tempo estimado:** 20-25 minutos  
**Dificuldade:** Intermediário  
**Próximo:** Sistema de autenticação
