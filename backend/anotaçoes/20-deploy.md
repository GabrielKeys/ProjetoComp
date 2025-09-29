# 🚀 Guia de Deploy para Produção

Este guia mostra como preparar e fazer o deploy do backend VoltWay para um ambiente de produção.

## 📋 Pré-requisitos

- ✅ Backend funcionando localmente
- ✅ Testes passando
- ✅ Documentação atualizada
- ✅ Servidor de produção (VPS, Cloud, etc.)

## 🎯 Objetivos do Deploy

- **Segurança:** Configurações seguras para produção
- **Performance:** Otimizações para alta demanda
- **Monitoramento:** Logs e métricas
- **Escalabilidade:** Preparado para crescimento
- **Confiabilidade:** Backup e recuperação

---

## 🔧 Preparação do Código

### **1. Otimizar package.json**
```json
{
  "name": "voltway-backend",
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
    "db:reset": "npm run db:setup && npm run db:seed && npm run db:favoritos",
    "pm2:start": "pm2 start ecosystem.config.js",
    "pm2:stop": "pm2 stop voltway-backend",
    "pm2:restart": "pm2 restart voltway-backend",
    "pm2:logs": "pm2 logs voltway-backend"
  },
  "keywords": ["voltway", "backend", "api", "postgresql", "electric-vehicles"],
  "author": "Equipe VoltWay",
  "license": "MIT",
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  },
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

### **2. Configurar Variáveis de Ambiente de Produção**
Criar arquivo `.env.production`:

```env
# ============================================
# VoltWay - Configurações de Produção
# ============================================

# Configurações do Servidor
PORT=3000
NODE_ENV=production

# Configurações do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voltway_prod
DB_USER=voltway_prod_user
DB_PASSWORD=senha_super_segura_123

# Configurações de Segurança
JWT_SECRET=jwt_secret_muito_seguro_para_producao_2024

# Configurações de CORS
CORS_ORIGIN=https://voltway.com.br

# Configurações de Log
LOG_LEVEL=warn

# Configurações de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configurações de SSL
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

---

## 🛡️ Configurações de Segurança

### **1. Atualizar server.js com Segurança**
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar configuração do banco
const db = require('./config/database');

const app = express();

// Middlewares de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite de 100 requisições por IP
  message: {
    success: false,
    error: 'Muitas requisições deste IP, tente novamente mais tarde.'
  }
});

app.use(limiter);

// CORS configurado para produção
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../')));

// Middleware de logging para produção
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${ip}`);
  next();
});

// ... resto do código ...
```

### **2. Configurar PM2 para Gerenciamento de Processos**
Criar arquivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'voltway-backend',
    script: 'server.js',
    instances: 'max', // Usar todos os cores disponíveis
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Configurações de monitoramento
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Configurações de restart
    min_uptime: '10s',
    max_restarts: 10,
    // Configurações de cluster
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
```

---

## 🗄️ Configuração do Banco de Produção

### **1. Criar Banco de Produção**
```bash
# Conectar como postgres
psql -U postgres

# Criar banco de produção
CREATE DATABASE voltway_prod;

# Criar usuário de produção
CREATE USER voltway_prod_user WITH PASSWORD 'senha_super_segura_123';

# Dar permissões
GRANT ALL PRIVILEGES ON DATABASE voltway_prod TO voltway_prod_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO voltway_prod_user;
GRANT CREATE ON SCHEMA public TO voltway_prod_user;

# Sair
\q
```

### **2. Executar Schema em Produção**
```bash
# Executar schema
psql -U postgres -d voltway_prod -f database/schema.sql

# Executar seed (opcional, apenas dados essenciais)
psql -U postgres -d voltway_prod -f database/seed.sql
```

### **3. Configurar Backup Automático**
Criar script `backup-db.sh`:

```bash
#!/bin/bash

# Configurações
DB_NAME="voltway_prod"
DB_USER="voltway_prod_user"
BACKUP_DIR="/var/backups/voltway"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Fazer backup
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/voltway_backup_$DATE.sql

# Comprimir backup
gzip $BACKUP_DIR/voltway_backup_$DATE.sql

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "voltway_backup_*.sql.gz" -mtime +7 -delete

echo "Backup realizado: voltway_backup_$DATE.sql.gz"
```

### **4. Configurar Cron para Backup**
```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário às 2h da manhã
0 2 * * * /path/to/backup-db.sh
```

---

## 🚀 Deploy no Servidor

### **1. Preparar Servidor**
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Nginx (opcional, para proxy reverso)
sudo apt install nginx -y
```

### **2. Configurar Usuário de Deploy**
```bash
# Criar usuário para deploy
sudo adduser voltway
sudo usermod -aG sudo voltway

# Configurar SSH (opcional)
sudo nano /etc/ssh/sshd_config
# Permitir autenticação por chave
```

