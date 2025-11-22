# Como Popular Banco com Estações do Google Places

## 📍 Duas Formas de Popular

### 1. 🚀 Forma Automática (Recomendada)

A forma mais fácil é através do frontend. Quando um usuário busca estações no mapa, elas são automaticamente sincronizadas com o banco.

#### Como Funciona:

1. **Acesse o mapa no frontend**
2. **Busque estações do Google Places** (geralmente há um botão ou função para isso)
3. **As estações encontradas são automaticamente salvas no banco**
4. **Pronto!** Outros usuários já verão essas estações

#### Vantagens:
- ✅ Automático
- ✅ Sem necessidade de scripts
- ✅ Crescimento orgânico (quanto mais usuários, mais estações)
- ✅ Dados sempre atualizados

---

### 2. 🔧 Forma Manual (Script)

Use o script para popular o banco com estações de exemplo ou com a API do Google (se tiver chave).

#### Opção A: Sem Chave da API (Dados de Exemplo)

O script funciona sem chave da API, usando estações reais de São Paulo:

```bash
cd backend-clean
npm run populate:stations
```

**O que acontece:**
- Busca 12 estações reais de São Paulo (dados de exemplo)
- Verifica duplicatas antes de inserir
- Gera valores realistas (potência e preço)
- Mostra quantas foram inseridas/ignoradas

**Resultado esperado:**
```
🔄 Iniciando população de estações do Google Places...
📍 12 estações encontradas
✅ Inserida: Estação Shopping Iguatemi
✅ Inserida: Estação Parque Villa-Lobos
...
📊 Resumo:
   ✅ Inseridas: 9
   ⏭️  Ignoradas: 3
   📍 Total processadas: 12
✅ População concluída!
```

#### Opção B: Com Chave da API do Google

Se você tiver uma chave da Google Places API:

1. **Adicione no `.env`:**
```env
GOOGLE_PLACES_API_KEY=sua-chave-aqui
```

2. **Execute o script:**
```bash
npm run populate:stations
```

**O que acontece:**
- Busca estações reais do Google Places API
- Até 20 estações em um raio de 15km de São Paulo
- Salva automaticamente no banco

---

## 📋 Estações que Serão Adicionadas (Sem API)

O script adiciona estas estações reais de São Paulo:

1. Estação Shopping Iguatemi
2. Estação Parque Villa-Lobos
3. Estação Terminal Tietê
4. Estação Shopping Center Norte
5. Estação Aeroporto de Congonhas
6. Estação Shopping Morumbi
7. Estação Parque Ibirapuera
8. Estação Shopping Eldorado
9. Estação Shopping JK Iguatemi
10. Estação Shopping Cidade Jardim
11. Estação Estação da Luz
12. Estação Aeroporto de Guarulhos

---

## 🔍 Verificar Estações Adicionadas

Após executar o script, verifique:

```bash
# Via API
curl http://localhost:3000/api/stations

# Ou no navegador
http://localhost:3000/api/stations
```

---

## 🎯 Qual Forma Usar?

### Use a Forma Automática se:
- ✅ Você quer que o sistema cresça naturalmente
- ✅ Você tem usuários acessando o mapa
- ✅ Você quer dados sempre atualizados

### Use o Script Manual se:
- ✅ Você quer popular o banco rapidamente com dados iniciais
- ✅ Você quer testar com várias estações de uma vez
- ✅ Você tem uma chave da API do Google e quer buscar muitas estações

---

## 🛠️ Troubleshooting

### Script não encontra estações
- Verifique se o banco está conectado: `npm run test:db`
- Verifique se as migrações foram executadas: `npm run migrate`

### Erro ao buscar da API do Google
- Verifique se a chave está correta no `.env`
- Verifique se a chave tem permissão para Places API
- O script funciona sem chave (usa dados de exemplo)

### Estações duplicadas
- O script verifica duplicatas automaticamente
- Estações com coordenadas próximas (< 100m) são ignoradas

---

## 📝 Exemplo Completo

```bash
# 1. Ir para pasta do backend
cd backend-clean

# 2. Verificar conexão
npm run test:db

# 3. Popular com estações
npm run populate:stations

# 4. Verificar resultado
curl http://localhost:3000/api/stations | jq '.data.stations | length'
```

---

## ✅ Pronto!

Agora você tem estações no banco e pode:
- Ver no mapa do frontend
- Fazer reservas
- Usar todas as funcionalidades



