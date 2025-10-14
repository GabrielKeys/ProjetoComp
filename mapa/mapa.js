/* mapa.js - versão com logs e geocoding robusto */

let map;
let userMarker;
let carregadores = [];
let ficticios = [];
let infowindowAtual = null;

/* ===============================
   Inicializa o mapa Google Maps
   =============================== */
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    minZoom: 12, // NÃO DEIXA AFASTAR MAIS QUE ISSO
    maxZoom: 25, // NÃO DEIXA APROXIMAR MAIS QUE ISSO
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: false,
    rotateControl: false,
    scaleControl: false,

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
      { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "off" }] },


      // Fundo uniforme (sem efeito quadriculado)
      { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },

      // Labels do mapa
      { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#8f8f8f" }] },

      // Estradas
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#2A2A2A" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#131313" }] },
      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8f8f8f" }] },

      // Admin / fronteiras
      { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#3A3A3A" }] },

      // Paisagem
      { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#1E1E1E" }] },

      // Água
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4d4d4d" }] }
    ],

    // Desliga os controles que aparecem na imagem
    zoomControl: false,        // Botão de + e -
    streetViewControl: false,  // Bonequinho amarelo (pegman)
    fullscreenControl: true,  // Botão de tela cheia
    mapTypeControl: false,     // Botão de tipo de mapa (satélite / padrão)
    rotateControl: false,      // Controle de rotação
    scaleControl: false,       // Régua
  });

  let ultimoZoom = map.getZoom();
  console.log("🗺️ Mapa inicializado.");

  // Remover Label do google
  google.maps.event.addListenerOnce(map, 'idle', () => {
    limparFeedbackDoMapa();
  });

  function limparFeedbackDoMapa() {
    const tentarRemover = () => {
      document.querySelectorAll('*').forEach(el => {
        const texto = el.innerText?.trim() || "";
        if (
          texto === "Informar erro no mapa" ||
          texto === "Report an issue on the map"
        ) {
          console.log("🗑️ Removendo botão de feedback:", el);
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

  google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
    document.getElementById('map').classList.add('loaded');
  });



  // Carrega as estações (fixas + registradas)
  carregarEstacoesFicticias()
    .then(() => console.log("✅ carregarEstacoesFicticias finalizado."))
    .catch(err => console.error("Erro em carregarEstacoesFicticias:", err));

  // Geolocalização do usuário
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

        console.log("📍 Localização encontrada:", userLocation, "Precisão:", pos.coords.accuracy);
        setTimeout(() => carregarEstacoesReais(userLocation), 1500);
      },
      (err) => {
        console.warn("Não foi possível obter localização do usuário:", err);
        const fallback = { lat: -23.5505, lng: -46.6333 };
        map.setCenter(fallback);
        setTimeout(() => carregarEstacoesReais(fallback), 1500);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  } else {
    console.warn("Geolocalização não suportada.");
    const fallback = { lat: -23.5505, lng: -46.6333 };
    map.setCenter(fallback);
    setTimeout(() => carregarEstacoesReais(fallback), 1500);
  }

  // Filtro persistente
  const filtroCheckbox = document.getElementById("filtroRecarga");
  if (filtroCheckbox) {
    const estadoSalvo = localStorage.getItem("filtroRecarga");
    if (estadoSalvo !== null) filtroCheckbox.checked = (estadoSalvo === "true");
    aplicarFiltro(filtroCheckbox.checked);
    filtroCheckbox.addEventListener("change", () => {
      localStorage.setItem("filtroRecarga", filtroCheckbox.checked);
      aplicarFiltro(filtroCheckbox.checked);
    });
  }
}

/* ===============================
   Geocode (versão Promise)
   =============================== */
function geocodeEnderecoPromise(endereco) {
  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    console.log("📌 Geocoding:", endereco);
    geocoder.geocode({ address: endereco }, (results, status) => {
      console.log("📡 Status geocode:", status, results && results[0] ? results[0].geometry.location.toString() : results);
      if (status === "OK" && results && results[0]) {
        resolve(results[0].geometry.location);
      } else {
        resolve(null);
      }
    });
  });
}

/* ===============================
   Carregar estações registradas (fixas + localStorage)
   - Faz geocode sequencial para evitar sobrecarga
   =============================== */
