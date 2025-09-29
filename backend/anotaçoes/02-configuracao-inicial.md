# ⚙️ Fase 2: Configuração Inicial do Projeto

Agora que os programas estão instalados, vamos configurar o projeto backend do VoltWay.

## 📁 Estrutura do Projeto

Primeiro, vamos entender a estrutura que vamos criar:

```
ProjetoComp/
├── backend/                 # Pasta do backend
│   ├── config/             # Configurações
│   ├── database/           # Scripts do banco
│   ├── anotações/          # Este tutorial
│   ├── package.json        # Dependências
│   ├── server.js           # Servidor principal
│   └── .env               # Variáveis de ambiente
```

## 🚀 Passo 1: Inicializar o Projeto Node.js

### **1.1 Criar a pasta do backend**
```bash
# Navegar para a pasta do projeto
cd "C:\Users\mattu\Desktop\Projetos-da-eng-comp1\ProjetoComp"

# Criar pasta backend (se não existir)
mkdir backend
cd backend
```

### **1.2 Inicializar o projeto**
```bash
# Inicializar package.json
npm init -y
```

**Resultado esperado:**
```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

---

## 📦 Passo 2: Instalar Dependências

### **2.1 Dependências Principais**
```bash
# Instalar dependências essenciais
npm install express pg cors dotenv
```

**O que cada dependência faz:**
- **express**: Framework web para Node.js
- **pg**: Cliente PostgreSQL para Node.js
- **cors**: Permite requisições entre domínios diferentes
- **dotenv**: Carrega variáveis de ambiente do arquivo .env

### **2.2 Dependências de Segurança**
```bash
# Instalar dependências de segurança
npm install bcryptjs jsonwebtoken helmet
```

**O que cada dependência faz:**
- **bcryptjs**: Para hash de senhas
- **jsonwebtoken**: Para autenticação JWT
- **helmet**: Para segurança HTTP

### **2.3 Dependências de Desenvolvimento**
```bash
# Instalar dependências de desenvolvimento
npm install --save-dev nodemon
```

**O que faz:**
- **nodemon**: Reinicia automaticamente o servidor quando há mudanças

---

## 📝 Passo 3: Configurar package.json

### **3.1 Adicionar Scripts**
Edite o `package.json` e adicione estes scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1",
    "db:setup": "psql -U voltway_user -d voltway -h localhost -f database/schema.sql",
    "db:seed": "psql -U voltway_user -d voltway -h localhost -f database/seed.sql",
    "db:favoritos": "psql -U voltway_user -d voltway -h localhost -f database/favoritos.sql",
    "db:reset": "npm run db:setup && npm run db:seed && npm run db:favoritos"
  }
}
```

### **3.2 package.json Final**
Seu `package.json` deve ficar assim:

```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "VoltWay Backend - Sistema de Carregamento de Veículos Elétricos",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1",
    "db:setup": "psql -U voltway_user -d voltway -h localhost -f database/schema.sql",
    "db:seed": "psql -U voltway_user -d voltway -h localhost -f database/seed.sql",
    "db:favoritos": "psql -U voltway_user -d voltway -h localhost -f database/favoritos.sql",
    "db:reset": "npm run db:setup && npm run db:seed && npm run db:favoritos"
  },
  "keywords": ["voltway", "backend", "api", "postgresql"],
  "author": "Equipe VoltWay",
  "license": "ISC",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^17.2.2",
    "express": "^5.1.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.0",
    "pg": "^8.16.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

---

## 🔧 Passo 4: Criar Estrutura de Pastas

### **4.1 Criar pastas necessárias**
```bash
# Criar pasta de configurações
mkdir config

# Criar pasta do banco de dados
mkdir database

# Criar pasta de anotações (se não existir)
mkdir anotações
```

### **4.2 Estrutura final**
```
backend/
├── config/              # ✅ Criada
├── database/            # ✅ Criada
├── anotações/           # ✅ Criada
├── node_modules/        # ✅ Criada automaticamente
├── package.json         # ✅ Configurado
├── package-lock.json    # ✅ Criado automaticamente
└── .env                # ⏳ Criaremos no próximo passo
```

---

## 🌍 Passo 5: Configurar Variáveis de Ambiente

### **5.1 Criar arquivo .env**
Crie um arquivo chamado `.env` na pasta `backend`:

```env
# ============================================
# VoltWay - Configurações de Ambiente
# ============================================

# Configurações do Servidor
PORT=3000
NODE_ENV=development

# Configurações do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voltway
DB_USER=voltway_user
DB_PASSWORD=voltway123

# Configurações de Segurança
JWT_SECRET=voltway_secret_key_2024_muito_seguro

# Configurações de CORS
CORS_ORIGIN=http://localhost:8080

# Configurações de Log
LOG_LEVEL=info
```

### **5.2 Criar arquivo .env.example**
Crie também um arquivo `.env.example` (sem valores sensíveis):

```env
# Exemplo de configurações - copie para .env e preencha
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voltway
DB_USER=voltway_user
DB_PASSWORD=sua_senha_aqui
JWT_SECRET=seu_jwt_secret_aqui
CORS_ORIGIN=http://localhost:8080
LOG_LEVEL=info
```

---

## ✅ Verificação da Configuração

### **Teste 1: Verificar dependências**
```bash
npm list
```

### **Teste 2: Verificar estrutura**
```bash
# Listar arquivos
dir

# Verificar se .env existe
Test-Path .env
```

### **Teste 3: Verificar variáveis de ambiente**
```bash
# Testar se o dotenv funciona
node -e "require('dotenv').config(); console.log('PORT:', process.env.PORT);"
```

**Resultado esperado:**
```
PORT: 3000
```

---

## 🚨 Problemas Comuns

### **Erro: "npm command not found"**
```bash
# Solução: Reinstalar Node.js e marcar "Add to PATH"
```

### **Erro: "Cannot find module"**
```bash
# Solução: Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### **Erro: ".env not found"**
```bash
# Solução: Verificar se o arquivo está na pasta correta
# O arquivo .env deve estar na pasta backend/
```

---

## 🎯 Próximo Passo

Após completar esta configuração, prossiga para:
**[03-banco-dados-setup.md](./03-banco-dados-setup.md)** - Configuração do PostgreSQL

---

**Tempo estimado:** 15-20 minutos  
**Dificuldade:** Iniciante  
**Próximo:** Configuração do banco de dados
