# 🗄️ VoltWay Backend - Documentação do Banco de Dados

## 📋 **Visão Geral**

O VoltWay utiliza PostgreSQL como banco de dados principal, com uma estrutura normalizada para gerenciar usuários, estações de carregamento, veículos, carteiras digitais e reservas.

## 🏗️ **Arquitetura do Banco**

### **Diagrama de Relacionamentos**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   users     │    │  wallets    │    │  stations   │
│             │◄───┤             │    │             │
│ id (PK)     │    │ user_id (FK)│    │ id (PK)     │
│ full_name   │    │ balance     │    │ name        │
│ email       │    │ created_at  │    │ address     │
│ phone       │    │ updated_at  │    │ city        │
│ photo_url   │    └─────────────┘    │ state       │
│ google_id   │                       │ latitude    │
│ is_google   │                       │ longitude   │
│ created_at  │                       │ power_kw    │
│ updated_at  │                       │ price_kwh  │
└─────────────┘                       │ is_active   │
       │                              │ created_at  │
       │                              │ updated_at  │
       │                              └─────────────┘
       │                                       │
       │                              ┌─────────────┐
       │                              │reservations │
       │                              │             │
       │                              │ id (PK)     │
       │                              │ user_id (FK)│
       │                              │ station_id  │
       │                              │ date        │
       │                              │ start_time  │
       │                              │ end_time    │
       │                              │ status      │
       │                              │ total_cost  │
       │                              │ created_at  │
       │                              │ updated_at  │
       │                              └─────────────┘
       │
       │
┌─────────────┐
│  vehicles   │
│             │
│ id (PK)     │
│ user_id (FK)│
│ model       │
│ year        │
│ plate       │
│ battery_cap │
│ charging_pw │
│ created_at  │
│ updated_at  │
└─────────────┘
```

## 📊 **Estrutura das Tabelas**

### **1. Tabela `users`**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    phone VARCHAR(20),
    photo_url TEXT,
    google_id VARCHAR(255) UNIQUE,
    is_google_user BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id` - Chave primária auto-incremento
- `full_name` - Nome completo do usuário
- `email` - Email único para login
- `password_hash` - Hash da senha (bcrypt)
- `phone` - Telefone de contato
- `photo_url` - URL da foto de perfil
- `google_id` - ID do Google OAuth
- `is_google_user` - Flag para usuários Google
- `created_at` - Data de criação
- `updated_at` - Data de atualização

### **2. Tabela `wallets`**
```sql
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id` - Chave primária auto-incremento
- `user_id` - Referência ao usuário (FK)
- `balance` - Saldo da carteira (DECIMAL)
- `created_at` - Data de criação
- `updated_at` - Data de atualização

### **3. Tabela `stations`**
```sql
CREATE TABLE stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    power_kw DECIMAL(5, 2) NOT NULL,
    price_per_kwh DECIMAL(5, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id` - Chave primária auto-incremento
- `name` - Nome da estação
- `address` - Endereço completo
- `city` - Cidade
- `state` - Estado (UF)
- `latitude` - Coordenada latitude
- `longitude` - Coordenada longitude
- `power_kw` - Potência em kW
- `price_per_kwh` - Preço por kWh
- `is_active` - Status ativo/inativo
- `created_at` - Data de criação
- `updated_at` - Data de atualização

### **4. Tabela `vehicles`**
```sql
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    plate VARCHAR(10) NOT NULL,
    battery_capacity DECIMAL(5, 2) NOT NULL,
    charging_power DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id` - Chave primária auto-incremento
- `user_id` - Referência ao usuário (FK)
- `model` - Modelo do veículo
- `year` - Ano de fabricação
- `plate` - Placa do veículo
- `battery_capacity` - Capacidade da bateria (kWh)
- `charging_power` - Potência de carregamento (kW)
- `created_at` - Data de criação
- `updated_at` - Data de atualização

### **5. Tabela `reservations`**
```sql
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_cost DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id` - Chave primária auto-incremento
- `user_id` - Referência ao usuário (FK)
- `station_id` - Referência à estação (FK)
- `reservation_date` - Data da reserva
- `start_time` - Horário de início
- `end_time` - Horário de fim
- `status` - Status da reserva (pending, confirmed, cancelled)
- `total_cost` - Custo total da reserva
- `created_at` - Data de criação
- `updated_at` - Data de atualização

## 🔧 **Índices e Performance**

### **Índices Criados:**
```sql
-- Índices para performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_stations_location ON stations(latitude, longitude);
CREATE INDEX idx_stations_city ON stations(city);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_station ON reservations(station_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_vehicles_user ON vehicles(user_id);
```

### **Triggers para updated_at:**
```sql
-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stations_updated_at 
    BEFORE UPDATE ON stations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at 
    BEFORE UPDATE ON vehicles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at 
    BEFORE UPDATE ON reservations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🚀 **Migrações e Seed**

### **Executar Migrações:**
```bash
# Criar todas as tabelas
npm run migrate

# Inserir dados de teste
npm run seed
```

### **Scripts de Migração:**
- **`migrations/migrate.js`** - Cria todas as tabelas e índices
- **`migrations/seed.js`** - Insere dados de teste

### **Dados de Teste Inseridos:**
- **1 usuário** de teste
- **1 carteira** com saldo de R$ 100,00
- **3 estações** de carregamento
- **1 veículo** Tesla Model 3

## 🔒 **Segurança e Integridade**

### **Constraints Implementadas:**
- **Foreign Keys** - Integridade referencial
- **Unique Constraints** - Email e Google ID únicos
- **Check Constraints** - Validação de dados
- **Cascade Delete** - Limpeza automática

### **Validações:**
- **Email único** por usuário
- **Google ID único** por usuário
- **Saldo não negativo** na carteira
- **Datas válidas** nas reservas
- **Coordenadas válidas** nas estações

## 📊 **Queries Úteis**

### **Consultas Frequentes:**
```sql
-- Buscar estações próximas
SELECT * FROM stations 
WHERE latitude BETWEEN ? AND ? 
AND longitude BETWEEN ? AND ?;

-- Buscar reservas do usuário
SELECT r.*, s.name as station_name 
FROM reservations r 
JOIN stations s ON r.station_id = s.id 
WHERE r.user_id = ?;

-- Buscar saldo da carteira
SELECT balance FROM wallets WHERE user_id = ?;

-- Buscar veículos do usuário
SELECT * FROM vehicles WHERE user_id = ?;
```

## 🔧 **Manutenção**

### **Backup:**
```bash
# Backup completo
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### **Limpeza:**
```sql
-- Limpar dados de teste
DELETE FROM reservations;
DELETE FROM vehicles WHERE user_id = 1;
DELETE FROM wallets WHERE user_id = 1;
DELETE FROM users WHERE email = 'teste@voltway.com';
```

## 📈 **Monitoramento**

### **Queries de Monitoramento:**
```sql
-- Contar registros por tabela
SELECT 'users' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'stations', COUNT(*) FROM stations
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'wallets', COUNT(*) FROM wallets;

-- Verificar integridade
SELECT COUNT(*) as usuarios_sem_carteira 
FROM users u 
LEFT JOIN wallets w ON u.id = w.user_id 
WHERE w.user_id IS NULL;
```

---

## 🎯 **Resumo**

- ✅ **5 tabelas** principais
- ✅ **Relacionamentos** bem definidos
- ✅ **Índices** para performance
- ✅ **Triggers** automáticos
- ✅ **Constraints** de integridade
- ✅ **Dados de teste** incluídos
- ✅ **Scripts de migração** funcionais

**🗄️ Banco PostgreSQL completo e funcional!**
