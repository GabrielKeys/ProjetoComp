# 📚 Documentação da API VoltWay
## 🧱 Guia Completo do Banco de Dados (da criação ao uso no app)

Este guia resume todo o processo que deixamos pronto para sair do localStorage e usar PostgreSQL de verdade, cobrindo desde o início (sem banco) até a integração com o frontend.

### 1) Preparação do ambiente
- Instalar Node.js e PostgreSQL (ou usar Docker Compose). 
- No backend, configurar `.env` (baseado em `config/env.example`):
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - `JWT_SECRET`

#### Usando PostgreSQL local
Criar usuário e banco:
```sql
CREATE ROLE voltway_user WITH LOGIN PASSWORD 'voltway123';
CREATE DATABASE voltway OWNER voltway_user;
GRANT ALL PRIVILEGES ON DATABASE voltway TO voltway_user;
```

#### Usando Docker Compose
No diretório `backend/`:
```bash
docker compose up -d
```
O serviço `postgres` já sobe com DB, USER e PASS corretos e executa scripts de `./database` se existirem.

### 2) Estrutura do schema (tabelas principais)
- `usuarios(id, nome, email, senha, tipo, cidade, estado, criado_em)`
- `veiculos(id, usuario_id, modelo, ano, placa, criado_em)`
- `estacoes(id, nome, email, rua, numero, bairro, cidade, estado, cep, potencia, abertura, fechamento, preco, tempo_espera, latitude, longitude, ativa, criado_em)`
- `reservas(id, usuario_id, estacao_id, veiculo_id, data, hora, status, observacoes, criado_em)`
- `favoritos(id, usuario_id, estacao_id, criado_em)`

Obs.: A view `vw_reservas_completas` é utilizada para listar reservas com dados combinados (usuario/estacao/veiculo). Caso não exista, a API pode ser ajustada para usar JOINs diretos.

### 3) Seeds (dados de exemplo)
- Arquivo: `backend/database/seed_estacoes.sql`
- Executar via pgAdmin (Query Tool) ou `psql` (se instalado):
```bash
psql -U voltway_user -d voltway -h localhost -f ProjetoComp/backend/database/seed_estacoes.sql
```

### 4) Conexão do backend ao banco
Arquivo: `backend/config/database.js`
- Usa `pg.Pool` configurado via `.env`.
- Funções utilitárias: `query`, `transaction`, `testConnection`, `checkTables`, `getStats`, `closePool`.
- No `server.js`, o servidor só inicia após `testConnection()` e exibe estatísticas básicas.

### 5) Endpoints REST implementados
- `GET /api/health` — status da API e do banco.
- `GET /api/usuarios` — filtros por `email`, `tipo`, `cidade`, `estado`.
- `POST /api/usuarios` — cria usuário (usa senha em texto ou hash, compatível para migração).
- `GET /api/estacoes` — lista estações (filtros: `cidade`, `estado`, `ativa`, etc.).
- `GET /api/reservas` — filtros por `usuario_email` (ou `usuario_id`), entre outros.
- `POST /api/reservas` — aceita IDs ou emails/nomes e resolve `usuario_id`, `estacao_id`, `veiculo_id` automaticamente. Cria veículo básico se necessário.
- `POST /api/auth/login` — autenticação JWT; resposta `{ token, user }`.

### 6) Integração com o frontend (substituição do localStorage)
- `login/login.js`: login obrigatório na API, salva `token`, `usuario`, `usuarioEmail` no `localStorage`.
- `mapa/mapa.js`: carrega estações de `/api/estacoes`, envia `Authorization: Bearer <token>`.
- `home/js/reserva.js`: lista/cria reservas pela API usando `usuario_email`; sem persistência local.
- `perfil/perfil.js`: busca usuário por email e tenta update (PUT) sem travar a UI.

