#!/bin/bash

# VoltWay Backend - Script de Deploy
# ==================================

echo "🚀 VoltWay Backend - Deploy Automático"
echo "======================================"

# Verificar se está em branch correta
current_branch=$(git branch --show-current)
echo "📋 Branch atual: $current_branch"

if [ "$current_branch" != "backend-postgresql" ]; then
    echo "⚠️ Aviso: Você está na branch $current_branch"
    echo "   Recomendado: backend-postgresql"
fi

# Verificar se há mudanças
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Há mudanças não commitadas:"
    git status --short
    
    read -p "🤔 Deseja fazer commit das mudanças? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "feat: atualizações automáticas do deploy"
        echo "✅ Commit realizado"
    fi
fi

# Push para GitHub
echo "📤 Fazendo push para GitHub..."
git push origin $current_branch

if [ $? -eq 0 ]; then
    echo "✅ Push realizado com sucesso"
    echo ""
    echo "🎯 Deploy automático iniciado!"
    echo "   - Render: https://render.com"
    echo "   - Railway: https://railway.app"
    echo ""
    echo "⏱️ Aguarde alguns minutos para o deploy completar"
    echo "🔍 Verifique os logs na plataforma de deploy"
else
    echo "❌ Erro no push"
    exit 1
fi

echo ""
echo "🚀 Deploy concluído!"
echo "📊 API: https://projetocomp.onrender.com"
echo "🧪 Teste: https://projetocomp.onrender.com/health"
