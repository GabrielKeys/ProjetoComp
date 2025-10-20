# 🔌 VoltWay Backend - Documentação da API

## 📋 **Endpoints Disponíveis**

### **Base URL:** `https://projetocomp.onrender.com`

---

## 🏥 **Health Check**

### **GET /health**
Verifica se a API está funcionando.

**Resposta:**
```json
{
  "success": true,
  "message": "VoltWay API está funcionando",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

## 🏪 **Estações**

### **GET /api/stations**
Lista todas as estações de carregamento.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "stations": [
      {
        "id": "1",
        "name": "Estação Teste",
        "address": "Rua Teste, 123",
        "city": "São Paulo",
        "state": "SP",
        "latitude": -23.5505,
        "longitude": -46.6333,
        "powerKw": 150,
        "pricePerKwh": 0.85
      }
    ]
  }
}
```

---

## 💰 **Carteira**

### **GET /api/wallet**
Obtém dados da carteira do usuário.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "id": "1",
      "userId": "1",
      "balance": 100.00,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

## 🚗 **Veículos**

### **GET /api/vehicles**
Lista veículos do usuário.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "id": "1",
        "userId": "1",
        "model": "Tesla Model 3",
        "year": 2022,
        "plate": "ABC-1234",
        "batteryCapacity": 75.0,
        "chargingPower": 11.0
      }
    ]
  }
}
```

---

## 📅 **Reservas**

### **GET /api/reservations**
Lista reservas do usuário.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "reservations": [
      {
        "id": "1",
        "userId": "1",
        "stationId": "1",
        "reservationDate": "2024-01-15",
        "startTime": "10:00:00",
        "endTime": "12:00:00",
        "status": "confirmed",
        "totalCost": 10.00
      }
    ]
  }
}
```

---

## 🔧 **Configuração do Frontend**

### **config.js**
```javascript
window.VOLTWAY_CONFIG = {
  API_BASE_URL: 'https://projetocomp.onrender.com/api'
};
```

### **Uso no Frontend:**
```javascript
// Exemplo de uso
fetch('https://projetocomp.onrender.com/api/stations')
  .then(response => response.json())
  .then(data => console.log(data));
```

---

## 🧪 **Testes**

### **cURL:**
```bash
# Health check
curl https://projetocomp.onrender.com/health

# Estações
curl https://projetocomp.onrender.com/api/stations

# Carteira
curl https://projetocomp.onrender.com/api/wallet
```

### **JavaScript:**
```javascript
// Teste básico
fetch('https://projetocomp.onrender.com/health')
  .then(response => response.json())
  .then(data => console.log(data));
```

---

## 📊 **Status da API**

- ✅ **Health Check:** Funcionando
- ✅ **Estações:** Funcionando
- ✅ **Carteira:** Funcionando
- ✅ **Veículos:** Funcionando
- ✅ **Reservas:** Funcionando

**🚀 Todas as APIs estão funcionando em produção!**
