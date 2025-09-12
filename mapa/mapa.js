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

  carregarEstacoesFicticias();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const precisao = pos.coords.accuracy;

        map.setCenter(userLocation);
        map.setZoom(15);

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

        console.log("📍 Localização encontrada:", userLocation, "Precisão:", precisao);

        if (precisao <= 50) {
          mostrarMensagem(`📍 Localização encontrada (precisão: ${Math.round(precisao)}m)`, "sucesso");
        } else if (precisao <= 200) {
          mostrarMensagem(`📍 Localização aproximada (precisão: ${Math.round(precisao)}m)`, "aviso");
        } else {
          mostrarMensagem(`⚠️ Localização imprecisa (precisão: ${Math.round(precisao)}m)`, "erro");
        }

        setTimeout(() => carregarEstacoesReais(userLocation), 1500);
      },
      (err) => {
        console.error(err);
        mostrarMensagem("Não foi possível obter sua localização precisa.", "erro");
        const fallback = { lat: -23.5505, lng: -46.6333 };
        map.setCenter(fallback);
        setTimeout(() => carregarEstacoesReais(fallback), 1500);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  } else {
    mostrarMensagem("Geolocalização não suportada no seu navegador.", "erro");
    const fallback = { lat: -23.5505, lng: -46.6333 };
    map.setCenter(fallback);
    setTimeout(() => carregarEstacoesReais(fallback), 1500);
  }

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
// Carregar estações registradas
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
        url: "../assets/bateria-verde.png",
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
          Potência: ${estacao.potencia || "N/D"}<br>
          Tempo de Espera: ${estacao.tempoEspera || "N/D"}<br>
          Horário: ${estacao.abertura || "?"} - ${estacao.fechamento || "?"}
        </div>
        <div class="popup-footer">
          <button class="btn-reservar">Reservar</button>
          <span class="estrela ${jaFavorito ? "favorita" : ""}" data-estacao="${estacao.nome}"></span>
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

        const estrela = document.querySelector(".estrela");
        if (estrela) {
          const handler = (e) => {
            e.stopPropagation();
            toggleFavorito(estacao.nome, estrela);
          };
          estrela.addEventListener("click", handler);
          estrela.addEventListener("touchstart", (e) => {
            e.preventDefault();
            handler(e);
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
// Carregar estações não registradas
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
              url: "../assets/bateria-cinza.png",
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
              <div class="popup-footer">
                <span class="estrela" data-estacao="${place.name}"></span>
              </div>
            </div>
          `;

          const infowindow = new google.maps.InfoWindow({ content: contentString });

          marker.addListener("click", () => {
            infowindow.open(map, marker);

            google.maps.event.addListenerOnce(infowindow, "domready", () => {
              const estrela = document.querySelector(".estrela");
              if (estrela) {
                const handler = (e) => {
                  e.stopPropagation();
                  toggleFavorito(place.name, estrela);
                };
                estrela.addEventListener("click", handler);
                estrela.addEventListener("touchstart", (e) => {
                  e.preventDefault();
                  handler(e);
                });
              }
            });
          });

          carregadores.push(marker);
        });

        console.log(`⚡ ${results.length} estações não registradas carregadas.`);
        mostrarMensagem(`${results.length} estações não registradas carregadas.`, "aviso", true);

        const filtroAtivo = document.getElementById("filtroRecarga")?.checked ?? true;
        aplicarFiltro(filtroAtivo);
      } else {
        mostrarMensagem("Nenhuma estação não registrada encontrada.", "erro", true);
      }
    }
  );
}

// ===============================
// Filtro
// ===============================
function aplicarFiltro(somenteRegistradas) {
  ficticios.forEach((m) => m.setMap(map));
  carregadores.forEach((m) => m.setMap(somenteRegistradas ? null : map));
}

// ===============================
// Favoritar / Desfavoritar
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
    const estacao = estacoes.find((e) => e.nome === nomeEstacao) || { nome: nomeEstacao };
    favoritos.push(estacao);
    mostrarMensagem(`${nomeEstacao} adicionada aos favoritos!`, "sucesso", true);
    if (elemento) elemento.classList.add("favorita");
  }

  localStorage.setItem(chaveFavoritos, JSON.stringify(favoritos));
}

// ===============================
// Mensagens
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

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.hash) {
    const alvo = document.querySelector(window.location.hash);
    if (alvo) {
      alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
});
