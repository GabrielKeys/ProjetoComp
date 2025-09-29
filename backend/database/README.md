# 🗄️ VoltWay Database

Este diretório contém todos os arquivos relacionados ao banco de dados PostgreSQL do projeto VoltWay.

## 📁 Arquivos

- **`schema.sql`** – Estrutura completa do banco (tabelas, índices, triggers, views)
- **`seed_estacoes.sql`** – Seed ATIVO com dados de exemplo para `estacoes`
- **`seed.sql`** – LEGADO (use apenas se precisar do escopo antigo de dados)
- **`favoritos.sql`** – OPCIONAL (aplique se a funcionalidade de favoritos estiver ativa)
- **`README.md`** – Esta documentação

## 🚀 Configuração Rápida

### 1. Criar o banco de dados
```bash
# Conectar como postgres
sudo -u postgres psql

# Criar banco e usuário
CREATE DATABASE voltway;
CREATE USER voltway_user WITH PASSWORD 'voltway123';
GRANT ALL PRIVILEGES ON DATABASE voltway TO voltway_user;
\q
```

### 2. Executar os scripts
```bash
# Na pasta backend
npm run db:setup        # Cria as tabelas (schema.sql)
npm run db:seed:stations # Insere dados de estações (seed_estacoes.sql)
# npm run db:favoritos   # (opcional) adiciona tabela/seed de favoritos
```

### 3. Ou executar tudo de uma vez
```bash
npm run db:reset:stations
```

## 📊 Estrutura do Banco

### Tabelas Principais

| Tabela | Descrição | Registros |
|--------|-----------|-----------|
| `usuarios` | Usuários e estações | 8 |
| `veiculos` | Veículos elétricos | 7 |
| `estacoes` | Estações de carregamento | 11 |
| `reservas` | Reservas de carregamento | 12 |
| `favoritos` | Estações favoritas | 8 |

### Views Úteis

- **`vw_reservas_completas`** - Reservas com informações de usuário, veículo e estação
- **`vw_estatisticas_estacoes`** - Estatísticas de uso das estações
- **`vw_favoritos_completos`** - Favoritos com informações completas

### Recursos Avançados

- ✅ **Triggers** - Atualização automática de timestamps
- ✅ **Índices** - Otimizados para consultas frequentes
- ✅ **Constraints** - Validações de dados e integridade
- ✅ **ENUMs** - Tipos de dados customizados
- ✅ **Foreign Keys** - Relacionamentos entre tabelas

## 🔧 Comandos Úteis

### Conectar ao banco
```bash
psql -U voltway_user -d voltway -h localhost
```

### Verificar tabelas
```sql
\dt
```

### Ver dados de exemplo
```sql
SELECT * FROM usuarios LIMIT 5;
SELECT * FROM estacoes WHERE ativa = true;
SELECT * FROM vw_reservas_completas LIMIT 5;
```

### Backup do banco
```bash
pg_dump -U voltway_user -h localhost voltway > backup_voltway.sql
```

### Restaurar backup
```bash
psql -U voltway_user -h localhost voltway < backup_voltway.sql
```

## 📈 Estatísticas dos Dados

### Usuários
- **6 usuários comuns** - Pessoas físicas
- **2 estações** - Estações de carregamento

### Veículos
- **7 veículos** - Diferentes modelos e marcas
- **Tipos de carga**: Tipo 2, CCS, CHAdeMO
- **Capacidades**: 40-95 kWh

### Estações
- **11 estações** - Distribuídas em 5 cidades
- **Potências**: 11-150 kW
- **Preços**: R$ 0,70 - R$ 1,20 por kWh

### Reservas
- **12 reservas** - Diferentes status
- **Período**: Janeiro 2024
- **Status**: pendente, confirmada, cancelada, concluída

## 🛠️ Manutenção

### Limpar dados de teste
```sql
TRUNCATE TABLE reservas CASCADE;
TRUNCATE TABLE veiculos CASCADE;
TRUNCATE TABLE estacoes CASCADE;
TRUNCATE TABLE usuarios CASCADE;
```

### Resetar sequências
```sql
ALTER SEQUENCE usuarios_id_seq RESTART WITH 1;
ALTER SEQUENCE veiculos_id_seq RESTART WITH 1;
ALTER SEQUENCE estacoes_id_seq RESTART WITH 1;
ALTER SEQUENCE reservas_id_seq RESTART WITH 1;
```

### Verificar integridade
```sql
-- Verificar foreign keys
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY';
```

## 🚨 Troubleshooting

### Erro: "role does not exist"
```bash
sudo -u postgres psql
CREATE USER voltway_user WITH PASSWORD 'voltway123';
GRANT ALL PRIVILEGES ON DATABASE voltway TO voltway_user;
```

### Erro: "database does not exist"
```bash
sudo -u postgres psql
CREATE DATABASE voltway;
```

### Erro: "permission denied"
```bash
sudo -u postgres psql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO voltway_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO voltway_user;
```

---

**Status**: ✅ Banco de dados completo e funcional  
**Última atualização**: 28/09/2024  
**Versão**: 1.0.0
