#!/bin/bash

# VoltWay Backend - Script de Setup
# =================================

echo "🚀 VoltWay Backend - Setup Automático"
echo "====================================="

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js v18+ primeiro."
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale npm primeiro."
    exit 1
fi

echo "✅ Node.js e npm encontrados"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Configurar ambiente
if [ ! -f .env ]; then
    echo "⚙️ Configurando variáveis de ambiente..."
    cp env.example .env
    echo "📝 Edite o arquivo .env com suas configurações"
else
    echo "✅ Arquivo .env já existe"
fi

# Executar migrações
echo "🗄️ Executando migrações..."
npm run migrate

# Inserir dados de teste
echo "🌱 Inserindo dados de teste..."
npm run seed

echo ""
echo "🎉 Setup concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Edite o arquivo .env com suas configurações"
echo "2. Execute: npm start"
echo "3. Acesse: http://localhost:3000/health"
echo ""
echo "🚀 VoltWay Backend pronto para uso!"