### 7) Como rodar tudo
```powershell
cd ProjetoComp\backend
npm install
npm start
```
Abrir no navegador:
- `http://localhost:3000/api/health` → deve retornar `success: true`.
- `http://localhost:3000/login/login.html` → fazer login.

Criar usuário de teste (PowerShell):
```powershell
$body = @{ nome="Usuario Teste"; email="teste@voltway.com"; senha="12345678"; tipo="usuario"; cidade="São Paulo"; estado="SP" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/usuarios -ContentType application/json -Body $body
```

### 8) Segurança e boas práticas (resumo aplicado)
- JWT secret em `.env` (`JWT_SECRET`).
- CORS restrito por ambiente (configurável).
- Prepared statements em todas as queries.
- Logs de queries com duração para troubleshooting.

### 9) Próximos passos sugeridos
- Mover rotas para `routes/` e `controllers/` para crescer com organização.
- Adicionar `PUT /api/usuarios/:id` real para atualizar nome/telefone.
- Criar `GET /api/me` (dados do usuário do token) e `GET /api/me/reservas`.
- Hash obrigatório de senhas (BCrypt) com migração.


Documentação completa da API REST do sistema VoltWay para carregamento de veículos elétricos.

## 📋 Informações Gerais

- **Nome:** VoltWay API
- **Versão:** 1.0.0
- **Base URL:** `http://localhost:3000`
- **Formato:** JSON
- **Autenticação:** JWT (futuro)

## 🏗️ Estrutura da API

### **Endpoints Principais:**
- `GET /` - Informações da API
- `GET /api/health` - Health check
- `GET /api/usuarios` - Gerenciar usuários
- `GET /api/veiculos` - Gerenciar veículos
- `GET /api/estacoes` - Gerenciar estações
- `GET /api/reservas` - Gerenciar reservas
- `GET /api/stats/*` - Estatísticas
- `POST /api/auth/login` - Autenticação JWT
### 5) POST /api/auth/login (JWT)
- Entra: `{ "email": "...", "senha": "..." }`
- Valida credenciais e retorna `{ token, user }` se ok.
- Aceita senha em texto puro ou hash BCrypt (compatibilidade em fase de migração).

Exemplo:
```bash
POST /api/auth/login
{
  "email": "jose@dominio.com",
  "senha": "minhasenha"
}
```

---

## 🔧 Atualizações (Mobile + Integração com Frontend)

### 1) GET /api/usuarios (agora com filtro por email)
- Suporta `?email=usuario@dominio.com` para buscar direto por email.
- Mantém os filtros existentes (`tipo`, `cidade`, `estado`, `limit`, `offset`).

Exemplo:
```bash
GET /api/usuarios?email=jose@dominio.com
```

### 2) GET /api/reservas (agora com filtro por usuario_email)
- Suporta `?usuario_email=usuario@dominio.com` para listar reservas do usuário sem precisar de ID.
- Mantém filtros existentes: `usuario_id`, `estacao_id`, `veiculo_id`, `status`, `data_inicio`, `data_fim`, `limit`, `offset`.

Exemplo:
```bash
GET /api/reservas?usuario_email=jose@dominio.com
```

### 3) POST /api/reservas (resolução automática de IDs)
- Aceita duas formas de criação:
  - Com IDs: `usuario_id`, `estacao_id`, `veiculo_id`, `data`, `hora`, `observacoes`
  - Por email/nome: `usuario_email`, `estacao_email` ou `estacao_nome`, e opcional `veiculo` (com `placa`, `modelo`, `ano`)
- Se `veiculo` vier com `placa` e não existir para o usuário, cria um veículo básico automaticamente.
- Retorna a reserva criada.

Exemplos:
```bash
POST /api/reservas
{
  "usuario_email": "jose@dominio.com",
  "estacao_nome": "Estação Centro",
  "data": "2025-10-01",
  "hora": "14:30",
  "veiculo": { "placa": "ABC-1234", "modelo": "Leaf", "ano": 2020 }
}
```

