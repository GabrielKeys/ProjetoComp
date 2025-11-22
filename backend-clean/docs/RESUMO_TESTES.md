# Resumo de Testes - VoltWay

## ✅ Status Atual

### Testes Realizados
- ✅ **Conexão com Banco**: Funcionando perfeitamente
- ✅ **Migrações**: Executadas com sucesso
- ✅ **Seed**: Dados iniciais populados

### Próximos Passos para Testar

## 1. Iniciar o Servidor

```bash
cd backend-clean
npm start
```

O servidor deve iniciar na porta 3000 e mostrar:
```
🚀 Servidor VoltWay rodando na porta 3000
📊 Ambiente: development
🌐 URL: http://localhost:3000
✅ Conectado ao banco de dados PostgreSQL
```

## 2. Testes Rápidos

### Teste 1: Health Check
Abra no navegador ou use curl:
```
http://localhost:3000/health
```

**Esperado:**
```json
{
  "success": true,
  "message": "VoltWay API está funcionando",
  "database": "connected"
}
```

### Teste 2: Listar Estações
```
http://localhost:3000/api/stations
```

**Esperado:** Lista de estações do banco (pelo menos 3 do seed)

### Teste 3: Registrar Usuário
Use Postman, Insomnia ou curl:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Teste","email":"teste@teste.com","password":"123456"}'
```

### Teste 4: Frontend
1. Abra o frontend
2. Faça login
3. Acesse o mapa
4. Verifique se estações aparecem
5. Teste buscar estações do Google Places

## 3. Checklist Completo

### Backend
- [x] Conexão com banco funcionando
- [ ] Servidor iniciando corretamente
- [ ] Health check retorna sucesso
- [ ] Rotas de estações funcionando
- [ ] Registro de usuário funcionando
- [ ] Login funcionando
- [ ] Rotas protegidas funcionando

### Frontend
- [ ] Login conecta com backend
- [ ] Mapa carrega estações do banco
- [ ] Busca Google Places funciona
- [ ] Sincronização automática funciona
- [ ] Carteira aparece corretamente
- [ ] Veículos aparecem corretamente

## 4. Comandos Úteis

```bash
# Testar conexão
npm run test:db

# Iniciar servidor
npm start

# Modo desenvolvimento (auto-reload)
npm run dev

# Ver logs do servidor
# (os logs aparecem no terminal onde o servidor está rodando)
```

## 5. Troubleshooting

### Servidor não inicia
- Verificar se porta 3000 está livre
- Verificar se `.env` está configurado
- Verificar se dependências estão instaladas

### Erro de conexão
- Verificar `DATABASE_URL` no `.env`
- Testar conexão: `npm run test:db`

### Erro 404 nas rotas
- Verificar se servidor está rodando
- Verificar se está usando `/api/` antes das rotas

## Documentação Completa

Veja `TESTES.md` para guia completo de testes.



