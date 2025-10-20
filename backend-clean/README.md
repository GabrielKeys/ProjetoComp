# 🚀 VoltWay Backend

> Sistema completo de estações de carregamento elétrico

## 📋 **Visão Geral**

Backend Node.js/Express com PostgreSQL para gerenciar estações de carregamento, usuários, veículos, carteira digital e reservas.

## 🚀 **Deploy em Produção**

- **URL:** https://projetocomp.onrender.com
- **Status:** ✅ Funcionando
- **Banco:** PostgreSQL

## 🔧 **Instalação Rápida**

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp env.example .env
# Editar .env com suas configurações

# Executar migrações
npm run migrate

# Inserir dados de teste
npm run seed

# Iniciar servidor
npm start
```

## 📊 **APIs Disponíveis**

- **Health Check:** `/health`
- **Estações:** `/api/stations`
- **Carteira:** `/api/wallet`
- **Veículos:** `/api/vehicles`
- **Reservas:** `/api/reservations`

## 📁 **Estrutura do Projeto**

```
backend-clean/
├── 📁 docs/              # Documentação completa
├── 📁 migrations/        # Scripts de banco
├── 📁 scripts/           # Scripts utilitários
├── 📁 tests/             # Testes
├── 📄 server.js          # Servidor principal
├── 📄 package.json       # Dependências
├── 📄 env.example        # Variáveis de ambiente
└── 📄 README.md          # Este arquivo
```

## 📚 **Documentação**

- **[Guia Completo](docs/README.md)** - Documentação detalhada
- **[Deploy Guide](docs/DEPLOY_GUIDE.md)** - Instruções de deploy
- **[API Docs](docs/API_DOCS.md)** - Documentação da API

## 🧪 **Testes**

```bash
# Testar APIs
npm test

# Testar health check
curl https://projetocomp.onrender.com/health
```

## 🔒 **Segurança**

- ✅ Helmet.js
- ✅ CORS
- ✅ Rate Limiting
- ✅ JWT Authentication
- ✅ bcrypt

## 📞 **Suporte**

- **GitHub:** [ProjetoComp](https://github.com/GabrielKeys/ProjetoComp)
- **Issues:** [Reportar Bug](https://github.com/GabrielKeys/ProjetoComp/issues)

---

**🚀 VoltWay Backend - Sistema completo funcionando em produção!**