async function carregarEstacoesFicticias() {
  try {
    if (typeof estacoes === "undefined") {
      console.error("❌ estacoes não definido. Verifique se estacoes.js foi carregado antes do mapa.js");
      return;
    }

    // copia lista original
    let todasEstacoes = Array.isArray(estacoes) ? [...estacoes] : [];
    // traz as registradas (salvas via form)
    let registradas = JSON.parse(localStorage.getItem("stations")) || [];

    registradas.forEach(st => {
      todasEstacoes.push({
        nome: st.stationName || st.name || st.nome || "Estação",
        rua: st.address || st.rua || "",
        numero: st.number || st.numero || "",
        bairro: st.district || st.bairro || "",
        cidade: st.city || st.cidade || "",
        estado: st.state || st.estado || "",
        cep: st.cep || "",
        potencia: st.potencia ? (st.potencia + " kW") : "N/D",
        abertura: st.open || st.abertura || "",
        fechamento: st.close || st.fechamento || "",
        telefone: st.telefone || "",
        preco: st.preco ? (st.preco + " R$/kWh") : "N/D",
        tempoEspera: st.tempoEspera ? (st.tempoEspera + " min") : "N/D",
      });
    });

    console.log("🔎 Total estações a processar:", todasEstacoes.length);

    // Processa sequencialmente para evitar muitos requests ao mesmo tempo
    for (let i = 0; i < todasEstacoes.length; i++) {
      const estacao = todasEstacoes[i];
      console.log(`→ Processando (${i + 1}/${todasEstacoes.length}):`, estacao.nome);

      if (estacao.lat && estacao.lng) {
        // já tem coordenadas
        adicionarEstacaoNoMapa(estacao);
      } else {
        const enderecoParts = [
          estacao.rua,
          estacao.numero,
          estacao.bairro,
          estacao.cidade,
          estacao.estado,
          estacao.cep
        ].filter(Boolean);

        if (enderecoParts.length === 0) {
          console.warn("⛔ Endereço incompleto / vazio para:", estacao.nome);
          continue;
        }

        const endereco = enderecoParts.join(", ");
        const pos = await geocodeEnderecoPromise(endereco);

        if (!pos) {
          console.warn("⛔ Geocode falhou para", estacao.nome, "endereco:", endereco);
          continue;
        }

        estacao.lat = pos.lat();
        estacao.lng = pos.lng();
        adicionarEstacaoNoMapa(estacao);
        // pequena pausa opcional para reduzir carga (se quiser, descomente)
        // await new Promise(r => setTimeout(r, 200));
      }
    }

    console.log(`✅ Processadas ${todasEstacoes.length} estações (fixas + registradas).`);
    mostrarMensagem(`${todasEstacoes.length} estações carregadas.`, "sucesso", true);

  } catch (err) {
    console.error("Erro em carregarEstacoesFicticias:", err);
  }
}

/* ===============================
   Adicionar estação no mapa (mantém popup/reservar/favoritar)
   =============================== */
