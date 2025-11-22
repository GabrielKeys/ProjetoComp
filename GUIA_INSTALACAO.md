# 🚀 Guia de Instalação e Configuração - VoltWay

Este guia vai te ajudar a clonar, configurar e rodar o projeto VoltWay do zero.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior) - [Download](https://nodejs.org/)
- **PostgreSQL** (versão 12 ou superior) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads)
- **npm** (vem com Node.js) ou **yarn**

### Verificar Instalações

```bash
node --version    # Deve ser >= 18.0.0
npm --version     # Deve aparecer uma versão
psql --version    # Deve aparecer uma versão do PostgreSQL
```

## 🔧 Passo 1: Clonar o Repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd ProjetoComp
```

## 🔧 Passo 2: Configurar o Backend

### 2.1. Instalar Dependências

```bash
cd backend-clean
npm install
```

### 2.2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend-clean`:

```bash
# Windows PowerShell
New-Item .env -ItemType File

# Linux/Mac
touch .env
```

Copie o conteúdo do arquivo `env.example` e ajuste conforme necessário:

```env
# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/voltwaydb

# JWT
JWT_SECRET=sua-chave-secreta-super-segura-aqui

# Ambiente
NODE_ENV=development
PORT=3000

# Frontend
FRONTEND_URL=http://localhost:8080

# Google (opcional)
GOOGLE_CLIENT_ID=seu-client-id-aqui
GOOGLE_PLACES_API_KEY=sua-api-key-aqui
```

### 2.3. Configurar Banco de Dados PostgreSQL

#### Opção A: Banco Local

1. **Criar banco de dados:**
```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE voltwaydb;

# Criar usuário (opcional)
CREATE USER voltway_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE voltwaydb TO voltway_user;

# Sair
\q
```

2. **Atualizar `.env`:**
```env
DATABASE_URL=postgresql://voltway_user:sua_senha@localhost:5432/voltwaydb
```

#### Opção B: Banco Remoto (Render, Railway, etc.)

Se você já tem um banco de dados remoto, use a URL completa:

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/nome_do_banco
```

### 2.4. Executar Migrações

Criar as tabelas no banco de dados:

```bash
npm run migrate
```

Você deve ver:
```
✅ Tabelas criadas com sucesso!
```

### 2.5. Popular Banco com Dados Iniciais (Opcional)

```bash
npm run seed
```

Você deve ver:
```
✅ Dados iniciais inseridos com sucesso!
```

## 🚀 Passo 3: Iniciar o Servidor Backend

```bash
npm start
```

Ou em modo desenvolvimento (com auto-reload):

```bash
npm run dev
```

Você deve ver:
```
✅ Banco de dados conectado
🚀 Servidor rodando na porta 3000
```

### Verificar se está funcionando

Abra no navegador ou use curl:

```bash
# Navegador
http://localhost:3000/health

# Ou curl
curl http://localhost:3000/health
```

Deve retornar:
```json
{
  "success": true,
  "message": "VoltWay API está funcionando",
  "timestamp": "2024-11-22T...",
  "version": "1.0.0",
  "database": "connected"
}
```

## 🌐 Passo 4: Configurar o Frontend

### 4.1. Verificar Configuração

O frontend já está configurado para usar `http://localhost:3000/api` por padrão.

Se necessário, ajuste o arquivo `config.js` na raiz do projeto:

```javascript
const CONFIG = {
  API_BASE_URL: 'http://localhost:3000/api',
  // ...
};
```

### 4.2. Abrir o Frontend

#### Opção A: Abrir Diretamente (Pode ter problemas de CORS)

Simplesmente abra o arquivo `index.html` no navegador.

#### Opção B: Usar Servidor Local (Recomendado)

**Com Live Server (VS Code):**
1. Instale a extensão "Live Server" no VS Code
2. Clique com botão direito em `index.html`
3. Selecione "Open with Live Server"

**Com Python:**
```bash
# Python 3
python -m http.server 8080

# Depois acesse: http://localhost:8080
```

**Com Node.js (http-server):**
```bash
npm install -g http-server
http-server -p 8080
```

## 📊 Passo 5: Ver o Banco de Dados

### 5.1. Usando psql (Terminal)

