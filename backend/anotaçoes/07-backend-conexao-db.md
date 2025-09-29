# 🔌 Fase 7: Detalhes da Conexão com Banco de Dados

Este arquivo explica como funciona a conexão com o PostgreSQL no arquivo `config/database.js`.

## 📋 O que este arquivo faz

O arquivo `config/database.js` é o **coração da comunicação** entre o backend Node.js e o banco PostgreSQL. Ele gerencia:

### **1. Pool de Conexões**
- **O que é:** Um conjunto de conexões reutilizáveis com o banco
- **Por que usar:** Evita criar/destruir conexões a cada requisição
- **Configuração:** Máximo 20 conexões simultâneas

### **2. Configuração de Conexão**
- **Variáveis de ambiente:** Usa dados do arquivo `.env`
- **Fallbacks:** Valores padrão caso `.env` não esteja configurado
- **Timeouts:** Configurações para evitar travamentos

### **3. Eventos de Conexão**
- **on('connect'):** Log quando conecta com sucesso
- **on('error'):** Trata erros de conexão e encerra o processo

## 🔧 Funções Principais

### **testConnection()**
- **Propósito:** Verifica se o banco está acessível
- **O que faz:** Executa uma query simples (`SELECT NOW()`)
- **Retorna:** `true` se conectou, `false` se falhou

### **query(text, params)**
- **Propósito:** Executa queries SQL de forma segura
- **O que faz:** 
  - Usa prepared statements (evita SQL injection)
  - Mede tempo de execução
  - Loga queries para debug
- **Retorna:** Resultado da query ou erro

### **transaction(callback)**
- **Propósito:** Executa operações em transação
- **O que faz:**
  - Inicia transação (`BEGIN`)
  - Executa callback com cliente
  - Confirma (`COMMIT`) ou desfaz (`ROLLBACK`)
- **Uso:** Para operações que precisam ser atômicas

### **checkTables()**
- **Propósito:** Verifica se todas as tabelas existem
- **O que faz:** Consulta `information_schema.tables`
- **Valida:** Se tabelas `usuarios`, `veiculos`, `estacoes`, `reservas` existem

### **getStats()**
- **Propósito:** Retorna estatísticas do banco
- **O que faz:** Conta registros em cada tabela
- **Uso:** Para health check e monitoramento

### **closePool()**
- **Propósito:** Fecha todas as conexões
- **Quando usar:** Ao encerrar o servidor
- **Importante:** Evita vazamentos de conexão

## 🚀 Como Usar no Código

### **Importar o módulo:**
```javascript
const db = require('./config/database');
```

### **Executar query simples:**
```javascript
const result = await db.query('SELECT * FROM usuarios WHERE id = $1', [1]);
```

### **Executar transação:**
```javascript
const result = await db.transaction(async (client) => {
  const user = await client.query('INSERT INTO usuarios...');
  const vehicle = await client.query('INSERT INTO veiculos...');
  return { user: user.rows[0], vehicle: vehicle.rows[0] };
});
```

### **Verificar saúde do banco:**
```javascript
const isHealthy = await db.testConnection();
const stats = await db.getStats();
```

## 🔍 Logs e Debug

### **O que é logado:**
- ✅ Conexões estabelecidas
- 📝 Queries executadas (texto, duração, linhas afetadas)
- ❌ Erros de conexão
- 📊 Estatísticas do banco

### **Exemplo de log:**
```
✅ Conectado ao banco de dados PostgreSQL
📝 Query executada: { text: 'SELECT * FROM usuarios', duration: 15, rows: 8 }
📊 Estatísticas do banco:
   usuarios: 8 registros
   veiculos: 7 registros
```

## 🚨 Tratamento de Erros

### **Tipos de erro tratados:**
- **Conexão recusada:** Banco não está rodando
- **Autenticação falhou:** Credenciais incorretas
- **Query inválida:** SQL malformado
- **Timeout:** Query demorou muito

### **Como são tratados:**
- **Logs detalhados** para debug
- **Encerramento gracioso** em erros críticos
- **Retorno de erros** para o código que chama

## ⚡ Otimizações

### **Pool de Conexões:**
- **Máximo 20 conexões** para evitar sobrecarga
- **Timeout de 30s** para conexões ociosas
- **Timeout de 2s** para estabelecer conexão

### **Prepared Statements:**
- **Proteção contra SQL injection**
- **Melhor performance** para queries repetidas
- **Validação automática** de parâmetros

## 🎯 Próximo Passo

Após entender a conexão com banco, prossiga para:
**[08-backend-middlewares.md](./08-backend-middlewares.md)** - Middlewares e configurações

---

**Tempo estimado:** 10-15 minutos  
**Dificuldade:** Intermediário  
**Próximo:** Middlewares do Express
