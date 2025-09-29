# 🧪 Guia de Testes da API

Este guia mostra como testar todos os endpoints da API VoltWay para garantir que tudo está funcionando corretamente.

## 📋 Pré-requisitos

- ✅ Servidor backend rodando na porta 3000
- ✅ Banco de dados configurado com dados de teste
- ✅ Ferramenta para fazer requisições HTTP (curl, Postman, Thunder Client)

## 🛠️ Ferramentas de Teste

### **Opção 1: curl (Terminal)**
```bash
# Teste básico
curl http://localhost:3000

# Com formatação JSON
curl -s http://localhost:3000 | jq
```

### **Opção 2: Thunder Client (VS Code)**
- Instalar extensão Thunder Client
- Criar coleção de testes
- Importar requisições

### **Opção 3: Postman**
- Baixar Postman
- Criar workspace
- Importar coleção

---

## 🚀 Testes Básicos

### **1. Teste de Conectividade**
```bash
# Verificar se servidor está rodando
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

### **2. Health Check**
```bash
# Verificar saúde do sistema
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

---

## 👥 Testes de Usuários

### **1. Listar Todos os Usuários**
```bash
curl http://localhost:3000/api/usuarios
```

### **2. Listar Usuários com Filtros**
```bash
# Filtrar por tipo
curl "http://localhost:3000/api/usuarios?tipo=usuario"

# Filtrar por cidade
curl "http://localhost:3000/api/usuarios?cidade=São Paulo"

# Filtrar por estado
curl "http://localhost:3000/api/usuarios?estado=SP"

# Combinar filtros
curl "http://localhost:3000/api/usuarios?tipo=usuario&cidade=São Paulo"
```

### **3. Buscar Usuário por ID**
```bash
# Buscar usuário específico
curl http://localhost:3000/api/usuarios/1
```

### **4. Criar Novo Usuário**
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste Usuario",
    "email": "teste@email.com",
    "tipo": "usuario",
    "cidade": "São Paulo",
    "estado": "SP"
  }'
```

### **5. Testar Validações**
```bash
# Testar email duplicado
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste Duplicado",
    "email": "joao.silva@email.com",
    "tipo": "usuario"
  }'
```

**Resultado esperado:** Erro 409 - Email já está em uso

---

## 🚗 Testes de Veículos

### **1. Listar Veículos**
```bash
curl http://localhost:3000/api/veiculos
```

### **2. Filtrar Veículos**
```bash
# Por usuário
curl "http://localhost:3000/api/veiculos?usuario_id=1"

# Por modelo
curl "http://localhost:3000/api/veiculos?modelo=Tesla"

# Por ano
curl "http://localhost:3000/api/veiculos?ano=2023"
```

---

## ⚡ Testes de Estações

### **1. Listar Estações**
```bash
curl http://localhost:3000/api/estacoes
```

### **2. Filtrar Estações**
```bash
# Por cidade
curl "http://localhost:3000/api/estacoes?cidade=São Paulo"

# Por estado
curl "http://localhost:3000/api/estacoes?estado=SP"

# Por potência mínima
curl "http://localhost:3000/api/estacoes?potencia_min=50"

# Por potência máxima
curl "http://localhost:3000/api/estacoes?potencia_max=100"

# Por preço máximo
curl "http://localhost:3000/api/estacoes?preco_max=1.00"

# Apenas ativas
curl "http://localhost:3000/api/estacoes?ativa=true"
```

---

## 📅 Testes de Reservas

### **1. Listar Reservas**
```bash
curl http://localhost:3000/api/reservas
```

### **2. Filtrar Reservas**
```bash
# Por usuário
curl "http://localhost:3000/api/reservas?usuario_id=1"

# Por estação
curl "http://localhost:3000/api/reservas?estacao_id=1"

# Por veículo
curl "http://localhost:3000/api/reservas?veiculo_id=1"

# Por status
curl "http://localhost:3000/api/reservas?status=confirmada"

# Por período
curl "http://localhost:3000/api/reservas?data_inicio=2024-01-15&data_fim=2024-01-20"
```

### **3. Criar Nova Reserva**
```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "estacao_id": 1,
    "veiculo_id": 1,
    "data": "2024-01-25",
    "hora": "14:00",
    "observacoes": "Teste de reserva"
  }'
```

### **4. Testar Constraint de Reserva Única**
```bash
# Tentar criar reserva duplicada
curl -X POST http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 2,
    "estacao_id": 1,
    "veiculo_id": 2,
    "data": "2024-01-15",
    "hora": "14:00"
  }'
