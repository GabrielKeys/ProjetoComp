# 🚨 Guia de Resolução de Problemas

Este guia contém soluções para os problemas mais comuns encontrados durante o desenvolvimento do backend VoltWay.

## 📋 Índice de Problemas

### **🔧 Problemas de Instalação**
- [Node.js não encontrado](#nodejs-nao-encontrado)
- [PostgreSQL não inicia](#postgresql-nao-inicia)
- [Dependências não instalam](#dependencias-nao-instalam)

### **🗄️ Problemas de Banco de Dados**
- [Conexão recusada](#conexao-recusada)
- [Autenticação falhou](#autenticacao-falhou)
- [Permissões negadas](#permissoes-negadas)
- [Tabelas não existem](#tabelas-nao-existem)

### **⚙️ Problemas do Backend**
- [Servidor não inicia](#servidor-nao-inicia)
- [Porta já em uso](#porta-ja-em-uso)
- [Arquivo .env não carrega](#arquivo-env-nao-carrega)
- [Módulos não encontrados](#modulos-nao-encontrados)

### **🔌 Problemas de API**
- [Endpoints não respondem](#endpoints-nao-respondem)
- [Erro 500 interno](#erro-500-interno)
- [CORS bloqueado](#cors-bloqueado)
- [Dados não retornam](#dados-nao-retornam)

---

## 🔧 Problemas de Instalação

### **Node.js não encontrado**
**Erro:** `'node' is not recognized as an internal or external command`

**Soluções:**
```bash
# 1. Verificar se está instalado
node --version

# 2. Se não estiver, reinstalar Node.js
# Baixar de: https://nodejs.org/
# Marcar "Add to PATH" durante instalação

# 3. Adicionar manualmente ao PATH
$env:PATH += ";C:\Program Files\nodejs\"

# 4. Reiniciar terminal
```

### **PostgreSQL não inicia**
**Erro:** `The PostgreSQL service is not running`

**Soluções:**
```bash
# 1. Verificar status do serviço
Get-Service | Where-Object {$_.Name -like "*postgres*"}

# 2. Iniciar serviço
Start-Service postgresql-x64-16

# 3. Configurar para iniciar automaticamente
Set-Service postgresql-x64-16 -StartupType Automatic

# 4. Verificar logs de erro
Get-EventLog -LogName Application -Source PostgreSQL -Newest 5
```

### **Dependências não instalam**
**Erro:** `npm ERR! network timeout` ou `npm ERR! EACCES`

**Soluções:**
```bash
# 1. Limpar cache do npm
npm cache clean --force

# 2. Deletar node_modules e package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 3. Reinstalar dependências
npm install

# 4. Se persistir, usar registry diferente
npm install --registry https://registry.npmjs.org/
```

---

## 🗄️ Problemas de Banco de Dados

### **Conexão recusada**
**Erro:** `ECONNREFUSED` ou `connection refused`

**Soluções:**
```bash
# 1. Verificar se PostgreSQL está rodando
Get-Service postgresql-x64-16

# 2. Verificar porta
netstat -an | findstr :5432

# 3. Testar conexão manual
psql -U postgres -h localhost -p 5432

# 4. Verificar configuração no .env
cat .env | grep DB_
```

### **Autenticação falhou**
**Erro:** `authentication failed for user "voltway_user"`

**Soluções:**
```bash
# 1. Verificar senha no .env
echo $env:DB_PASSWORD

# 2. Testar com senha correta
psql -U voltway_user -d voltway -c "SELECT 1;"

# 3. Recriar usuário se necessário
psql -U postgres -c "
DROP USER IF EXISTS voltway_user;
CREATE USER voltway_user WITH PASSWORD 'voltway123';
GRANT ALL PRIVILEGES ON DATABASE voltway TO voltway_user;
"
```

### **Permissões negadas**
**Erro:** `permission denied for schema public`

**Soluções:**
```sql
-- 1. Conectar como postgres e dar permissões
psql -U postgres -d voltway

-- 2. Dar permissões no schema
GRANT ALL PRIVILEGES ON SCHEMA public TO voltway_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO voltway_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO voltway_user;

-- 3. Dar permissão para criar tabelas
GRANT CREATE ON SCHEMA public TO voltway_user;
```

### **Tabelas não existem**
**Erro:** `relation "usuarios" does not exist`

**Soluções:**
```bash
# 1. Verificar se schema foi executado
psql -U voltway_user -d voltway -c "\dt"

# 2. Executar schema novamente
psql -U postgres -d voltway -f database/schema.sql

# 3. Verificar se usuário tem permissões
psql -U postgres -d voltway -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
"
```

---

## ⚙️ Problemas do Backend

### **Servidor não inicia**
**Erro:** `Error: Cannot find module` ou `EADDRINUSE`

**Soluções:**
```bash
# 1. Verificar se todas as dependências estão instaladas
npm list

# 2. Verificar se arquivos existem
Test-Path config/database.js
Test-Path server.js

# 3. Verificar se porta está livre
netstat -ano | findstr :3000

# 4. Usar porta diferente
# Editar .env: PORT=3001
```

### **Porta já em uso**
**Erro:** `EADDRINUSE: address already in use :::3000`

**Soluções:**
```bash
# 1. Encontrar processo usando a porta
netstat -ano | findstr :3000

# 2. Matar processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F

# 3. Ou usar porta diferente
# Editar .env: PORT=3001

# 4. Reiniciar servidor
npm start
```

### **Arquivo .env não carrega**
**Erro:** `process.env.DB_USER is undefined`

**Soluções:**
```bash
# 1. Verificar se arquivo existe
Test-Path .env

# 2. Verificar conteúdo
Get-Content .env

# 3. Verificar se está na pasta correta
# .env deve estar na pasta backend/

# 4. Recriar arquivo se necessário
@"
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voltway
DB_USER=voltway_user
DB_PASSWORD=voltway123
"@ | Out-File -FilePath .env -Encoding UTF8
```

### **Módulos não encontrados**
**Erro:** `Cannot find module 'express'`

**Soluções:**
```bash
# 1. Verificar se node_modules existe
Test-Path node_modules

# 2. Reinstalar dependências
npm install

# 3. Verificar package.json
Get-Content package.json

# 4. Instalar dependência específica
npm install express
```

---

## 🔌 Problemas de API

### **Endpoints não respondem**
**Erro:** `404 Not Found` ou timeout

**Soluções:**
```bash
# 1. Verificar se servidor está rodando
curl http://localhost:3000

# 2. Verificar logs do servidor
# Olhar console onde o servidor está rodando

# 3. Testar endpoint específico
curl http://localhost:3000/api/health

# 4. Verificar se rota está definida no server.js
```

### **Erro 500 interno**
**Erro:** `500 Internal Server Error`

**Soluções:**
```bash
# 1. Verificar logs do servidor
# Olhar console para mensagens de erro

# 2. Verificar conexão com banco
curl http://localhost:3000/api/health

# 3. Testar query manual
psql -U voltway_user -d voltway -c "SELECT COUNT(*) FROM usuarios;"

# 4. Verificar se tabelas existem
psql -U voltway_user -d voltway -c "\dt"
```

### **CORS bloqueado**
**Erro:** `Access to fetch at 'http://localhost:3000' from origin 'http://localhost:8080' has been blocked by CORS policy`

**Soluções:**
```javascript
// 1. Verificar se CORS está configurado no server.js
const cors = require('cors');
app.use(cors());

// 2. Configurar CORS específico se necessário
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));

// 3. Verificar se frontend está fazendo requisição correta
```

### **Dados não retornam**
**Erro:** API retorna array vazio ou null

**Soluções:**
```bash
# 1. Verificar se há dados no banco
psql -U voltway_user -d voltway -c "SELECT COUNT(*) FROM usuarios;"

# 2. Testar query manual
psql -U voltway_user -d voltway -c "SELECT * FROM usuarios LIMIT 5;"

# 3. Verificar logs do servidor
# Olhar console para mensagens de query

# 4. Verificar se parâmetros estão corretos
curl "http://localhost:3000/api/usuarios?limit=10"
```

---

## 🔍 Comandos de Diagnóstico

### **Verificar Status Geral**
```bash
# Status do sistema
Get-Service | Where-Object {$_.Name -like "*postgres*"}
node --version
npm --version

# Status do projeto
Test-Path .env
Test-Path config/database.js
Test-Path server.js
```

### **Verificar Banco de Dados**
```bash
# Conexão
psql -U voltway_user -d voltway -c "SELECT version();"

# Tabelas
psql -U voltway_user -d voltway -c "\dt"

# Dados
psql -U voltway_user -d voltway -c "SELECT COUNT(*) FROM usuarios;"
```

### **Verificar Backend**
```bash
# Dependências
npm list

# Variáveis de ambiente
node -e "require('dotenv').config(); console.log(process.env.DB_HOST);"

# Teste de conexão
node -e "
const db = require('./config/database');
db.testConnection().then(() => console.log('OK')).catch(err => console.error(err));
"
```

### **Verificar API**
```bash
# Health check
curl http://localhost:3000/api/health

# Endpoints
curl http://localhost:3000/api/usuarios
curl http://localhost:3000/api/estacoes
```

---

## 📞 Quando Pedir Ajuda

### **Informações para Incluir:**
1. **Sistema operacional:** Windows 10/11
2. **Versões:** Node.js, PostgreSQL, npm
3. **Mensagem de erro completa**
4. **Passos que levaram ao erro**
5. **Logs do servidor/banco**
6. **Conteúdo do arquivo .env** (sem senhas)

### **Comandos para Coletar Informações:**
```bash
# Informações do sistema
node --version
npm --version
psql --version

# Status dos serviços
Get-Service | Where-Object {$_.Name -like "*postgres*"}

# Logs do servidor
# Copiar saída do console quando o erro ocorre

# Status do banco
psql -U voltway_user -d voltway -c "\dt"
```

---

## 🎯 Próximos Passos

Após resolver os problemas, continue com:
- **[18-testes.md](./18-testes.md)** - Como testar a API
- **[19-documentacao.md](./19-documentacao.md)** - Documentação da API
- **[20-deploy.md](./20-deploy.md)** - Preparação para produção

---

**Última atualização:** 29/09/2024  
**Versão:** 1.0.0
