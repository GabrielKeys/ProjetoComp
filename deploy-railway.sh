#!/bin/bash

echo "🚀 VoltWay - Deploy Automático para Railway"
echo "=========================================="

# Verificar se está na branch correta
echo "📋 Verificando branch..."
git branch --show-current

echo ""
echo "✅ Tudo pronto para deploy!"
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "1. Acesse: https://railway.app"
echo "2. Faça login com GitHub"
echo "3. Clique em 'New Project'"
echo "4. Selecione 'Deploy from GitHub repo'"
echo "5. Escolha: ProjetoComp"
echo "6. Branch: backend-postgresql"
echo "7. Pasta: backend/"
echo ""
echo "🔧 CONFIGURAÇÕES NECESSÁRIAS:"
echo "- Adicionar PostgreSQL Database"
echo "- Configurar variáveis de ambiente"
echo "- Executar migrações"
echo ""
echo "📚 Documentação completa em: DEPLOY_NOW.md"
