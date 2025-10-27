// VoltWay Mapa com API - Substitui localStorage
// ===============================

let map;
let userMarker;
let stationMarkers = [];
let infowindowAtual = null;

class VoltWayMapaAPI {
  constructor() {
    this.api = window.api;
    this.stations = [];
    this.favorites = [];
  }

  // ===============================
  // INICIALIZAÇÃO DO MAPA
  // ===============================

  async initMap() {
    console.log('🗺️ VoltWay Mapa API inicializado');

    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 13,
      minZoom: 12,
      maxZoom: 25,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      rotateControl: false,
      scaleControl: false,
      gestureHandling: "greedy",
      styles: this.getMapStyles(),
    });

    // Configurar controles do mapa
    this.setupMapControls();

    // Obter localização do usuário
    this.getUserLocation();

    // Carregar estações
    await this.loadStations();

    console.log('✅ Mapa inicializado com sucesso');
  }

  setupMapControls() {
    // Remover elementos do Google Maps
    google.maps.event.addListenerOnce(map, 'idle', () => {
      this.cleanMapElements();
    });

    // Adicionar classe quando mapa carregar
    google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
      document.getElementById('map').classList.add('loaded');
    });
  }

  getMapStyles() {
    return [
      { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { featureType: "poi.business", stylers: [{ visibility: "off" }] },
      { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
      { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
      { featureType: "poi.park", stylers: [{ visibility: "off" }] },
      { featureType: "poi.airport", stylers: [{ visibility: "off" }] },
      { featureType: "road", stylers: [{ visibility: "on" }] },
      { featureType: "administrative", stylers: [{ visibility: "on" }] },
      { featureType: "landscape", stylers: [{ visibility: "on" }] },
      { featureType: "water", stylers: [{ visibility: "on" }] },
      { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "off" }] },
      { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#8f8f8f" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#2A2A2A" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#131313" }] },
      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8f8f8f" }] },
      { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#3A3A3A" }] },
      { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#1E1E1E" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4d4d4d" }] }
    ];
  }

  cleanMapElements() {
    const tentarRemover = () => {
      document.querySelectorAll('*').forEach(el => {
        const texto = el.innerText?.trim() || "";
        if (
          texto === "Informar erro no mapa" ||
          texto === "Report an issue on the map"
        ) {
          console.log("Removendo botão de feedback:", el);
          el.style.display = "none";
          el.remove();
        }
      });
    };
    
    tentarRemover();
    let tentativas = 0;
    const intervalo = setInterval(() => {
      tentarRemover();
      tentativas++;
      if (tentativas > 10) clearInterval(intervalo);
    }, 500);
  }

  // ===============================
  // LOCALIZAÇÃO DO USUÁRIO
  // ===============================

  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          map.setCenter(userLocation);
          map.setZoom(15);

          userMarker = new google.maps.Marker({
            position: userLocation,
            map,
            title: "Você está aqui",
            icon: {
              url: "../assets/carro-icone.png",
              scaledSize: new google.maps.Size(60, 60),
              anchor: new google.maps.Point(25, 50),
            },
          });

          console.log("📍 Localização encontrada:", userLocation);
          
          // Carregar estações próximas
          setTimeout(() => this.loadNearbyStations(userLocation), 1500);
        },
        (err) => {
          console.warn("Não foi possível obter localização:", err);
          const fallback = { lat: -23.5505, lng: -46.6333 };
          map.setCenter(fallback);
          setTimeout(() => this.loadNearbyStations(fallback), 1500);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    } else {
      console.warn("Geolocalização não suportada.");
      const fallback = { lat: -23.5505, lng: -46.6333 };
      map.setCenter(fallback);
      setTimeout(() => this.loadNearbyStations(fallback), 1500);
    }
  }

  // ===============================
  // CARREGAMENTO DE ESTAÇÕES
  // ===============================

  async loadStations() {
    try {
      console.log('🔍 Carregando estações...');
      
      const response = await this.api.getStations({ limit: 100 });
      
      if (response.success) {
        this.stations = response.data.stations;
        console.log(`✅ ${this.stations.length} estações carregadas`);
        
        // Adicionar estações no mapa
        this.stations.forEach(station => {
          this.addStationToMap(station);
        });
        
        this.showMessage(`${this.stations.length} estações carregadas.`, "sucesso", true);
      }
    } catch (error) {
      console.error('Erro ao carregar estações:', error);
      this.showMessage("Erro ao carregar estações.", "erro", true);
    }
  }

  async loadNearbyStations(location) {
    try {
      console.log('🔍 Carregando estações próximas...');
      
      const response = await this.api.getStations({
        latitude: location.lat,
        longitude: location.lng,
        radius: 15,
        limit: 50
      });
      
      if (response.success) {
        const nearbyStations = response.data.stations;
        console.log(`✅ ${nearbyStations.length} estações próximas encontradas`);
        
        // Adicionar estações próximas (que ainda não estão no mapa)
        nearbyStations.forEach(station => {
          if (!this.stations.find(s => s.id === station.id)) {
            this.stations.push(station);
            this.addStationToMap(station);
          }
        });
        
        this.showMessage(`${nearbyStations.length} estações próximas encontradas.`, "sucesso", true);
      }
    } catch (error) {
      console.error('Erro ao carregar estações próximas:', error);
    }
  }

  // ===============================
  // ADICIONAR ESTAÇÕES NO MAPA
  // ===============================

  addStationToMap(station) {
    if (!station.latitude || !station.longitude) {
      console.warn("⚠️ Estação sem coordenadas:", station.name);
      return;
    }

    const position = { lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) };

    const marker = new google.maps.Marker({
      position,
      map,
      title: station.name,
      icon: {
        url: "../assets/bateria-azul.png",
        scaledSize: new google.maps.Size(28, 28),
      },
    });

    // Criar conteúdo do popup
    const contentString = this.createStationPopup(station);

    const infowindow = new google.maps.InfoWindow({ content: contentString });

    marker.addListener("click", () => {
      if (infowindowAtual) infowindowAtual.close();
      infowindow.open(map, marker);
      infowindowAtual = infowindow;

      // Configurar eventos do popup
      google.maps.event.addListenerOnce(infowindow, "domready", () => {
        this.setupPopupEvents(station, infowindow);
      });
    });

    stationMarkers.push(marker);
  }

  createStationPopup(station) {
    return `
      <div class="popup-estacao">
        <div class="popup-conteudo">
          <b>${station.name}</b><br>
          ${station.street || ""} ${station.number || ""}<br>
          ${station.neighborhood || "N/D"} - ${station.city || ""} / ${station.state || ""}<br>
          Horário: ${station.openingHour || "?"} - ${station.closingHour || "?"}<br>
          Preço: ${station.pricePerKwh ? `R$ ${station.pricePerKwh}/kWh` : "N/D"}<br>
          Tempo de espera: ${station.waitingTimeMinutes ? `${station.waitingTimeMinutes} min` : "N/D"}<br>
          Telefone: ${this.formatPhone(station.phone || "")}
        </div>
        <div class="popup-footer">
          <button class="btn-reservar" data-station-id="${station.id}">Reservar</button>
          <span class="estrela" data-station-id="${station.id}"></span>
        </div>
      </div>
    `;
  }

  setupPopupEvents(station, infowindow) {
    // Botão de reservar
    const reservarBtn = document.querySelector(".btn-reservar");
    if (reservarBtn) {
      reservarBtn.addEventListener("click", () => {
        this.createReservation(station);
      });
    }

    // Botão de favorito
    const estrela = document.querySelector(".estrela");
    if (estrela) {
      estrela.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleFavorite(station.id, estrela);
      });
    }
  }

  // ===============================
  // RESERVAS
  // ===============================

  async createReservation(station) {
    try {
      // Verificar se usuário tem veículos
      const vehiclesResponse = await this.api.getVehicles();
      if (!vehiclesResponse.success || vehiclesResponse.data.vehicles.length === 0) {
        this.showMessage("Cadastre um veículo antes de fazer reservas!", "erro");
        return;
      }

      // Mostrar modal de reserva
      this.showReservationModal(station, vehiclesResponse.data.vehicles);
      
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      this.showMessage("Erro ao criar reserva", "erro");
    }
  }

  showReservationModal(station, vehicles) {
    // Implementar modal de reserva
    const data = prompt("Data da reserva (YYYY-MM-DD):");
    const horaInicio = prompt("Hora de início (HH:MM):");
    const horaFim = prompt("Hora de fim (HH:MM):");

    if (data && horaInicio && horaFim) {
      // Selecionar primeiro veículo (pode ser melhorado)
      const vehicle = vehicles[0];
      
      this.api.createReservation({
        stationId: station.id,
        vehicleId: vehicle.id,
        reservationDate: data,
        startTime: horaInicio + ":00",
        endTime: horaFim + ":00",
        notes: "Reserva via mapa"
      }).then(response => {
        if (response.success) {
          this.showMessage("Reserva criada com sucesso!", "sucesso");
        } else {
          this.showMessage("Erro ao criar reserva: " + response.message, "erro");
        }
      }).catch(error => {
        this.showMessage("Erro ao criar reserva", "erro");
      });
    }
  }

  // ===============================
  // FAVORITOS
  // ===============================

  async toggleFavorite(stationId, element) {
    try {
      const response = await this.api.toggleFavoriteStation(stationId);
      
      if (response.success) {
        const isFavorite = response.data.isFavorite;
        
        if (isFavorite) {
          element.classList.add("favorita");
          this.showMessage("Estação adicionada aos favoritos!", "sucesso", true);
        } else {
          element.classList.remove("favorita");
          this.showMessage("Estação removida dos favoritos.", "erro", true);
        }
      }
    } catch (error) {
      console.error('Erro ao gerenciar favorito:', error);
      this.showMessage("Erro ao gerenciar favorito", "erro");
    }
  }

  // ===============================
  // FILTROS
  // ===============================

  setupFilters() {
    const filtroCheckbox = document.getElementById("filtroRecarga");
    if (filtroCheckbox) {
      const estadoSalvo = localStorage.getItem("filtroRecarga");
      if (estadoSalvo !== null) filtroCheckbox.checked = (estadoSalvo === "true");
      this.aplicarFiltro(filtroCheckbox.checked);
      
      filtroCheckbox.addEventListener("change", () => {
        localStorage.setItem("filtroRecarga", filtroCheckbox.checked);
        this.aplicarFiltro(filtroCheckbox.checked);
      });
    }
  }

  aplicarFiltro(somenteRegistradas) {
    // Implementar filtro se necessário
    stationMarkers.forEach((marker) => {
      marker.setMap(map);
    });
  }

  // ===============================
  // UTILITÁRIOS
  // ===============================

  formatPhone(phone) {
    if (!phone) return "N/D";
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  showMessage(texto, tipo, evitarDuplicado = false) {
    if (evitarDuplicado) {
      const jaExiste = document.querySelector(`.msg-${tipo}[data-texto="${texto}"]`);
      if (jaExiste) return;
    }
    
    const div = document.createElement("div");
    div.className = `mensagem msg-${tipo}`;
    div.innerText = texto;
    div.setAttribute("data-texto", texto);
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
  }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  window.mapaAPI = new VoltWayMapaAPI();
  window.mapaAPI.setupFilters();
});

// Função global para inicializar o mapa (chamada pelo Google Maps)
function initMap() {
  window.mapaAPI.initMap();
}