### **3. Fazer Deploy do Código**
```bash
# Clonar repositório
git clone https://github.com/seu-usuario/voltway-backend.git
cd voltway-backend

# Instalar dependências
npm install --production

# Configurar variáveis de ambiente
cp .env.production .env

# Testar aplicação
npm start
```

### **4. Configurar PM2**
```bash
# Iniciar aplicação com PM2
pm2 start ecosystem.config.js --env production

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar com o sistema
pm2 startup
```

---

## 🌐 Configuração do Nginx (Proxy Reverso)

### **1. Configurar Nginx**
Criar arquivo `/etc/nginx/sites-available/voltway`:

```nginx
server {
    listen 80;
    server_name voltway.com.br www.voltway.com.br;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name voltway.com.br www.voltway.com.br;

    # Configurações SSL
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Configurações de segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Configurações de rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **2. Ativar Site**
```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/voltway /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 📊 Monitoramento e Logs

### **1. Configurar Logs**
```bash
# Criar diretório de logs
mkdir -p logs

# Configurar logrotate
sudo nano /etc/logrotate.d/voltway
```

Conteúdo do logrotate:
```
/var/www/voltway/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 voltway voltway
    postrotate
        pm2 reload voltway-backend
    endscript
}
```

### **2. Monitoramento com PM2**
```bash
# Ver status da aplicação
pm2 status

# Ver logs em tempo real
pm2 logs voltway-backend

# Ver métricas
pm2 monit

# Reiniciar aplicação
pm2 restart voltway-backend
```

### **3. Configurar Alertas**
Criar script `monitor.sh`:

```bash
#!/bin/bash

# Verificar se aplicação está rodando
if ! pm2 list | grep -q "voltway-backend.*online"; then
    echo "ALERTA: VoltWay Backend está offline!"
    # Enviar email ou notificação
fi

# Verificar uso de memória
MEMORY_USAGE=$(pm2 jlist | jq '.[] | select(.name=="voltway-backend") | .monit.memory')
if [ $MEMORY_USAGE -gt 800000000 ]; then
    echo "ALERTA: Uso de memória alto: $MEMORY_USAGE bytes"
fi
```

---

## 🔒 Configurações de Segurança Adicionais

### **1. Firewall**
```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000  # Bloquear acesso direto à aplicação
```

### **2. Fail2Ban**
```bash
# Instalar Fail2Ban
sudo apt install fail2ban -y

# Configurar para Nginx
sudo nano /etc/fail2ban/jail.local
```

Conteúdo:
```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

### **3. Atualizações Automáticas**
```bash
# Configurar atualizações automáticas de segurança
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure unattended-upgrades
```

---

## ✅ Checklist de Deploy

### **Pré-Deploy:**
- [ ] Código testado localmente
- [ ] Testes passando
- [ ] Documentação atualizada
- [ ] Variáveis de ambiente configuradas
- [ ] Backup do banco atual (se houver)

### **Deploy:**
- [ ] Servidor preparado
- [ ] Banco de dados configurado
- [ ] Código deployado
- [ ] PM2 configurado
- [ ] Nginx configurado
- [ ] SSL configurado
- [ ] Firewall configurado

### **Pós-Deploy:**
- [ ] Aplicação respondendo
- [ ] Health check funcionando
- [ ] Logs sendo gerados
- [ ] Monitoramento ativo
- [ ] Backup automático funcionando
- [ ] Testes de produção passando

---

## 🚨 Plano de Rollback

### **Em caso de problemas:**
```bash
# 1. Parar aplicação atual
pm2 stop voltway-backend

# 2. Restaurar versão anterior
git checkout previous-version
npm install --production

# 3. Reiniciar aplicação
pm2 start ecosystem.config.js --env production

# 4. Verificar funcionamento
curl https://voltway.com.br/api/health
```

### **Restaurar Banco:**
```bash
# Restaurar backup
gunzip /var/backups/voltway/voltway_backup_YYYYMMDD_HHMMSS.sql.gz
psql -U voltway_prod_user -d voltway_prod < /var/backups/voltway/voltway_backup_YYYYMMDD_HHMMSS.sql
```

---

## 📈 Otimizações de Performance

### **1. Configurações do PostgreSQL**
```sql
-- Configurações de produção
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Recarregar configurações
SELECT pg_reload_conf();
```

### **2. Configurações do Node.js**
```bash
# Variáveis de ambiente para performance
export NODE_OPTIONS="--max-old-space-size=1024"
export UV_THREADPOOL_SIZE=16
```

---

## 🎯 Próximos Passos

Após o deploy bem-sucedido:

1. **Monitoramento contínuo** - Acompanhar logs e métricas
2. **Testes de carga** - Verificar performance sob alta demanda
3. **Backup e recuperação** - Testar procedimentos de backup
4. **Atualizações** - Manter dependências atualizadas
5. **Documentação** - Atualizar documentação de produção

---

**Última atualização:** 29/09/2024  
**Versão:** 1.0.0  
**Ambiente:** Produção
