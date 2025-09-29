# Relatório-Resumo do Projeto (Backend e Integração com Banco de Dados)

Este documento resume, sem trechos de código, as tecnologias adotadas e as etapas realizadas para evoluir o projeto de LocalStorage para uma aplicação com backend real, banco de dados PostgreSQL e autenticação.

## Tecnologias Utilizadas
- Node.js e Express: servidor HTTP, middlewares e rotas REST
- PostgreSQL: banco de dados relacional para persistência
- Driver pg (Pool): acesso eficiente e seguro (prepared statements)
- Dotenv: configuração via variáveis de ambiente (.env)
- CORS: autorização de acesso do frontend à API
- JSON Web Token (JWT): autenticação stateless por token
- Google Identity Services: login social e emissão do nosso JWT
- Docker Compose (opcional): Postgres local padronizado

## Linha do Tempo e Etapas
1) Ambiente e Configuração
- Criação e preenchimento do .env (servidor, banco, segurança)
- Opção por Postgres local ou via Docker Compose
- Verificações de conexão ao iniciar (testes, checagem de tabelas e estatísticas)

2) Banco de Dados (Modelagem e Dados)
- Tabelas principais: usuários, veículos, estações, reservas, favoritos
- Seeds de estações para testes e validação visual no mapa
- Uso de view/consultas combinadas para reservas (quando disponível)

3) API REST (Contratos)
- Saúde e estatísticas para diagnóstico
- Usuários: listagem com filtros (incl. por email) e criação
- Estações: listagem com filtros (cidade, estado, ativa, potência, preço)
- Reservas: listagem por email do usuário e criação; resolução automática de IDs e criação de veículo básico quando necessário
- Autenticação JWT: login por email/senha
- Login com Google: validação do ID token e emissão do nosso JWT, com criação/atualização do usuário por email

4) Integração do Frontend (JS/HTML/CSS)
- Substituição do LocalStorage por chamadas à API nas telas-chave
- Login oficial via API (com Google integrado ao backend)
- Mapa: carregamento de estações do banco; geocodificação no cliente quando faltarem coordenadas
- Reservas: listagem/criação ligadas ao usuário autenticado
- Perfil: leitura por email e atualização de dados não sensíveis
- Inclusão automática do JWT no header Authorization

5) Preparação para Mobile
- Backend como fonte única de dados; frontend apenas consome a API
- Ajustes de CORS e autenticação compatíveis com app mobile
- Diretrizes para endpoints amigáveis e possíveis estratégias de cache

## Como Rodar e Testar
- Backend: instalar dependências e iniciar na pasta backend
- Banco: Postgres local ou “docker compose up -d”
- Verificar saúde em /api/health
- Login:
  - Email/senha: página de login
  - Google: configurar Origens JavaScript autorizadas e usar o mesmo Client ID no front e no backend
- Após login, mapa/reservas/perfil usam dados reais do banco

## Decisões de Arquitetura
- REST simples e contratos claros
- JWT para autenticação stateless (web e mobile)
- Prepared statements e logs de queries para segurança e diagnóstico
- Seeds e endpoints de health/stats para acelerar desenvolvimento local

## Evoluções Sugeridas
- Modularização em routes/controllers conforme crescimento
- Endpoints centrados no usuário logado: /api/me e /api/me/reservas
- Padronização de erros e validação com schemas
- Hash de senhas obrigatório (BCrypt) e migração de dados legados
- Observabilidade e rate limiting em produção

## Resultado
- Transição concluída de protótipo (LocalStorage) para app com backend real, PostgreSQL e autenticação JWT (incl. Google). O projeto está documentado e pronto para evolução mobile mantendo o backend como fonte única e escalável de dados.

