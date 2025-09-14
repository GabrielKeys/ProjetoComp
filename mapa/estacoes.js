// ===============================
// Lista de estações fictícias
// ✅ Pode ter coordenadas OU endereço
// ===============================

const estacoes = [
    {
        nome: "Estação Cotia",
        lat: -23.66477,
        lng: -46.90269,
        potencia: "150 kW",
        tempoEspera: "10 min",
        abertura: "08:00",
        fechamento: "22:00"
    },

    {
        nome: "Estação Shopping",
        rua: "Avenida Paulista",
        numero: "1000",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01310-100",
        potencia: "90 kW",
        tempoEspera: "15 min",
        abertura: "06:00",
        fechamento: "23:00"
    },
    {
        nome: "Estação Centro",
        rua: "Praça da Sé",
        numero: "",
        cidade: "São Paulo",
        estado: "SP",
        potencia: "200 kW",
        tempoEspera: "5 min",
        abertura: "00:00",
        fechamento: "23:59"
    },
    /*
    {
        nome: "Estação Aeroporto Congonhas",
        lat: -23.6261,
        lng: -46.6566,
        potencia: "150 kW",
        tempoEspera: "12 min",
        abertura: "06:00", fechamento: "23:00"
    },

    { nome: "Estação Aeroporto Guarulhos", lat: -23.4356, lng: -46.4731, potencia: "200 kW", tempoEspera: "15 min", abertura: "00:00", fechamento: "23:59" },
    { nome: "Estação Vila Olímpia", lat: -23.5955, lng: -46.6852, potencia: "120 kW", tempoEspera: "12 min", abertura: "07:00", fechamento: "22:00" },
    { nome: "Estação Paulista", lat: -23.5614, lng: -46.6559, potencia: "90 kW", tempoEspera: "8 min", abertura: "06:00", fechamento: "23:00" },
    { nome: "Estação Sé", lat: -23.5505, lng: -46.6333, potencia: "200 kW", tempoEspera: "5 min", abertura: "00:00", fechamento: "23:59" },
    { nome: "Estação Higienópolis", lat: -23.5429, lng: -46.6536, potencia: "100 kW", tempoEspera: "15 min", abertura: "07:00", fechamento: "22:00" },
    { nome: "Estação Pinheiros", lat: -23.5617, lng: -46.7020, potencia: "180 kW", tempoEspera: "7 min", abertura: "06:00", fechamento: "23:00" },
    { nome: "Estação Vila Madalena", lat: -23.5570, lng: -46.6920, potencia: "110 kW", tempoEspera: "9 min", abertura: "06:00", fechamento: "23:59" },
    { nome: "Estação Morumbi", lat: -23.6097, lng: -46.7194, potencia: "200 kW", tempoEspera: "6 min", abertura: "05:00", fechamento: "23:00" },
    { nome: "Estação Tatuapé", lat: -23.5366, lng: -46.5613, potencia: "95 kW", tempoEspera: "14 min", abertura: "06:00", fechamento: "22:00" },
    { nome: "Estação Itaquera", lat: -23.5428, lng: -46.4728, potencia: "210 kW", tempoEspera: "4 min", abertura: "00:00", fechamento: "23:59" },
    { nome: "Estação Penha", lat: -23.5220, lng: -46.5403, potencia: "100 kW", tempoEspera: "12 min", abertura: "07:00", fechamento: "23:00" },
    { nome: "Estação Santana", lat: -23.5015, lng: -46.6246, potencia: "160 kW", tempoEspera: "10 min", abertura: "06:00", fechamento: "22:00" },
    { nome: "Estação Barra Funda", lat: -23.5275, lng: -46.6685, potencia: "180 kW", tempoEspera: "7 min", abertura: "05:00", fechamento: "23:59" },
    { nome: "Estação Lapa", lat: -23.5193, lng: -46.7033, potencia: "120 kW", tempoEspera: "11 min", abertura: "06:00", fechamento: "22:00" },
    { nome: "Estação Pacaembu", lat: -23.5411, lng: -46.6616, potencia: "130 kW", tempoEspera: "10 min", abertura: "07:00", fechamento: "23:00" },
    { nome: "Estação Brooklin", lat: -23.6165, lng: -46.6876, potencia: "200 kW", tempoEspera: "6 min", abertura: "06:00", fechamento: "22:00" },
    { nome: "Estação Moema", lat: -23.6010, lng: -46.6634, potencia: "140 kW", tempoEspera: "9 min", abertura: "06:00", fechamento: "23:59" },
    { nome: "Estação Santo Amaro", lat: -23.6525, lng: -46.7150, potencia: "220 kW", tempoEspera: "5 min", abertura: "05:00", fechamento: "23:00" },
    { nome: "Estação Socorro", lat: -23.6810, lng: -46.7033, potencia: "150 kW", tempoEspera: "10 min", abertura: "06:00", fechamento: "22:00" },
    { nome: "Estação Campo Belo", lat: -23.6265, lng: -46.6712, potencia: "130 kW", tempoEspera: "11 min", abertura: "06:00", fechamento: "22:00" },
    { nome: "Estação Vila Mariana", lat: -23.5881, lng: -46.6340, potencia: "120 kW", tempoEspera: "9 min", abertura: "06:00", fechamento: "23:59" },
  */
];