```bash
POST /api/reservas
{
  "usuario_id": 5,
  "estacao_id": 12,
  "veiculo_id": 9,
  "data": "2025-10-01",
  "hora": "14:30"
}
```

### 4) GET /api/estacoes (consumo no mapa)
- Frontend (`mapa/mapa.js`) agora consome este endpoint.
- Se a estação não possuir `lat/lng`, o frontend faz geocodificação a partir do endereço.

Campos esperados pelo frontend: `nome`, `rua`, `numero`, `bairro`, `cidade`, `estado`, `cep`, `potencia`, `abertura`, `fechamento`, `preco`, `tempo_espera`, `latitude`, `longitude`.

---

## 🧭 Como rodar a API corretamente

No Windows PowerShell, dentro do diretório do backend:

```powershell
cd ProjetoComp\\backend
npm install
npm start
```

Observação: Executar `npm start` fora de `ProjetoComp/backend` causa erro `ENOENT` por não encontrar `package.json` na raiz do projeto.

---

## ✅ Checklist de Integração Frontend
- `mapa/mapa.js`: consome `GET /api/estacoes` com fallback para dados locais
- `home/js/reserva.js`: lista via `GET /api/reservas?usuario_email=...` e cria via `POST /api/reservas` (fallback local se API indisponível)
- `perfil/perfil.js`: carrega via `GET /api/usuarios?email=...` e tenta `PUT /api/usuarios/:email` (não bloqueante)
- `login/login.js`: tenta `POST /api/auth/login` (se existir); caso contrário, usa login local


---

## 🏠 Endpoints Básicos

### **GET /**
Informações básicas da API.

**Resposta:**
```json
{
  "message": "VoltWay API está rodando!",
  "version": "1.0.0",
  "timestamp": "2024-09-29T10:30:00.000Z"
}
```

### **GET /api/health**
Verifica a saúde do sistema e conexão com banco.

**Resposta:**
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

## 👥 API de Usuários

### **GET /api/usuarios**
Lista usuários com filtros opcionais.

**Parâmetros de Query:**
- `tipo` (string): Filtrar por tipo (`usuario` ou `estacao`)
- `cidade` (string): Filtrar por cidade
- `estado` (string): Filtrar por estado
- `limit` (number): Limite de resultados (padrão: 50)
- `offset` (number): Offset para paginação (padrão: 0)

**Exemplo:**
```bash
GET /api/usuarios?tipo=usuario&cidade=São Paulo&limit=10
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "João Silva",
      "email": "joao.silva@email.com",
      "tipo": "usuario",
      "cidade": "São Paulo",
      "estado": "SP",
      "criado_em": "2024-09-29T10:30:00.000Z"
    }
  ],
  "total": 8,
  "limit": 10,
  "offset": 0
}
```

### **GET /api/usuarios/:id**
Busca usuário específico por ID.

**Parâmetros:**
- `id` (number): ID do usuário

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao.silva@email.com",
    "tipo": "usuario",
    "cidade": "São Paulo",
    "estado": "SP",
    "criado_em": "2024-09-29T10:30:00.000Z"
  }
}
```

### **POST /api/usuarios**
Cria novo usuário.

**Body:**
```json
{
  "nome": "Novo Usuário",
  "email": "novo@email.com",
  "tipo": "usuario",
  "senha": "senha123",
  "cidade": "São Paulo",
  "estado": "SP"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "data": {
    "id": 9,
    "nome": "Novo Usuário",
    "email": "novo@email.com",
    "tipo": "usuario",
    "cidade": "São Paulo",
    "estado": "SP",
    "criado_em": "2024-09-29T10:30:00.000Z"
  }
}
```

---

## 🚗 API de Veículos

### **GET /api/veiculos**
Lista veículos com filtros opcionais.

**Parâmetros de Query:**
- `usuario_id` (number): Filtrar por usuário
- `modelo` (string): Filtrar por modelo
- `ano` (number): Filtrar por ano
- `placa` (string): Filtrar por placa
- `limit` (number): Limite de resultados
- `offset` (number): Offset para paginação

**Exemplo:**
```bash
GET /api/veiculos?usuario_id=1&ano=2023
```

**Resposta:**
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
      "criado_em": "2024-09-29T10:30:00.000Z"
    }
  ],
  "total": 7,
  "limit": 50,
  "offset": 0
}
```

