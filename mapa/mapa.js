let map;
let userMarker;
let carregadores = [];

document.addEventListener("DOMContentLoaded", () => {
  configurarFiltro();
});

// ===============================
// Inicializa o mapa Google Maps
// ===============================
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -23.5505, lng: -46.6333 },
    zoom: 13,
    mapTypeControl: false,   // remove satélite
    streetViewControl: true,
    fullscreenControl: true,
    gestureHandling: "greedy" // zoom direto com scroll
  });

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (pos) => {
        const userLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        const precisao = pos.coords.accuracy;

        map.setCenter(userLocation);
        map.setZoom(16);

        if (userMarker) {
          userMarker.setPosition(userLocation);
        } else {
          userMarker = new google.maps.Marker({
            position: userLocation,
            map: map,
            title: `Você está aqui (precisão: ${Math.round(precisao)}m)`,
            icon: {
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: new google.maps.Size(32, 32),
            },
          });
        }

        if (precisao <= 50) {
          mostrarMensagem(`📍 Localização encontrada (precisão: ${Math.round(precisao)}m)`, "sucesso");
        } else if (precisao <= 200) {
          mostrarMensagem(`📍 Localização aproximada (precisão: ${Math.round(precisao)}m)`, "aviso");
        } else {
          mostrarMensagem(`⚠️ Localização imprecisa (precisão: ${Math.round(precisao)}m)`, "erro");
        }

        if (carregadores.length === 0) {
          carregarEstacoes();
        }
      },
      (err) => {
        console.error(err);
        mostrarMensagem("Não foi possível obter sua localização precisa.", "erro");
        carregarEstacoes();
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  } else {
    mostrarMensagem("Geolocalização não suportada no seu navegador.", "erro");
    carregarEstacoes();
  }
}

// ===============================
// Adiciona marcadores das estações
// ===============================
function carregarEstacoes() {
  estacoes.forEach((estacao) => {
    if (!estacao.lat || !estacao.lng) {
      console.warn(`⚠️ Estação ${estacao.nome} sem coordenadas.`);
      return;
    }

    const position = { lat: estacao.lat, lng: estacao.lng };

    const marker = new google.maps.Marker({
      position,
      map,
      title: estacao.nome,
      icon: {
        url: "https://cdn-icons-png.flaticon.com/512/3103/3103446.png",
        scaledSize: new google.maps.Size(28, 28),
      },
    });

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
      Potência: ${estacao.potencia}<br>
      Tempo de Espera: ${estacao.tempoEspera}<br>
      Horário: ${estacao.abertura} - ${estacao.fechamento}
    </div>
    <div class="popup-footer">
      <button class="btn-reservar" data-estacao='${JSON.stringify(estacao)}'>Reservar</button>
      <span class="estrela ${jaFavorito ? "favorita" : ""}" onclick="toggleFavorito('${estacao.nome}', this)"></span>
    </div>
  </div>
`;

    const infowindow = new google.maps.InfoWindow({
      content: contentString,
    });

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

    carregadores.push(marker);
  });

  mostrarMensagem(`${estacoes.length} estações foram carregadas.`, "sucesso");
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
    mostrarMensagem(`❌ ${nomeEstacao} removida dos favoritos.`, "erro");
    if (elemento) elemento.classList.remove("favorita");
  } else {
    const estacao = estacoes.find((e) => e.nome === nomeEstacao);
    if (estacao) {
      favoritos.push(estacao);
      mostrarMensagem(`⭐ ${nomeEstacao} adicionada aos favoritos!`, "sucesso");
      if (elemento) elemento.classList.add("favorita");
    }
  }

  localStorage.setItem(chaveFavoritos, JSON.stringify(favoritos));
}

// ===============================
// Filtro para mostrar/esconder estações
// ===============================
function configurarFiltro() {
  const filtro = document.getElementById("filtroRecarga");
  if (!filtro) return;

  filtro.addEventListener("change", () => {
    carregadores.forEach((marker) => {
      marker.setMap(filtro.checked ? map : null);
    });

    if (filtro.checked) {
      mostrarMensagem("Exibindo estações de recarga.", "aviso");
    } else {
      mostrarMensagem("Estações de recarga ocultadas.", "aviso");
    }
  });
}