```bash
# Conectar ao banco
psql -U seu_usuario -d voltwaydb

# Ou usando a URL completa
psql postgresql://usuario:senha@localhost:5432/voltwaydb
```

**Comandos úteis:**

```sql
-- Listar todas as tabelas
\dt

-- Ver estrutura de uma tabela
\d users
\d stations
\d vehicles
\d reservations
\d wallets

-- Ver todos os usuários
SELECT id, full_name, email, phone FROM users;

-- Ver todas as estações
SELECT id, name, address, city, state, power_kw, price_per_kwh FROM stations;

-- Ver todos os veículos
SELECT id, user_id, model, year, plate, battery_capacity, charging_power FROM vehicles;

-- Ver todas as reservas
SELECT id, user_id, station_id, vehicle_id, start_time, end_time, status FROM reservations;

-- Ver todas as carteiras
SELECT id, user_id, balance FROM wallets;

-- Contar registros
SELECT 
  (SELECT COUNT(*) FROM users) as usuarios,
  (SELECT COUNT(*) FROM stations) as estacoes,
  (SELECT COUNT(*) FROM vehicles) as veiculos,
  (SELECT COUNT(*) FROM reservations) as reservas,
  (SELECT COUNT(*) FROM wallets) as carteiras;

-- Sair
\q
```

### 5.2. Usando pgAdmin (Interface Gráfica)

