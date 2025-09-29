# 🗄️ Fase 3: Configuração do Banco de Dados PostgreSQL

Agora vamos configurar o PostgreSQL para o projeto VoltWay, criando o banco de dados e usuário específico.

## 📋 Pré-requisitos

- ✅ PostgreSQL instalado e rodando
- ✅ Senha do usuário `postgres` anotada
- ✅ Terminal/PowerShell funcionando

## 🚀 Passo 1: Verificar PostgreSQL

### **1.1 Verificar se está rodando**
```bash
# Verificar serviço do PostgreSQL
Get-Service | Where-Object {$_.Name -like "*postgres*"}
```

**Resultado esperado:**
```
Status   Name               DisplayName
------   ----               -----------
Running  postgresql-x64-16  postgresql-x64-16
```

### **1.2 Testar conexão**
```bash
# Testar conexão com postgres (substitua 'sua_senha' pela senha real)
psql -U postgres -c "SELECT version();"
```

**Resultado esperado:**
```
                                 version
-------------------------------------------------------------------------
 PostgreSQL 16.0 on x86_64-windows, compiled by msvc-19.44.35215, 64-bit
(1 row)
```

---

## 🏗️ Passo 2: Criar Banco de Dados

### **2.1 Conectar como superusuário**
```bash
# Conectar ao PostgreSQL como postgres
psql -U postgres
```

### **2.2 Criar banco de dados**
```sql
-- Criar o banco de dados voltway
CREATE DATABASE voltway;

-- Verificar se foi criado
\l
```

**Resultado esperado:**
```
                                  List of databases
   Name    |  Owner   | Encoding |   Collate   |    Ctype    |   Access privileges
-----------+----------+----------+-------------+-------------+---------------------
 postgres  | postgres | UTF8     | Portuguese_Brazil.1252 | Portuguese_Brazil.1252 |
 template0 | postgres | UTF8     | Portuguese_Brazil.1252 | Portuguese_Brazil.1252 | =c/postgres          +
           |          |          |             |             | postgres=CTc/postgres
 template1 | postgres | UTF8     | Portuguese_Brazil.1252 | Portuguese_Brazil.1252 | =c/postgres          +
           |          |          |             |             | postgres=CTc/postgres
 voltway   | postgres | UTF8     | Portuguese_Brazil.1252 | Portuguese_Brazil.1252 |
```

### **2.3 Sair do psql**
```sql
\q
```

---

## 👤 Passo 3: Criar Usuário Específico

### **3.1 Conectar novamente como postgres**
```bash
psql -U postgres
```

### **3.2 Criar usuário voltway_user**
```sql
-- Criar usuário específico para o projeto
CREATE USER voltway_user WITH PASSWORD 'voltway123';

-- Dar permissões no banco voltway
GRANT ALL PRIVILEGES ON DATABASE voltway TO voltway_user;

-- Dar permissões para criar bancos (opcional)
ALTER USER voltway_user CREATEDB;

-- Verificar usuários criados
\du
```

**Resultado esperado:**
```
                                   List of roles
 Role name |                         Attributes                         | Member of
-----------+------------------------------------------------------------+-----------
 postgres  | Superuser, Create role, Create DB, Replication, Bypass RLS+| {}
 voltway_user | Create DB                                                | {}
```

### **3.3 Sair do psql**
```sql
\q
```

---

## 🔐 Passo 4: Configurar Permissões

### **4.1 Conectar como voltway_user**
```bash
# Testar conexão com o novo usuário
psql -U voltway_user -d voltway -c "SELECT current_user, current_database();"
```

**Resultado esperado:**
```
 current_user | current_database
--------------+------------------
 voltway_user | voltway
(1 row)
```

### **4.2 Dar permissões no schema public**
```bash
# Conectar como postgres para dar permissões
psql -U postgres -d voltway
```

```sql
-- Dar permissões no schema public
GRANT ALL PRIVILEGES ON SCHEMA public TO voltway_user;

-- Dar permissões para criar tabelas
GRANT CREATE ON SCHEMA public TO voltway_user;

-- Sair
\q
```

---

## ✅ Passo 5: Verificação Final

### **5.1 Teste de conexão completo**
```bash
# Testar conexão com todas as configurações
psql -U voltway_user -d voltway -h localhost -c "SELECT 'Conexão OK!' as status;"
```

**Resultado esperado:**
```
   status
-----------
 Conexão OK!
(1 row)
```

### **5.2 Verificar configurações**
```bash
# Verificar informações do banco
psql -U voltway_user -d voltway -c "
SELECT 
    current_database() as banco,
    current_user as usuario,
    version() as versao_postgres;
"
```

**Resultado esperado:**
```
  banco  |   usuario    |                           versao_postgres
---------+--------------+----------------------------------------------------------------
 voltway | voltway_user | PostgreSQL 16.0 on x86_64-windows, compiled by msvc-19.44.35215, 64-bit
(1 row)
```

---

## 📝 Resumo das Configurações

### **Informações do Banco:**
- **Nome do banco:** `voltway`
- **Usuário:** `voltway_user`
- **Senha:** `voltway123`
- **Host:** `localhost`
- **Porta:** `5432`

### **Permissões concedidas:**
- ✅ Acesso total ao banco `voltway`
- ✅ Permissão para criar tabelas
- ✅ Permissão para criar índices
- ✅ Permissão para criar funções e triggers

---

## 🚨 Problemas Comuns

### **Erro: "role voltway_user does not exist"**
```sql
-- Solução: Recriar o usuário
DROP USER IF EXISTS voltway_user;
CREATE USER voltway_user WITH PASSWORD 'voltway123';
GRANT ALL PRIVILEGES ON DATABASE voltway TO voltway_user;
```

### **Erro: "permission denied for database voltway"**
```sql
-- Solução: Dar permissões
GRANT ALL PRIVILEGES ON DATABASE voltway TO voltway_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO voltway_user;
```

### **Erro: "psql: command not found"**
```bash
# Solução: Usar caminho completo
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```

### **Erro: "authentication failed"**
```bash
# Solução: Verificar senha
# Use a senha que você definiu durante a instalação do PostgreSQL
```

---

## 🔧 Comandos Úteis

### **Conectar ao banco:**
```bash
psql -U voltway_user -d voltway
```

### **Listar bancos:**
```sql
\l
```

### **Listar usuários:**
```sql
\du
```

### **Sair do psql:**
```sql
\q
```

### **Verificar conexões ativas:**
```sql
SELECT * FROM pg_stat_activity WHERE datname = 'voltway';
```

---

## 🎯 Próximo Passo

Após completar esta configuração, prossiga para:
**[04-banco-dados-schema.md](./04-banco-dados-schema.md)** - Criação das tabelas e estrutura

---

**Tempo estimado:** 20-30 minutos  
**Dificuldade:** Iniciante  
**Próximo:** Criação do schema do banco