```

**Resultado esperado:** Erro 409 - Já existe uma reserva para este horário

---

## 📊 Testes de Estatísticas

### **1. Dashboard Geral**
```bash
curl http://localhost:3000/api/stats/dashboard
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "total_usuarios": "6",
    "total_veiculos": "7",
    "total_estacoes": "11",
    "total_reservas": "12",
    "reservas_por_status": {
      "confirmada": 6,
      "pendente": 4,
      "cancelada": 1,
      "concluida": 1
    },
    "estacoes_por_cidade": [
      { "cidade": "São Paulo", "quantidade": "4" },
      { "cidade": "Rio de Janeiro", "quantidade": "2" },
      ...
    ]
  }
}
```

---

## 🔍 Testes de Views

### **1. View de Reservas Completas**
```bash
# Testar view diretamente no banco
psql -U voltway_user -d voltway -c "
SELECT usuario_nome, estacao_nome, data, hora, status 
FROM vw_reservas_completas 
LIMIT 5;
"
```

### **2. View de Estatísticas das Estações**
```bash
psql -U voltway_user -d voltway -c "
SELECT nome, cidade, total_reservas, reservas_confirmadas 
FROM vw_estatisticas_estacoes 
ORDER BY total_reservas DESC;
"
```

---

## ⚡ Testes de Performance

### **1. Teste de Múltiplas Requisições**
```bash
# Script para testar performance
for i in {1..10}; do
  curl -s http://localhost:3000/api/usuarios > /dev/null
  echo "Requisição $i concluída"
done
```

### **2. Teste de Concorrência**
```bash
# Executar múltiplas requisições simultaneamente
curl http://localhost:3000/api/usuarios &
curl http://localhost:3000/api/estacoes &
curl http://localhost:3000/api/veiculos &
curl http://localhost:3000/api/reservas &
wait
```

---

## 🚨 Testes de Erro

### **1. Endpoint Inexistente**
```bash
curl http://localhost:3000/api/endpoint-inexistente
```

**Resultado esperado:** 404 - Endpoint não encontrado

### **2. ID Inexistente**
```bash
curl http://localhost:3000/api/usuarios/999
```

**Resultado esperado:** 404 - Usuário não encontrado

### **3. Dados Inválidos**
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "",
    "email": "email-invalido"
  }'
```

**Resultado esperado:** 400 - Dados inválidos

---

## 📋 Script de Teste Automatizado

### **Criar arquivo test-api.sh**
```bash
#!/bin/bash

echo "🧪 Iniciando testes da API VoltWay..."

# Teste 1: Conectividade
echo "1. Testando conectividade..."
curl -s http://localhost:3000 > /dev/null && echo "✅ Servidor respondendo" || echo "❌ Servidor não responde"

# Teste 2: Health Check
echo "2. Testando health check..."
curl -s http://localhost:3000/api/health | jq -r '.status' | grep -q "healthy" && echo "✅ Health check OK" || echo "❌ Health check falhou"

# Teste 3: Usuários
echo "3. Testando endpoint de usuários..."
curl -s http://localhost:3000/api/usuarios | jq -r '.success' | grep -q "true" && echo "✅ Usuários OK" || echo "❌ Usuários falhou"

# Teste 4: Estações
echo "4. Testando endpoint de estações..."
curl -s http://localhost:3000/api/estacoes | jq -r '.success' | grep -q "true" && echo "✅ Estações OK" || echo "❌ Estações falhou"

# Teste 5: Veículos
echo "5. Testando endpoint de veículos..."
curl -s http://localhost:3000/api/veiculos | jq -r '.success' | grep -q "true" && echo "✅ Veículos OK" || echo "❌ Veículos falhou"

# Teste 6: Reservas
echo "6. Testando endpoint de reservas..."
curl -s http://localhost:3000/api/reservas | jq -r '.success' | grep -q "true" && echo "✅ Reservas OK" || echo "❌ Reservas falhou"

# Teste 7: Estatísticas
echo "7. Testando endpoint de estatísticas..."
curl -s http://localhost:3000/api/stats/dashboard | jq -r '.success' | grep -q "true" && echo "✅ Estatísticas OK" || echo "❌ Estatísticas falhou"

echo "🎉 Testes concluídos!"
```

### **Executar script**
```bash
# Dar permissão de execução
chmod +x test-api.sh

# Executar testes
./test-api.sh
```

---

## 📊 Relatório de Testes

### **Checklist de Funcionamento:**
- [ ] Servidor responde na porta 3000
- [ ] Health check retorna status "healthy"
- [ ] Endpoint de usuários retorna dados
- [ ] Endpoint de veículos retorna dados
- [ ] Endpoint de estações retorna dados
- [ ] Endpoint de reservas retorna dados
- [ ] Endpoint de estatísticas retorna dados
- [ ] Filtros funcionam corretamente
- [ ] Criação de registros funciona
- [ ] Validações funcionam
- [ ] Tratamento de erros funciona
- [ ] Views do banco funcionam

### **Métricas de Performance:**
- [ ] Resposta < 200ms para consultas simples
- [ ] Resposta < 500ms para consultas complexas
- [ ] Suporta 10+ requisições simultâneas
- [ ] Sem vazamentos de memória
- [ ] Conexões com banco estáveis

---

## 🎯 Próximo Passo

Após completar os testes, prossiga para:
**[19-documentacao.md](./19-documentacao.md)** - Documentação completa da API

---

**Tempo estimado:** 30-45 minutos  
**Dificuldade:** Intermediário  
**Próximo:** Documentação da API
