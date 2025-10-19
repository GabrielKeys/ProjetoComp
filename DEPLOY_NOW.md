# 🚀 DEPLOY AUTOMÁTICO - VOLTWAY

## ⚡ **DEPLOY EM 5 MINUTOS**

### **1. Acesse o Railway**
- Vá para: https://railway.app
- Faça login com GitHub
- Clique em **"New Project"**

### **2. Conecte o Repositório**
- Selecione **"Deploy from GitHub repo"**
- Escolha: **ProjetoComp**
- Branch: **backend-postgresql**
- Pasta: **backend/**

### **3. Adicione PostgreSQL**
- No projeto criado, clique em **"New"**
- Selecione **"Database"** → **"PostgreSQL"**
- **COPIE a DATABASE_URL** que aparece

### **4. Configure Variáveis de Ambiente**
Vá em **"Variables"** e adicione:

```
DATABASE_URL=<cole-a-url-do-postgres-aqui>
JWT_SECRET=voltway-super-secret-jwt-key-2024
NODE_ENV=production
```

### **5. Execute Migrações**
- Vá em **"Deployments"** → **"View Logs"**
- Execute: `npm run migrate`
- Execute: `npm run seed`

### **6. Teste a API**
- Acesse: `https://seu-projeto.railway.app/health`
- Deve retornar: `{"success":true,"message":"VoltWay API está funcionando"}`

---

## 🎯 **RESULTADO ESPERADO**

✅ **Backend rodando na Railway**  
✅ **PostgreSQL configurado**  
✅ **APIs funcionando**  
✅ **Pronto para conectar com o frontend**  

---

## 🔧 **PRÓXIMOS PASSOS**

1. **Testar APIs** com Postman ou curl
2. **Atualizar frontend** para usar a nova API
3. **Configurar domínio** personalizado (opcional)

---

## 📞 **PRECISA DE AJUDA?**

Se algo der errado:
1. Verifique os logs no Railway
2. Confirme se as variáveis estão corretas
3. Teste a conexão com o banco

**🚀 Deploy realizado com sucesso!**
