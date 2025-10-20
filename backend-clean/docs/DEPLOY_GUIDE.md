# 🚀 VoltWay Backend - Guia de Deploy

## 📋 **Deploy em Produção**

### **Render.com (Recomendado)**
1. **Acesse:** https://render.com
2. **Login:** GitHub
3. **New Web Service**
4. **Configuração:**
   - Repository: ProjetoComp
   - Branch: backend-postgresql
   - Root Directory: backend-clean
   - Build Command: npm install
   - Start Command: node server.js

### **Variáveis de Ambiente:**
```
DATABASE_URL=postgresql://usuario:senha@host:porta/database
JWT_SECRET=voltway-super-secret-jwt-key-2024
NODE_ENV=production
```

### **PostgreSQL:**
1. **New Database** → PostgreSQL
2. **Copiar DATABASE_URL**
3. **Adicionar nas variáveis de ambiente**

## 🔧 **Configuração Local**

### **Instalação:**
```bash
cd backend-clean
npm install
cp env.example .env
# Editar .env
npm run migrate
npm run seed
npm start
```

### **Testes:**
```bash
npm test
curl http://localhost:3000/health
```

## 📊 **Monitoramento**

### **Health Check:**
```
GET /health
```

### **APIs:**
- `/api/stations` - Estações
- `/api/wallet` - Carteira
- `/api/vehicles` - Veículos
- `/api/reservations` - Reservas

## 🚀 **Status Atual**

- ✅ **Deploy:** https://projetocomp.onrender.com
- ✅ **Banco:** PostgreSQL funcionando
- ✅ **APIs:** Todas funcionais
- ✅ **Frontend:** Integrado

**🎉 Sistema completo funcionando em produção!**
