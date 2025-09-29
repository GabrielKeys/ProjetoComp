/* mapa.js - versão com logs e geocoding robusto */

let map;
let userMarker;
let carregadores = [];
let ficticios = [];
const API_BASE = 'http://localhost:3000/api';

async function apiFetch(path, options = {}) {
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    options.headers || {}
  );
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return await resp.json();
}

/* ===============================
   Inicializa o mapa Google Maps
   =============================== */
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -23.5505, lng: -46.6333 },
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

  // Carrega as estações da API (fallback para fixas + registradas)
  carregarEstacoesDaApi()
    .then(() => console.log("✅ carregarEstacoesDaApi finalizado."))
    .catch(err => {
      console.error("Erro em carregarEstacoesDaApi:", err);
  carregarEstacoesFicticias()
        .then(() => console.log("✅ carregarEstacoesFicticias finalizado (fallback)."))
        .catch(e => console.error("Erro em carregarEstacoesFicticias:", e));
    });

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
   Carregar estações da API
   =============================== */
async function carregarEstacoesDaApi() {
  try {
    const json = await apiFetch(`/estacoes`);
    const lista = Array.isArray(json?.data) ? json.data : [];

    if (lista.length === 0) {
      mostrarMensagem("Nenhuma estação encontrada na API.", "aviso", true);
      return;
    }

    console.log(`🔎 Estações vindas da API: ${lista.length}`);

    // Mapeia os campos retornados pela API para o formato esperado por adicionarEstacaoNoMapa
    for (const row of lista) {
      const estacao = {
        nome: row.nome || row.name || "Estação",
        rua: row.rua || row.address || "",
        numero: row.numero || "",
        bairro: row.bairro || "",
        cidade: row.cidade || "",
        estado: row.estado || "",
        cep: row.cep || "",
        potencia: row.potencia || row.potencia_kw || "N/D",
        abertura: row.abertura || "",
        fechamento: row.fechamento || "",
        preco: row.preco || row.preco_kwh || "N/D",
        tempoEspera: row.tempo_espera || row.tempoEspera || "N/D",
        lat: row.latitude ?? row.lat,
        lng: row.longitude ?? row.lng,
      };

      // Se não vier lat/lng, tentar geocode do endereço
      if (estacao.lat == null || estacao.lng == null) {
        const enderecoParts = [
          estacao.rua,
          estacao.numero,
          estacao.bairro,
          estacao.cidade,
          estacao.estado,
          estacao.cep,
        ].filter(Boolean);
        if (enderecoParts.length > 0) {
          const endereco = enderecoParts.join(", ");
          const pos = await geocodeEnderecoPromise(endereco);
          if (pos) {
            estacao.lat = pos.lat();
            estacao.lng = pos.lng();
          }
        }
      }

      if (estacao.lat != null && estacao.lng != null) {
        adicionarEstacaoNoMapa(estacao);
      }
    }

    mostrarMensagem(`${lista.length} estações carregadas da API.`, "sucesso", true);
  } catch (err) {
    console.error("Erro ao carregar estações da API:", err);
    throw err;
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

    //Extras
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
      <b>${estacao.nome}</b><br>
      ${estacao.rua || ""} ${estacao.numero || ""}<br>
      ${estacao.cidade || ""} ${estacao.estado || ""} ${estacao.cep || ""}<br>
      Potência: ${estacao.potencia || "N/D"}<br>
      Horário: ${estacao.abertura || "?"} - ${estacao.fechamento || "?"}<br>

      <!-- Extras -->
      Preço: ${estacao.preco || "N/D"}<br> 
      Tempo de espera: ${estacao.tempoEspera || "N/D"}<br> 


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
        infowindow.open(map, marker);

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