1. **Instalar pgAdmin:** [Download](https://www.pgadmin.org/download/)
2. **Abrir pgAdmin**
3. **Adicionar servidor:**
   - Clique com botão direito em "Servers"
   - Selecione "Create" > "Server"
   - Na aba "General": Nome = "VoltWay Local"
   - Na aba "Connection":
     - Host: `localhost`
     - Port: `5432`
     - Database: `voltwaydb`
     - Username: seu usuário
     - Password: sua senha
4. **Navegar:**
   - Expanda "VoltWay Local" > "Databases" > "voltwaydb" > "Schemas" > "public" > "Tables"
   - Clique com botão direito em uma tabela > "View/Edit Data" > "All Rows"

### 5.3. Usando DBeaver (Interface Gráfica)

1. **Instalar DBeaver:** [Download](https://dbeaver.io/download/)
2. **Criar nova conexão:**
   - Clique em "New Database Connection"
   - Selecione "PostgreSQL"
   - Preencha:
     - Host: `localhost`
     - Port: `5432`
     - Database: `voltwaydb`
     - Username: seu usuário
     - Password: sua senha
3. **Navegar e visualizar dados**

### 5.4. Usando Script Node.js

Crie um arquivo `backend-clean/scripts/view-database.js`:

```javascript
require('dotenv').config();
const { query } = require('../db');

async function viewDatabase() {
  try {
    console.log('\n📊 DADOS DO BANCO DE DADOS\n');
    
    // Usuários
    const users = await query('SELECT id, full_name, email, phone FROM users');
    console.log('👥 USUÁRIOS:', users.rows.length);
    users.rows.forEach(u => console.log(`  - ${u.full_name} (${u.email})`));
    
    // Estações
    const stations = await query('SELECT id, name, city, state, power_kw FROM stations');
    console.log('\n🔌 ESTAÇÕES:', stations.rows.length);
    stations.rows.forEach(s => console.log(`  - ${s.name} (${s.city}/${s.state}) - ${s.power_kw}kW`));
    
    // Veículos
    const vehicles = await query('SELECT id, model, year, plate FROM vehicles');
    console.log('\n🚗 VEÍCULOS:', vehicles.rows.length);
    vehicles.rows.forEach(v => console.log(`  - ${v.model} ${v.year} (${v.plate})`));
    
    // Reservas
    const reservations = await query('SELECT id, status, start_time, end_time FROM reservations');
    console.log('\n📅 RESERVAS:', reservations.rows.length);
    reservations.rows.forEach(r => console.log(`  - ${r.status} (${r.start_time} - ${r.end_time})`));
    
    // Carteiras
    const wallets = await query('SELECT id, user_id, balance FROM wallets');
    console.log('\n💰 CARTEIRAS:', wallets.rows.length);
    wallets.rows.forEach(w => console.log(`  - User ${w.user_id}: R$ ${w.balance}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

viewDatabase();
```

Execute:
```bash
node scripts/view-database.js
```

## 🧪 Passo 6: Testar a Aplicação

### 6.1. Testar API Diretamente

```bash
# Health check
curl http://localhost:3000/health

# Listar estações
curl http://localhost:3000/api/stations

# Registrar usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Teste","email":"teste@teste.com","password":"12345678"}'
```

### 6.2. Testar Frontend

1. Abra o frontend (usando servidor local recomendado)
2. Tente registrar um novo usuário
3. Faça login
4. Navegue pelas funcionalidades

### 6.3. Executar Testes Automatizados

```bash
cd backend-clean

# Teste de conexão
npm run test:db

# Teste de integração
npm run test:integration

# Teste end-to-end
npm run test:e2e
```

## 🔍 Troubleshooting

### Problema: "Cannot find module 'pg'"

**Solução:**
```bash
cd backend-clean
npm install
```

### Problema: "ECONNREFUSED" ao conectar no banco

**Soluções:**
1. Verifique se o PostgreSQL está rodando:
   ```bash
   # Windows
   Get-Service postgresql*
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Verifique a URL no `.env`:
   ```env
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/voltwaydb
   ```

3. Verifique se o banco existe:
   ```bash
   psql -U postgres -l
   ```

### Problema: "Failed to fetch" no frontend

**Soluções:**
1. Verifique se o backend está rodando na porta 3000
2. Verifique o console do navegador (F12) para erros
3. Use um servidor local ao invés de abrir `file://` diretamente

### Problema: CORS error

**Solução:** O CORS já está configurado para desenvolvimento. Se ainda der erro, verifique:
- Se `NODE_ENV=development` no `.env`
- Se o servidor foi reiniciado após mudanças no `.env`

### Problema: "Email já cadastrado"

**Solução:** Limpe a tabela de usuários:
```sql
psql -U seu_usuario -d voltwaydb
DELETE FROM users;
```

## 📚 Estrutura do Projeto

```
ProjetoComp/
├── backend-clean/          # Backend Node.js/Express
│   ├── controllers/        # Controladores HTTP
│   ├── services/          # Lógica de negócio
│   ├── repositories/      # Acesso ao banco
│   ├── middlewares/       # Middlewares Express
│   ├── routes/           # Rotas da API
│   ├── migrations/        # Scripts de migração
│   ├── scripts/          # Scripts utilitários
│   ├── tests/            # Testes
│   ├── docs/             # Documentação
│   ├── server.refactored.js  # Servidor principal
│   └── .env              # Variáveis de ambiente
├── login/                # Páginas de login
├── home/                 # Páginas principais
├── mapa/                 # Funcionalidades de mapa
├── api-service.js        # Cliente API frontend
├── config.js            # Configuração frontend
└── index.html           # Página inicial
```

## 🎯 Próximos Passos

1. ✅ Configurar banco de dados
2. ✅ Executar migrações
3. ✅ Popular com dados iniciais (opcional)
4. ✅ Iniciar servidor backend
5. ✅ Abrir frontend
6. ✅ Testar funcionalidades
7. ✅ Explorar banco de dados

## 📖 Documentação Adicional

- `backend-clean/docs/` - Documentação técnica completa
- `backend-clean/docs/API_DOCS.md` - Documentação da API
- `backend-clean/docs/TESTES.md` - Guia de testes
- `backend-clean/docs/DEBUG_FRONTEND.md` - Debug do frontend

## 💡 Dicas

- Use `npm run dev` para desenvolvimento (auto-reload)
- Use `npm start` para produção
- Sempre verifique os logs do servidor para erros
- Use o console do navegador (F12) para debug do frontend
- Mantenha o `.env` seguro e nunca commite no Git

## ✅ Checklist de Instalação

- [ ] Node.js instalado
- [ ] PostgreSQL instalado e rodando
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` criado e configurado
- [ ] Banco de dados criado
- [ ] Migrações executadas (`npm run migrate`)
- [ ] Dados iniciais inseridos (`npm run seed`) - opcional
- [ ] Servidor backend rodando (`npm start`)
- [ ] Frontend acessível
- [ ] Testes passando

---

**Pronto!** Agora você deve conseguir rodar o projeto e ver o banco de dados. Se tiver algum problema, consulte a seção de Troubleshooting ou abra uma issue.