### **GET /api/veiculos/:id**
Busca veículo específico por ID.

### **POST /api/veiculos**
Cria novo veículo.

**Body:**
```json
{
  "usuario_id": 1,
  "modelo": "Tesla Model Y",
  "ano": 2024,
  "placa": "XYZ-9876",
  "bateria": "100 kWh",
  "carga": "CCS"
}
```

---

## ⚡ API de Estações

### **GET /api/estacoes**
Lista estações com filtros opcionais.

**Parâmetros de Query:**
- `cidade` (string): Filtrar por cidade
- `estado` (string): Filtrar por estado
- `potencia_min` (number): Potência mínima
- `potencia_max` (number): Potência máxima
- `preco_max` (number): Preço máximo por kWh
- `ativa` (boolean): Apenas estações ativas
- `limit` (number): Limite de resultados
- `offset` (number): Offset para paginação

**Exemplo:**
```bash
GET /api/estacoes?cidade=São Paulo&potencia_min=50&ativa=true
```

**Resposta:**
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

### **GET /api/estacoes/:id**
Busca estação específica por ID.

### **POST /api/estacoes**
Cria nova estação.

**Body:**
```json
{
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
}
```

---

## 📅 API de Reservas

### **GET /api/reservas**
Lista reservas com filtros opcionais.

**Parâmetros de Query:**
- `usuario_id` (number): Filtrar por usuário
- `estacao_id` (number): Filtrar por estação
- `veiculo_id` (number): Filtrar por veículo
- `status` (string): Filtrar por status
- `data_inicio` (date): Data inicial
- `data_fim` (date): Data final
- `limit` (number): Limite de resultados
- `offset` (number): Offset para paginação

**Exemplo:**
```bash
GET /api/reservas?usuario_id=1&status=confirmada&data_inicio=2024-01-15
```

**Resposta:**
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
      "criado_em": "2024-09-29T10:30:00.000Z"
    }
  ],
  "total": 12,
  "limit": 50,
  "offset": 0
}
```

### **GET /api/reservas/:id**
Busca reserva específica por ID.

### **POST /api/reservas**
Cria nova reserva.

**Body:**
```json
{
  "usuario_id": 1,
  "estacao_id": 1,
  "veiculo_id": 1,
  "data": "2024-01-25",
  "hora": "14:00",
  "observacoes": "Carga rápida"
}
```

### **PUT /api/reservas/:id**
Atualiza reserva existente.

**Body:**
```json
{
  "status": "confirmada",
  "observacoes": "Reserva confirmada"
}
```

---

## 📊 API de Estatísticas

### **GET /api/stats/dashboard**
Estatísticas gerais do sistema.

**Resposta:**
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
      { "cidade": "Belo Horizonte", "quantidade": "2" },
      { "cidade": "Brasília", "quantidade": "1" },
      { "cidade": "Fortaleza", "quantidade": "1" }
    ],
    "veiculos_por_ano": [
      { "ano": 2023, "quantidade": "5" },
      { "ano": 2022, "quantidade": "2" }
    ]
  }
}
```

### **GET /api/stats/estacoes**
Estatísticas das estações.

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "EletroPosto Central",
      "cidade": "São Paulo",
      "estado": "SP",
      "potencia": 50,
      "preco": 0.85,
      "total_reservas": 3,
      "reservas_confirmadas": 2,
      "reservas_canceladas": 0,
      "tempo_espera_medio": 15
    }
  ]
}
```

---

## 🔍 Views do Banco de Dados

### **vw_reservas_completas**
View com informações completas das reservas.

**Uso:**
```sql
SELECT 
  usuario_nome,
  estacao_nome,
  data,
  hora,
  status
