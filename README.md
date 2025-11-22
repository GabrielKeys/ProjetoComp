# 🔌 VoltWay - Sistema de Estações de Carregamento Elétrico

Sistema completo para gerenciamento de estações de carregamento para veículos elétricos, com funcionalidades de reserva, pagamento e integração com Google Places API.

## 🚀 Início Rápido

Para começar rapidamente, siga o [Guia de Instalação Completo](GUIA_INSTALACAO.md).

### Passos Básicos

1. **Clone o repositório**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd ProjetoComp
   ```

2. **Configure o backend**
   ```bash
   cd backend-clean
   npm install
   cp env.example .env  # Ajuste as variáveis de ambiente
   npm run migrate      # Criar tabelas
   npm run seed         # Popular com dados iniciais (opcional)
   npm start            # Iniciar servidor
   ```

3. **Abra o frontend**
   - Use um servidor local (Live Server, Python, etc.)
   - Ou abra `index.html` diretamente no navegador

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

## 📁 Estrutura do Projeto

```
ProjetoComp/
├── backend-clean/          # Backend Node.js/Express
│   ├── controllers/        # Controladores HTTP
│   ├── services/          # Lógica de negócio
│   ├── repositories/      # Acesso ao banco
│   ├── middlewares/        # Middlewares Express
│   ├── routes/            # Rotas da API
│   ├── migrations/        # Scripts de migração
│   ├── scripts/           # Scripts utilitários
│   ├── tests/             # Testes automatizados
│   └── docs/              # Documentação técnica
├── login/                 # Páginas de autenticação
├── home/                  # Páginas principais
├── mapa/                  # Funcionalidades de mapa
└── GUIA_INSTALACAO.md     # Guia completo de instalação
```

## 🔧 Funcionalidades

- ✅ Autenticação de usuários (email/senha e Google OAuth)
- ✅ Gerenciamento de estações de carregamento
- ✅ Sistema de reservas
- ✅ Carteira digital
- ✅ Cadastro de veículos
- ✅ Integração com Google Places API
- ✅ Mapa interativo com estações
- ✅ API RESTful completa

## 📊 Ver Banco de Dados

### Opção 1: Script Node.js (Recomendado)
```bash
cd backend-clean
npm run view:db
```

### Opção 2: psql (Terminal)
```bash
psql -U seu_usuario -d voltwaydb
\dt                    # Listar tabelas
SELECT * FROM users;   # Ver usuários
```

### Opção 3: Interface Gráfica
- **pgAdmin** - [Download](https://www.pgadmin.org/download/)
- **DBeaver** - [Download](https://dbeaver.io/download/)

## 🧪 Testes

```bash
cd backend-clean

# Teste de conexão
npm run test:db

# Testes de integração
npm run test:integration

# Testes end-to-end
npm run test:e2e
```

## 📚 Documentação

- **[Guia de Instalação Completo](GUIA_INSTALACAO.md)** - Passo a passo detalhado
- **[Documentação da API](backend-clean/docs/API_DOCS.md)** - Endpoints e exemplos
- **[Guia de Testes](backend-clean/docs/TESTES.md)** - Como testar o sistema
- **[Debug Frontend](backend-clean/docs/DEBUG_FRONTEND.md)** - Solução de problemas

## 🛠️ Scripts Disponíveis

```bash
# Backend
npm start              # Iniciar servidor
npm run dev            # Modo desenvolvimento (auto-reload)
npm run migrate        # Criar tabelas no banco
npm run seed           # Popular com dados iniciais
npm run view:db        # Visualizar dados do banco
npm run test:db        # Testar conexão
npm run test:integration  # Testes de integração
npm run test:e2e       # Testes end-to-end
npm run populate:stations  # Popular estações do Google Places
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` em `backend-clean/` com:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/voltwaydb
JWT_SECRET=sua-chave-secreta
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:8080
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_PLACES_API_KEY=sua-api-key
```

## 🌐 API Endpoints

- `GET /health` - Health check
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Login com Google
- `GET /api/stations` - Listar estações
- `GET /api/wallet` - Ver carteira
- `GET /api/vehicles` - Listar veículos
- `GET /api/reservations` - Listar reservas

Veja a [documentação completa da API](backend-clean/docs/API_DOCS.md).

## 🐛 Troubleshooting

### Problema: "Cannot find module"
```bash
cd backend-clean
npm install
```

### Problema: "ECONNREFUSED"
- Verifique se o PostgreSQL está rodando
- Verifique a URL no `.env`

### Problema: "Failed to fetch"
- Verifique se o backend está rodando na porta 3000
- Use um servidor local para o frontend

Veja mais soluções no [Guia de Instalação](GUIA_INSTALACAO.md#-troubleshooting).

## 📖 Tecnologias

- **Backend:** Node.js, Express, PostgreSQL
- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Autenticação:** JWT, Google OAuth
- **Mapas:** Google Maps API
- **Arquitetura:** SOLID, Clean Architecture

## 📝 Licença

MIT

## 👥 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a [documentação](backend-clean/docs/)
2. Veja o [Guia de Instalação](GUIA_INSTALACAO.md)
3. Abra uma issue no repositório

---

**Desenvolvido com ❤️ para o projeto VoltWay**

