let map;
let userMarker;
let carregadores = [];
let ficticios = [];

// ===============================
// Inicializa o mapa Google Maps
// ===============================
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -23.5505, lng: -46.6333 }, // fallback SP
    zoom: 13,
    mapTypeControl: false,
    streetViewControl: true,
    fullscreenControl: true,
    gestureHandling: "greedy",

    // Estilo para esconder apenas POIs desnecessários
    styles: [
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
    ],
  });

  console.log("🗺️ Mapa inicializado.");

  // 1. Sempre carrega estações fictícias primeiro
  carregarEstacoesFicticias();

  // 2. Tenta geolocalização
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        map.setCenter(userLocation);
        map.setZoom(15);

        // marcador do usuário
        userMarker = new google.maps.Marker({
          position: userLocation,
          map: map,
          title: "Você está aqui",
          icon: {
            url: "../assets/carro-icone.png",
            scaledSize: new google.maps.Size(60, 60),
            anchor: new google.maps.Point(25, 50),
          },
        });

        console.log("📍 Localização encontrada:", userLocation);
        mostrarMensagem("📍 Localização encontrada!", "sucesso", true);

        // 3. carrega reais depois de 1,5s
        setTimeout(() => carregarEstacoesReais(userLocation), 1500);
      },
      () => {
        mostrarMensagem("⚠️ Não foi possível obter sua localização. Usando fallback.", "erro", true);
        const fallback = { lat: -23.5505, lng: -46.6333 };
        map.setCenter(fallback);
        setTimeout(() => carregarEstacoesReais(fallback), 1500);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else {
    mostrarMensagem("⚠️ Geolocalização não suportada.", "erro", true);
    const fallback = { lat: -23.5505, lng: -46.6333 };
    map.setCenter(fallback);
    setTimeout(() => carregarEstacoesReais(fallback), 1500);
  }

  // Restaurar filtro salvo
  const filtroCheckbox = document.getElementById("filtroRecarga");
  if (filtroCheckbox) {
    const estadoSalvo = localStorage.getItem("filtroRecarga");
    if (estadoSalvo !== null) {
      filtroCheckbox.checked = (estadoSalvo === "true");
    }
    aplicarFiltro(filtroCheckbox.checked);

    filtroCheckbox.addEventListener("change", () => {
      localStorage.setItem("filtroRecarga", filtroCheckbox.checked);
      aplicarFiltro(filtroCheckbox.checked);
    });
  }
}

// ===============================
// Carregar estações registradas (fictícias do app)
// ===============================
function carregarEstacoesFicticias() {
  estacoes.forEach((estacao) => {
    if (!estacao.lat || !estacao.lng) return;
    const position = { lat: estacao.lat, lng: estacao.lng };

    const marker = new google.maps.Marker({
      position,
      map,
      title: estacao.nome,
      icon: {
        url: "../assets/bateria-verde.png", // 🔋 verde = registrada
        scaledSize: new google.maps.Size(28, 28),
      },
    });

    // favoritos
    const usuarioAtual = localStorage.getItem("usuario");
    const chaveFavoritos = `favoritos_${usuarioAtual}`;
    let favoritos = JSON.parse(localStorage.getItem(chaveFavoritos)) || [];
    const jaFavorito = favoritos.some((fav) => fav.nome === estacao.nome);

    const contentString = `
      <div class="popup-estacao">
        <div class="popup-conteudo">
          <b>${estacao.nome}</b>
          ${estacao.rua || ""} ${estacao.numero || ""}<br>
          ${estacao.cidade || ""} ${estacao.estado || ""} ${estacao.cep || ""}<br>
          Potência: ${estacao.potencia || "N/D"}<br>
          Tempo de Espera: ${estacao.tempoEspera || "N/D"}<br>
          Horário: ${estacao.abertura || "?"} - ${estacao.fechamento || "?"}
        </div>
        <div class="popup-footer">
          <button class="btn-reservar" data-estacao='${JSON.stringify(estacao)}'>Reservar</button>
          <span class="estrela ${jaFavorito ? "favorita" : ""}" onclick="toggleFavorito('${estacao.nome}', this)"></span>
        </div>
      </div>
    `;

    const infowindow = new google.maps.InfoWindow({ content: contentString });

    marker.addListener("click", () => {
      infowindow.open(map, marker);

      google.maps.event.addListenerOnce(infowindow, "domready", () => {
        const btn = document.querySelector(".btn-reservar");
        if (btn) {
          btn.addEventListener("click", () => {
            const usuarioAtual = localStorage.getItem("usuario");
            localStorage.setItem(`estacaoSelecionada_${usuarioAtual}`, JSON.stringify(estacao));
            const agendamentoModal = document.getElementById("agendamentoModal");
            if (agendamentoModal) agendamentoModal.style.display = "flex";
            atualizarEstacao();
          });
        }
      });
    });

    ficticios.push(marker);
  });

  console.log(`✅ ${estacoes.length} estações registradas carregadas.`);
  mostrarMensagem(`${estacoes.length} estações registradas carregadas.`, "sucesso", true);
}