## Estrutura de Diretórios (visão geral)
- `backend/`: API e serviços do servidor
  - `server.js`: ponto de entrada do servidor Express; configura middlewares, rotas e inicialização (testa conexão, checa tabelas e exibe estatísticas).
  - `config/`
    - `database.js`: configuração do pool de conexões (pg), utilitários `query`, `transaction`, `testConnection`, `checkTables`, `getStats`, `closePool`.
    - `env.example`: modelo de variáveis de ambiente para `.env` (porta, banco, JWT, CORS etc.).
  - `database/`
    - `schema.sql`: definição das tabelas/estruturas principais do banco.
    - `seed_estacoes.sql`: dados de exemplo para popular a tabela `estacoes`.
    - `favoritos.sql`: script auxiliar relacionado à funcionalidade de favoritos (quando aplicável).
    - `README.md`: instruções de uso dos scripts SQL (quando presentes).
  - `anotaçoes/`
    - `00-relatorio-resumo.md`: este resumo executivo do projeto (sem código), tecnologias e etapas.
    - `01-instalacao-programas.md`: softwares necessários e instalação do ambiente.
    - `02-configuracao-inicial.md`: configuração inicial do backend e organização.
    - `04-banco-dados-schema.md`: detalhes do schema do banco.
    - `05-banco-dados-dados.md`: orientação de dados de exemplo/seeds.
    - `06-backend-configuracao.md`: montagem do servidor Express e integração com o banco.
    - `07-backend-conexao-db.md`: explicações da conexão com o Postgres.
    - `08-backend-middlewares.md`: middlewares adotados (CORS, JSON, logging etc.).
    - `09-13 (APIs de domínio)`: documentação das APIs (usuários, veículos, estações, reservas, estatísticas).
    - `14-autenticacao.md`: autenticação JWT (email/senha) e diretrizes de segurança.
    - `18-testes.md`: notas de testes locais.
    - `19-documentacao.md`: documentação consolidada de endpoints e integrações (inclui guia completo do banco).
    - `20-deploy.md`: diretrizes para implantação.
    - `21-mobile-preparacao.md`: checklist e considerações para mobile.
- Pastas do frontend (JS/HTML/CSS):
  - `login/`: telas e scripts de login; `login.html`, `login.css`, `login.js` (email/senha e Google). 
  - `home/`, `mapa/`, `perfil/`, `station/`: páginas e scripts que consomem a API (estações, reservas, perfil etc.).
  - `global/`: recursos utilitários compartilhados (quando aplicável).

## Explicação para Leigos (bem simples)
- **O que fizemos:** saímos de um site que salvava tudo no navegador (LocalStorage) para um sistema que salva tudo em um banco de dados de verdade (PostgreSQL). Agora as informações não somem quando muda de computador ou apaga o histórico.
- **Como funciona:**
  - O app (as páginas `login`, `mapa`, `reservas`, `perfil`) conversa com o nosso “servidor” (backend) pela internet, usando endereços que começam com `/api/...`.
  - O servidor pega os pedidos (ex.: “listar estações”) e busca no banco de dados (PostgreSQL). Depois devolve a resposta em formato texto (JSON).
  - Quando a pessoa faz login, o servidor entrega um “crachá” digital (token JWT). As páginas usam esse crachá para provar quem é o usuário nas próximas chamadas.
- **Qual API foi usada?**
  - A **nossa API** REST (endereços `/api/...`) feita com Node.js + Express. Ela é quem fala com o banco de dados e devolve as informações para o site.
  - Para login com Google, usamos a **API do Google Identity** (botão do Google). O token do Google é conferido no nosso servidor e trocado pelo nosso crachá (JWT).
- **Principais endereços (exemplos):**
  - `/api/health` (checar se está tudo ok)
  - `/api/estacoes` (listar estações do banco)
  - `/api/reservas` (listar/criar reservas)
  - `/api/usuarios` (listar/criar usuários)
  - `/api/auth/login` (login com email e senha)
  - `/api/auth/google` (login com Google)
- **Onde está o quê:**
  - “Servidor” (código da API): pasta `backend/` (arquivo principal `server.js`).
  - “Banco de dados”: está rodando no seu computador (ou via Docker) e os arquivos de criação ficam em `backend/database/`.
  - “Site” (páginas): pastas como `login/`, `mapa/`, `home/`, `perfil/`.

## Linha do Tempo (ordem cronológica do que foi feito)
1) Preparação do ambiente
   - Instalação de Node.js e PostgreSQL (ou definição do Docker Compose)
   - Criação do `.env` a partir do `config/env.example`

2) Configuração do backend
   - Criação/ajuste do `server.js` (Express, CORS, JSON, logs)
   - Conexão ao Postgres (`config/database.js`) e testes de conexão

3) Banco de dados
   - Criação das tabelas principais (schema)
   - Criação de seeds (ex.: estações) para testes

4) API REST
   - Endpoints básicos de saúde e estatísticas
   - Usuários (listar/criar, filtros por email)
   - Estações (listar com filtros)
   - Reservas (listar por email do usuário e criar com resolução automática de IDs)

5) Integração do frontend com a API
   - Mapa passa a listar estações do banco
   - Reservas passam a listar/criar via API
   - Perfil passa a ler dados do usuário via API

6) Autenticação
   - Login por email/senha com emissão de JWT
   - Integração do Google Identity; endpoint `/api/auth/google` valida token do Google e emite nosso JWT

7) Documentação e preparação para mobile
   - Guia completo dos endpoints e do banco (`19-documentacao.md`)
   - Resumo executivo para leigos (`00-relatorio-resumo.md`)
   - Checklist de mobile (`21-mobile-preparacao.md`)

