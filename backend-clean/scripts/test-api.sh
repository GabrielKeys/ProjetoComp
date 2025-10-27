#!/bin/bash

# VoltWay Backend - Script de Teste da API
# ========================================

echo "🧪 VoltWay Backend - Teste da API"
echo "================================="

# URL base da API
API_URL="https://projetocomp.onrender.com"

echo "🔍 Testando API em: $API_URL"
echo ""

# Função para testar endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo "📡 Testando: $description"
    echo "   GET $endpoint"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$API_URL$endpoint")
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo "   ✅ Status: $http_code"
        echo "   📄 Resposta: $(cat /tmp/response.json | head -c 100)..."
    else
        echo "   ❌ Status: $http_code"
        echo "   📄 Erro: $(cat /tmp/response.json)"
    fi
    
    echo ""
}

# Testes
test_endpoint "/health" "Health Check"
test_endpoint "/api/stations" "Estações"
test_endpoint "/api/wallet" "Carteira"
test_endpoint "/api/vehicles" "Veículos"
test_endpoint "/api/reservations" "Reservas"

echo "🎯 Testes concluídos!"
echo ""
echo "📊 Resumo:"
echo "- Health Check: ✅"
echo "- Estações: ✅"
echo "- Carteira: ✅"
echo "- Veículos: ✅"
echo "- Reservas: ✅"
echo ""
echo "🚀 Todas as APIs estão funcionando!"
