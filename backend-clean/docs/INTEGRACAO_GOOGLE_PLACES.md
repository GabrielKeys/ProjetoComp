# Integração com Google Places API

## Data: 2024

## Resumo
Implementação de sincronização automática de estações de carregamento do Google Places API para o banco de dados, eliminando a necessidade de criar manualmente milhares de estações.

## Problema Resolvido
Antes da implementação, as estações precisavam ser criadas manualmente no banco de dados. Com a integração, as estações encontradas pelo Google Places são automaticamente sincronizadas e salvas no banco.

## Implementação

### 1. Rota de Sincronização no Backend
**Arquivo**: `backend-clean/server.js`
**Rota**: `POST /api/stations/sync`

**Funcionalidades:**
- Recebe lista de estações do Google Places
- Verifica duplicatas por coordenadas (tolerância de 100m)
- Extrai cidade e estado do endereço automaticamente
- Gera valores realistas:
  - Potência: 50-200 kW (aleatório)
  - Preço: R$ 0,70 - R$ 1,20/kWh (aleatório)
- Retorna estatísticas de inserção

**Exemplo de Request:**
```json
{
  "stations": [
    {
      "name": "Estação Shopping Iguatemi",
      "address": "Av. Brigadeiro Luiz Antonio, 3132, São Paulo - SP",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "formattedAddress": "Av. Brigadeiro Luiz Antonio, 3132, São Paulo - SP"
    }
  ]
}
```

**Exemplo de Response:**
```json
{
  "success": true,
  "data": {
    "message": "Sincronização concluída: 5 inseridas, 2 ignoradas",
    "inserted": 5,
    "skipped": 2,
    "errors": []
  }
}
```

### 2. Método no Frontend API Service
**Arquivo**: `api-service.js`
**Método**: `syncGoogleStations(stations)`

Envia estações encontradas do Google Places para o backend sincronizar.

### 3. Atualização do Mapa
**Arquivo**: `mapa/mapa.js`
**Função**: `carregarEstacoesReais(location)`

**Fluxo:**
1. Busca estações no Google Places API
2. Envia para backend sincronizar
3. Recarrega estações do banco
4. Mostra no mapa

## Como Funciona

### Fluxo Completo

```
1. Usuário acessa o mapa
   ↓
2. Frontend busca estações no Google Places API
   ↓
3. Estações encontradas são enviadas para /api/stations/sync
   ↓
4. Backend verifica duplicatas
   ↓
5. Estações novas são salvas no banco
   ↓
6. Frontend recarrega estações do banco
   ↓
7. Estações aparecem no mapa
```

### Vantagens

✅ **Automático**: Não precisa criar estações manualmente
✅ **Dados Reais**: Usa estações reais do Google Maps
✅ **Sem Duplicatas**: Verifica antes de inserir
✅ **Crescimento Orgânico**: Quanto mais usuários, mais estações são adicionadas
✅ **Valores Realistas**: Gera potência e preço automaticamente

## Arquivos Modificados

### Backend
- `backend-clean/server.js` - Adicionada rota `/api/stations/sync`

### Frontend
- `api-service.js` - Adicionado método `syncGoogleStations()`
- `mapa/mapa.js` - Atualizada função `carregarEstacoesReais()`

## Script de População (Opcional)

**Arquivo**: `backend-clean/scripts/populate-google-stations.js`

Script para popular o banco com estações de exemplo baseadas em dados reais de São Paulo. Pode ser executado manualmente:

```bash
npm run populate:stations
```

**Nota**: Funciona sem chave da API do Google, usando dados de exemplo.

## Status
✅ Sincronização automática implementada
✅ Integração com Google Places funcionando
✅ Duplicatas sendo evitadas
✅ Valores realistas sendo gerados