FROM vw_reservas_completas
WHERE status = 'confirmada';
```

### **vw_estatisticas_estacoes**
View com estatísticas das estações.

**Uso:**
```sql
SELECT 
  nome,
  cidade,
  total_reservas,
  reservas_confirmadas
FROM vw_estatisticas_estacoes
ORDER BY total_reservas DESC;
```

---

## 📝 Códigos de Status HTTP

### **Sucesso:**
- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado com sucesso

### **Erro do Cliente:**
- `400 Bad Request` - Dados inválidos
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito (ex: email duplicado)

### **Erro do Servidor:**
- `500 Internal Server Error` - Erro interno

---

## 🔒 Tratamento de Erros

### **Formato de Erro:**
```json
{
  "success": false,
  "error": "Mensagem de erro",
  "details": "Detalhes adicionais (opcional)"
}
```

### **Exemplos de Erros:**

**400 - Dados inválidos:**
```json
{
  "success": false,
  "error": "Nome e email são obrigatórios"
}
```

**404 - Recurso não encontrado:**
```json
{
  "success": false,
  "error": "Usuário não encontrado"
}
```

**409 - Conflito:**
```json
{
  "success": false,
  "error": "Email já está em uso"
}
```

**500 - Erro interno:**
```json
{
  "success": false,
  "error": "Erro interno do servidor"
}
```

---

## 🚀 Exemplos de Uso

### **Fluxo Completo de Reserva:**

1. **Buscar estações disponíveis:**
```bash
GET /api/estacoes?cidade=São Paulo&ativa=true
```

2. **Criar reserva:**
```bash
POST /api/reservas
{
  "usuario_id": 1,
  "estacao_id": 1,
  "veiculo_id": 1,
  "data": "2024-01-25",
  "hora": "14:00"
}
```

3. **Confirmar reserva:**
```bash
PUT /api/reservas/1
{
  "status": "confirmada"
}
```

### **Busca de Estações por Critérios:**
```bash
# Estações em São Paulo com potência > 50kW e preço < R$ 1,00
GET /api/estacoes?cidade=São Paulo&potencia_min=50&preco_max=1.00&ativa=true
```

### **Relatório de Usuário:**
```bash
# Reservas de um usuário específico
GET /api/reservas?usuario_id=1&status=confirmada
```

---

## 📋 Checklist de Implementação

### **Endpoints Implementados:**
- [x] GET / - Informações da API
- [x] GET /api/health - Health check
- [x] GET /api/usuarios - Listar usuários
- [x] GET /api/usuarios/:id - Buscar usuário
- [x] POST /api/usuarios - Criar usuário
- [x] GET /api/veiculos - Listar veículos
- [x] GET /api/veiculos/:id - Buscar veículo
- [x] POST /api/veiculos - Criar veículo
- [x] GET /api/estacoes - Listar estações
- [x] GET /api/estacoes/:id - Buscar estação
- [x] POST /api/estacoes - Criar estação
- [x] GET /api/reservas - Listar reservas
- [x] GET /api/reservas/:id - Buscar reserva
- [x] POST /api/reservas - Criar reserva
- [x] PUT /api/reservas/:id - Atualizar reserva
- [x] GET /api/stats/dashboard - Estatísticas gerais
- [x] GET /api/stats/estacoes - Estatísticas das estações

### **Funcionalidades:**
- [x] Filtros em todos os endpoints
- [x] Paginação
- [x] Validação de dados
- [x] Tratamento de erros
- [x] Logs de requisições
- [x] Health check
- [x] Estatísticas
- [x] Views do banco

---

## 🎯 Próximo Passo

Após completar a documentação, prossiga para:
**[20-deploy.md](./20-deploy.md)** - Preparação para produção

---

**Última atualização:** 29/09/2024  
**Versão:** 1.0.0
