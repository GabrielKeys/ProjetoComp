# 🚀 Fase 1: Instalação dos Programas Necessários

Este guia te ajudará a instalar todos os programas necessários para desenvolver o backend do VoltWay.

## 📋 Pré-requisitos

Antes de começar, você precisará de:
- **Windows 10/11** (ou macOS/Linux)
- **Conexão com internet**
- **Privilégios de administrador** (para algumas instalações)

## 🛠️ Programas a Instalar

### 1. **Node.js** (Obrigatório)
**O que é:** Runtime JavaScript para executar o servidor backend.

#### **Download:**
- Acesse: https://nodejs.org/
- Baixe a versão **LTS** (Long Term Support)
- Versão recomendada: **18.x** ou **20.x**

#### **Instalação:**
1. Execute o arquivo `.msi` baixado
2. Siga o assistente de instalação
3. **IMPORTANTE**: Marque "Add to PATH" durante a instalação
4. Reinicie o terminal após a instalação

#### **Verificação:**
```bash
node --version
npm --version
```
**Resultado esperado:**
```
v18.17.0
9.6.7
```

---

### 2. **PostgreSQL** (Obrigatório)
**O que é:** Banco de dados relacional para armazenar os dados do sistema.

#### **Download:**
- Acesse: https://www.postgresql.org/download/windows/
- Baixe a versão mais recente (15.x ou 16.x)
- Escolha o instalador oficial

#### **Instalação:**
1. Execute o instalador
2. **IMPORTANTE**: Anote a senha do usuário `postgres`
3. Deixe a porta padrão: **5432**
4. Instale o **pgAdmin** (interface gráfica)
5. Complete a instalação

#### **Verificação:**
```bash
# Verificar se o serviço está rodando
Get-Service | Where-Object {$_.Name -like "*postgres*"}

# Testar conexão (substitua 'sua_senha' pela senha definida)
psql -U postgres -c "SELECT version();"
```

**Resultado esperado:**
```
Status   Name               DisplayName
------   ----               -----------
Running  postgresql-x64-16  postgresql-x64-16
```

---

### 3. **Git** (Opcional mas Recomendado)
**O que é:** Controle de versão para gerenciar o código.

#### **Download:**
- Acesse: https://git-scm.com/download/win
- Baixe a versão mais recente

#### **Instalação:**
1. Execute o instalador
2. Use as configurações padrão
3. Escolha "Git from the command line and also from 3rd-party software"

#### **Verificação:**
```bash
git --version
```

---

### 4. **Visual Studio Code** (Recomendado)
**O que é:** Editor de código moderno e gratuito.

#### **Download:**
- Acesse: https://code.visualstudio.com/
- Baixe a versão para Windows

#### **Extensões Recomendadas:**
- **PostgreSQL** - Para gerenciar o banco
- **Thunder Client** - Para testar APIs
- **Prettier** - Para formatação de código
- **ESLint** - Para análise de código

---

## 🔧 Configuração do Ambiente

### **1. Configurar PATH do PostgreSQL**
Se o comando `psql` não funcionar, adicione ao PATH:

```bash
# Adicionar ao PATH (substitua pela sua versão)
$env:PATH += ";C:\Program Files\PostgreSQL\16\bin"
```

### **2. Configurar Variáveis de Ambiente**
Crie um arquivo `.env` na pasta do projeto:

```env
# Configurações do Banco
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voltway
DB_USER=voltway_user
DB_PASSWORD=voltway123

# Configurações do Servidor
PORT=3000
NODE_ENV=development
```

---

## ✅ Checklist de Verificação

Antes de prosseguir, verifique se tudo está funcionando:

- [ ] Node.js instalado e funcionando
- [ ] npm funcionando
- [ ] PostgreSQL instalado e rodando
- [ ] psql funcionando
- [ ] Git instalado (opcional)
- [ ] VS Code instalado (opcional)

## 🚨 Problemas Comuns

### **Node.js não encontrado:**
```bash
# Solução: Reinstalar e marcar "Add to PATH"
# Ou adicionar manualmente ao PATH
```

### **PostgreSQL não inicia:**
```bash
# Solução: Verificar se o serviço está rodando
Get-Service postgresql-x64-16
Start-Service postgresql-x64-16
```

### **psql não encontrado:**
```bash
# Solução: Usar caminho completo
"C:\Program Files\PostgreSQL\16\bin\psql.exe" --version
```

## 🎯 Próximo Passo

Após completar esta instalação, prossiga para:
**[02-configuracao-inicial.md](./02-configuracao-inicial.md)** - Configuração inicial do projeto

---

**Tempo estimado:** 30-45 minutos  
**Dificuldade:** Iniciante  
**Próximo:** Configuração inicial do projeto
