# Guia de Testes - VoltWay Backend

## Data: 2024

## Pré-requisitos

1. Banco de dados PostgreSQL configurado no Render
2. Arquivo `.env` configurado com `DATABASE_URL`
3. Dependências instaladas: `npm install`
4. Migrações executadas: `npm run migrate`
5. Seed executado: `npm run seed`

## Testes de Conexão

### 1. Testar Conexão com Banco
```bash
npm run test:db
```

**Resultado esperado:**
```
✅ Conectado ao banco de dados PostgreSQL
✅ Conexão com banco de dados testada com sucesso
```

### 2. Health Check do Servidor
```bash
# Iniciar servidor
npm start

# Em outro terminal, testar:
curl http://localhost:3000/health
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "VoltWay API está funcionando",
  "database": "connected"
}
```

## Testes de API

### 3. Testar Rotas de Estações

#### Listar todas as estações
```bash
curl http://localhost:3000/api/stations
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "stations": [
      {
        "id": 1,
        "name": "Estação Shopping Iguatemi",
        "address": "Av. Brigadeiro Luiz Antonio, 3132",
        "city": "São Paulo",
        "state": "SP",
        "latitude": -23.5505,
        "longitude": -46.6333,
        "powerKw": 150.0,
        "pricePerKwh": 0.85
      }
    ]
  }
}
```

#### Buscar estação por ID
```bash
curl http://localhost:3000/api/stations/1
```

### 4. Testar Autenticação

#### Registrar novo usuário
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "João Silva",
    "email": "joao@teste.com",
    "password": "senha123",
    "phone": "11999999999"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "full_name": "João Silva",
      "email": "joao@teste.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Fazer login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@teste.com",
    "password": "senha123"
  }'
```

**Salvar o token retornado para próximos testes**

### 5. Testar Rotas Protegidas (com autenticação)

#### Ver carteira
```bash
curl http://localhost:3000/api/wallet \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Listar veículos
```bash
curl http://localhost:3000/api/vehicles \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### Criar veículo
```bash
curl -X POST http://localhost:3000/api/vehicles \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Tesla Model S",
    "year": 2023,
    "plate": "XYZ-9876",
    "batteryCapacity": 100.0,
    "chargingPower": 11.0
  }'
```

#### Listar reservas
```bash
curl http://localhost:3000/api/reservations \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 6. Testar Sincronização Google Places

#### Sincronizar estações do Google Places
```bash
curl -X POST http://localhost:3000/api/stations/sync \
  -H "Content-Type: application/json" \
  -d '{
    "stations": [
      {
        "name": "Estação Teste Google",
        "address": "Rua Teste, 123, São Paulo - SP",
        "latitude": -23.5505,
        "longitude": -46.6333,
        "formattedAddress": "Rua Teste, 123, São Paulo - SP"
      }
    ]
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "message": "Sincronização concluída: 1 inseridas, 0 ignoradas",
    "inserted": 1,
    "skipped": 0,
    "errors": []
  }
}
```

## Testes no Frontend

### 7. Testar Integração Frontend-Backend

1. **Abrir o frontend** em `http://localhost:8080` (ou porta configurada)

2. **Testar Login:**
   - Ir para página de login
   - Fazer login com usuário criado
   - Verificar se token é salvo

3. **Testar Mapa:**
   - Acessar página do mapa
   - Verificar se estações do banco aparecem
   - Testar busca de estações do Google Places
   - Verificar se estações são sincronizadas automaticamente

4. **Testar Home:**
   - Verificar se carteira aparece
   - Verificar se veículos aparecem
   - Testar criação de reserva

## Checklist de Testes

### Backend
- [ ] Conexão com banco funcionando
- [ ] Health check retorna sucesso
- [ ] Rotas de estações funcionando
- [ ] Registro de usuário funcionando
- [ ] Login funcionando
- [ ] Rotas protegidas funcionando (com token)
- [ ] Sincronização Google Places funcionando

### Frontend
- [ ] Login conecta com backend
- [ ] Mapa carrega estações do banco
- [ ] Busca Google Places funciona
- [ ] Sincronização automática funciona
- [ ] Carteira aparece corretamente
- [ ] Veículos aparecem corretamente
- [ ] Reservas funcionam

## Troubleshooting

### Erro de conexão com banco
- Verificar se `DATABASE_URL` está correto no `.env`
- Verificar se banco está acessível
- Verificar se SSL está configurado corretamente

### Erro 401 (Não autorizado)
- Verificar se token está sendo enviado
- Verificar se token não expirou
- Verificar se `JWT_SECRET` está configurado

### Erro 500 (Erro interno)
- Verificar logs do servidor
- Verificar se banco está acessível
- Verificar se migrações foram executadas

## Scripts Úteis

```bash
# Testar conexão
npm run test:db

# Executar migrações
npm run migrate

# Popular dados iniciais
npm run seed

# Popular com estações do Google
npm run populate:stations

# Iniciar servidor
npm start

# Modo desenvolvimento (com auto-reload)
npm run dev
```