// ===============================
// Carregar estações não registradas (Google Places)
// ===============================
function carregarEstacoesReais(location) {
  const service = new google.maps.places.PlacesService(map);

  service.nearbySearch(
    {
      location,
      radius: 15000,
      keyword: "estação de carregamento de veículos elétricos",
    },
    (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        results.forEach((place) => {
          const marker = new google.maps.Marker({
            position: place.geometry.location,
            map,
            title: place.name,
            icon: {
              url: "../assets/bateria-cinza.png", // 🔋 cinza = não registrada
              scaledSize: new google.maps.Size(26, 26),
            },
          });

          const contentString = `
            <div class="popup-estacao">
              <div class="popup-conteudo">
                <b>${place.name}</b>
                ${place.vicinity || ""}<br>
                <span style="color:#666;font-size:12px">(Não registrada no app)</span>
              </div>
            </div>
          `;

          const infowindow = new google.maps.InfoWindow({ content: contentString });
          marker.addListener("click", () => infowindow.open(map, marker));

          carregadores.push(marker);
        });

        console.log(`⚡ ${results.length} estações não registradas carregadas.`);
        mostrarMensagem(`${results.length} estações não registradas carregadas.`, "aviso", true);

        // Reaplica o filtro depois de carregar
        const filtroAtivo = document.getElementById("filtroRecarga")?.checked ?? true;
        aplicarFiltro(filtroAtivo);
      } else {
        mostrarMensagem("Nenhuma estação não registrada encontrada.", "erro", true);
      }
    }
  );
}

// ===============================
// Função central do filtro
// ===============================
function aplicarFiltro(somenteRegistradas) {
  ficticios.forEach((m) => m.setMap(map));
  carregadores.forEach((m) => m.setMap(somenteRegistradas ? null : map));
}

// ===============================
// Favoritar / Desfavoritar estação
// ===============================
function toggleFavorito(nomeEstacao, elemento) {
  const usuarioAtual = localStorage.getItem("usuario");
  const chaveFavoritos = `favoritos_${usuarioAtual}`;

  let favoritos = JSON.parse(localStorage.getItem(chaveFavoritos)) || [];
  const index = favoritos.findIndex((fav) => fav.nome === nomeEstacao);

  if (index >= 0) {
    favoritos.splice(index, 1);
    mostrarMensagem(`${nomeEstacao} removida dos favoritos.`, "erro", true);
    if (elemento) elemento.classList.remove("favorita");
  } else {
    const estacao = estacoes.find((e) => e.nome === nomeEstacao);
    if (estacao) {
      favoritos.push(estacao);
      mostrarMensagem(`${nomeEstacao} adicionada aos favoritos!`, "sucesso", true);
      if (elemento) elemento.classList.add("favorita");
    }
  }

  localStorage.setItem(chaveFavoritos, JSON.stringify(favoritos));
}

// ===============================
// Mostrar mensagem sem duplicar
// ===============================
function mostrarMensagem(texto, tipo, evitarDuplicado = false) {
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