function adicionarEstacaoNoMapa(estacao) {
  const position = { lat: Number(estacao.lat), lng: Number(estacao.lng) };
  if (!isFinite(position.lat) || !isFinite(position.lng)) {
    console.warn("⚠️ Coordenadas inválidas para:", estacao.nome, estacao);
    return;
  }

  // 🔑 Se não tiver nome definido, usar endereço como fallback
  if (!estacao.nome || estacao.nome.trim() === "") {
    estacao.nome = [
      estacao.rua,
      estacao.numero,
      estacao.cidade,
      estacao.estado
    ].filter(Boolean).join(", ");
  }

  const marker = new google.maps.Marker({
    position,
    map,
    title: estacao.nome,
    icon: {
      url: "../assets/bateria-azul.png",
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
      <b>${estacao.nome}</b><br>
      ${estacao.rua || ""} ${estacao.numero || ""} <br> ${estacao.bairro || "N/D"} - ${estacao.cidade || ""} / ${estacao.estado || ""}<br>
      Horário: ${estacao.abertura || "?"} - ${estacao.fechamento || "?"}<br>
      Preço: ${estacao.preco || "N/D"}<br> 
      Tempo de espera: ${estacao.tempoEspera || "N/D"}<br> 
      Telefone: ${formatarTelefone(estacao.telefone)}
    </div>
    <div class="popup-footer">
      <button class="btn-reservar">Reservar</button>
      <span class="estrela ${jaFavorito ? "favorita" : ""}" data-estacao="${estacao.nome}"></span>
    </div>
  </div>
`;


  const infowindow = new google.maps.InfoWindow({ content: contentString });

  marker.addListener("click", () => {
    if (infowindowAtual) infowindowAtual.close();
    infowindow.open(map, marker);
    infowindowAtual = infowindow;


    // após abrir a janela, registra handlers
    google.maps.event.addListenerOnce(infowindow, "domready", () => {
      const btn = document.querySelector(".btn-reservar");
      if (btn) {
        btn.addEventListener("click", () => {
          const usuarioAtual = localStorage.getItem("usuario");
          localStorage.setItem(`estacaoSelecionada_${usuarioAtual}`, JSON.stringify(estacao));
          const agendamentoModal = document.getElementById("agendamentoModal");
          if (agendamentoModal) agendamentoModal.style.display = "flex";
          if (typeof atualizarEstacao === "function") {
            atualizarEstacao();
          }
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
}

// ===============================
// Carregar estações não registradas (Places API New)
// ===============================
async function carregarEstacoesReais(location) {
  try {
    const { Place } = await google.maps.importLibrary("places");

    const request = {
      fields: ["displayName", "location", "formattedAddress"],
      locationRestriction: {
        center: location,
        radius: 15000, // 15 km
      },
      includedTypes: ["electric_vehicle_charging_station"],
    };

    const { places } = await Place.searchNearby(request);

    if (!places || places.length === 0) {
      mostrarMensagem("Nenhuma estação não registrada encontrada.", "erro", true);
      return;
    }

    places.forEach((place) => {
      const marker = new google.maps.Marker({
        position: place.location,
        map,
        title: place.displayName,
        icon: {
          url: "../assets/bateria-cinza.png",
          scaledSize: new google.maps.Size(26, 26),
        },
      });

      const contentString = `
        <div class="popup-estacao">
          <div class="popup-conteudo">
            <b>${place.displayName}</b>
            ${place.formattedAddress || ""}<br>
            <span style="color:#666;font-size:12px">(Não registrada no app)</span>
          </div>
          <div class="popup-footer">
            <span class="estrela" data-estacao="${place.displayName}"></span>
          </div>
        </div>
      `;

      const infowindow = new google.maps.InfoWindow({ content: contentString });

      marker.addListener("click", () => {
        if (infowindowAtual) infowindowAtual.close();
        infowindow.open(map, marker);
        infowindowAtual = infowindow;


        google.maps.event.addListenerOnce(infowindow, "domready", () => {
          const estrela = document.querySelector(".estrela");
          if (estrela) {
            const handler = (e) => {
              e.stopPropagation();
              toggleFavorito(place.displayName, estrela);
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

    mostrarMensagem(`${places.length} estações não registradas carregadas.`, "aviso", true);
    aplicarFiltro(document.getElementById("filtroRecarga")?.checked ?? true);

  } catch (err) {
    console.error("Erro ao carregar estações (Places API New):", err);
    mostrarMensagem("Erro ao buscar estações.", "erro", true);
  }
}
/* ===============================
   Filtro / Favoritos / Mensagens
   (mantive igual à sua versão original)
   =============================== */
function aplicarFiltro(somenteRegistradas) {
  ficticios.forEach((m) => m.setMap(map));
  carregadores.forEach((m) => m.setMap(somenteRegistradas ? null : map));
}

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
    const estacao = (typeof estacoes !== "undefined" && estacoes.find((e) => e.nome === nomeEstacao)) || { nome: nomeEstacao };
    favoritos.push(estacao);
    mostrarMensagem(`${nomeEstacao} adicionada aos favoritos!`, "sucesso", true);
    if (elemento) elemento.classList.add("favorita");
  }

  localStorage.setItem(chaveFavoritos, JSON.stringify(favoritos));
}

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

/* ===============================
   Ao carregar a página, scroll para hash se houver
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.hash) {
    const alvo = document.querySelector(window.location.hash);
    if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
