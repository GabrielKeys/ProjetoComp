#!/bin/bash

echo "🚀 VoltWay - Deploy Completo Automático"
echo "======================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Verificando arquivos necessários...${NC}"

# Verificar se os arquivos existem
files=("package.json" "server.js" "Procfile" "config/database.js" "middleware/auth.js" "models/User.js" "routes/auth.js")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file - FALTANDO${NC}"
    fi
done

echo ""
echo -e "${YELLOW}🔧 CONFIGURAÇÕES PARA O RAILWAY:${NC}"
echo ""
echo "1. Acesse: https://railway.app"
echo "2. New Project → Deploy from GitHub repo"
echo "3. Repositório: ProjetoComp"
echo "4. Branch: backend-postgresql"
echo "5. Pasta: backend/"
echo ""
echo -e "${YELLOW}📊 VARIÁVEIS DE AMBIENTE:${NC}"
echo "DATABASE_URL=<url-do-postgres>"
echo "JWT_SECRET=voltway-super-secret-jwt-key-2024"
echo "NODE_ENV=production"
echo ""
echo -e "${YELLOW}🚀 COMANDOS PARA EXECUTAR:${NC}"
echo "npm run migrate"
echo "npm run seed"
echo ""
echo -e "${GREEN}✅ Tudo pronto para deploy!${NC}"
