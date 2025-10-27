# 🔄 Guia de Migração - localStorage para API

## 📋 **O que foi migrado:**

### ✅ **Arquivos Criados/Atualizados:**

1. **`api-service.js`** - Serviço principal da API que substitui localStorage
2. **`login/login-api.js`** - Login atualizado para usar API
3. **`home/js/api-home.js`** - Home atualizado para usar API  
4. **`mapa/mapa-api.js`** - Mapa atualizado para usar API
5. **`migration.js`** - Script de migração automática
6. **`config.js`** - Configuração da aplicação
7. **HTMLs atualizados** - Para incluir os novos scripts

---

## 🚀 **Como usar a migração:**

### 1️⃣ **Configurar URL da API**

Edite o arquivo `config.js`:
```javascript
// Para desenvolvimento local
API_BASE_URL: 'http://localhost:3000/api'

// Para produção (após deploy)
API_BASE_URL: 'https://voltway-backend-production.up.railway.app/api'
```

### 2️⃣ **Incluir scripts nas páginas**

Adicione nos HTMLs que precisam da API:
```html
<!-- Configuração -->
<script src="config.js"></script>
<!-- API Service -->
<script src="api-service.js"></script>
<!-- Migration (opcional) -->
<script src="migration.js"></script>
```

### 3️⃣ **Usar versões com API**

Substitua os scripts antigos:
```html
<!-- ANTES (localStorage) -->
<script src="login.js"></script>
<script src="mapa.js"></script>

<!-- DEPOIS (API) -->
<script src="login-api.js"></script>
<script src="mapa-api.js"></script>
```

---

## 🔄 **Migração Automática:**

### **O que é migrado automaticamente:**
- ✅ **Dados do usuário** - Nome, email, etc.
- ✅ **Veículos** - Modelo, placa, bateria, etc.
- ✅ **Carteira** - Saldo e transações (com segurança)
- ❌ **Reservas** - Não migradas (dados temporários)
- ❌ **Estações** - Mantidas no banco de dados

### **Como funciona:**
1. Usuário faz login
2. Script detecta dados no localStorage
3. Migra automaticamente para a API
4. Limpa dados antigos do localStorage
5. Continua usando API daqui em diante

---

## 🧪 **Testando a Migração:**

### **1. Teste Local:**
```bash
# 1. Iniciar backend
cd backend
npm run dev

# 2. Abrir frontend
# 3. Fazer login
# 4. Verificar se dados foram migrados
```

### **2. Teste de Produção:**
```bash
# 1. Fazer deploy do backend
# 2. Atualizar config.js com URL de produção
# 3. Testar migração em produção
```

---

## 📊 **Comparação: localStorage vs API**

| Funcionalidade | localStorage | API |
|----------------|--------------|-----|
| **Usuários** | ❌ Limitado | ✅ Ilimitado |
| **Persistência** | ❌ Local apenas | ✅ Global |
| **Sincronização** | ❌ Não sincroniza | ✅ Sincroniza |
| **Segurança** | ❌ Dados expostos | ✅ Autenticação JWT |
| **Backup** | ❌ Manual | ✅ Automático |
| **Escalabilidade** | ❌ Limitada | ✅ Ilimitada |

---

## 🔧 **Troubleshooting:**

### **Problema: API não conecta**
```javascript
// Verificar URL da API
console.log(window.VOLTWAY_CONFIG.API_BASE_URL);

// Verificar se backend está rodando
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(console.log);
```

### **Problema: Dados não migram**
```javascript
// Executar migração manualmente
window.runVoltWayMigration()
  .then(success => console.log('Migração:', success));
```

### **Problema: localStorage não limpa**
```javascript
// Limpar manualmente
localStorage.clear();
```

---

## ✅ **Checklist de Migração:**

- [ ] ✅ Backend deployado e funcionando
- [ ] ✅ `config.js` configurado com URL correta
- [ ] ✅ Scripts de API incluídos nos HTMLs
- [ ] ✅ Login migrado para usar API
- [ ] ✅ Home migrado para usar API
- [ ] ✅ Mapa migrado para usar API
- [ ] ✅ Migração automática funcionando
- [ ] ✅ localStorage sendo limpo automaticamente
- [ ] ✅ Testes funcionando em produção

---

## 🎯 **Próximos Passos:**

1. ✅ **Testar migração localmente**
2. ✅ **Fazer deploy do backend**
3. ✅ **Atualizar URLs de produção**
4. ✅ **Testar em produção**
5. ✅ **Monitorar migração automática**

---

## 📞 **Suporte:**

Se encontrar problemas:
1. Verificar logs do console do navegador
2. Verificar se backend está rodando
3. Verificar configuração da API
4. Testar migração manualmente

**🚀 A migração está pronta para uso!**
