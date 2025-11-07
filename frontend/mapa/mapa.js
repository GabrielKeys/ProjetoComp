/* mapa.js - versão estruturada como o código antigo, com backend */

let map;
let userMarker;
let carregadores = [];
let ficticios = [];
let infowindowAtual = null;



/* ===============================
   Inicializar mapa
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
    streetViewControl: false,  // Bonequinho amarelo 
    fullscreenControl: false,  // Botão de tela cheia
    mapTypeControl: false,     // Botão de tipo de mapa 
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

  google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
    document.getElementById('map').classList.add('loaded');
  });


  google.maps.event.addListenerOnce(map, 'idle', limparFeedbackDoMapa);
  google.maps.event.addListenerOnce(map, 'tilesloaded', () => document.getElementById('map')?.classList.add('loaded'));

  // Geolocalização do usuário
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      map.setCenter(userLocation); map.setZoom(15);

      userMarker = new google.maps.Marker({
        position: userLocation, map, title: "Você está aqui",
        icon: { url: "../assets/carro-icone.png", scaledSize: new google.maps.Size(40, 40), anchor: new google.maps.Point(25, 50) }
      });

      carregarEstacoesDoBanco(userLocation);
    }, err => {
      const fallback = { lat: -23.5505, lng: -46.6333 };
      map.setCenter(fallback);
      carregarEstacoesDoBanco(fallback);
      mostrarMensagem("Não foi possível obter sua localização", "erro");
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  } else {
    const fallback = { lat: -23.5505, lng: -46.6333 };
    map.setCenter(fallback);
    carregarEstacoesDoBanco(fallback);
  }

  // Filtro persistente
  const filtroCheckbox = document.getElementById("filtroRecarga");
  if (filtroCheckbox) {
    filtroCheckbox.checked = localStorage.getItem("filtroRecarga") === "true";
    aplicarFiltro(filtroCheckbox.checked);
    filtroCheckbox.addEventListener("change", () => {
      localStorage.setItem("filtroRecarga", filtroCheckbox.checked);
      aplicarFiltro(filtroCheckbox.checked);
    });
  }
}
/* ===============================
   Utilitários
=============================== */
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function mostrarMensagem(texto = "", tipo = "info", persistente = false) {
  try {
    const id = `toast_${Date.now()}`;
    const containerId = "toast-container";
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      container.style.position = "fixed";
      container.style.right = "16px";
      container.style.top = "16px";
      container.style.zIndex = 99999;
      document.body.appendChild(container);
    }

    const el = document.createElement("div");
    el.id = id;
    el.className = `toast toast-${tipo}`;
    el.style.marginBottom = "8px";
    el.style.padding = "10px 14px";
    el.style.borderRadius = "8px";
    el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
    el.style.color = "#fff";
    el.style.fontFamily = "sans-serif";
    el.style.fontSize = "13px";
    el.style.maxWidth = "320px";

    switch (tipo) {
      case "sucesso": el.style.background = "#28a745"; break;
      case "erro": el.style.background = "#dc3545"; break;
      case "aviso": el.style.background = "#ffc107"; el.style.color = "#000"; break;
      default: el.style.background = "#343a40";
    }

    el.innerText = texto;
    container.appendChild(el);

    if (!persistente) {
      setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 400); }, 3500);
    }

    return el;
  } catch (e) { console.warn("mostrarMensagem falhou:", e); }
}

function formatarTelefone(tel) {
  if (!tel) return "N/D";
  const digits = String(tel).replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return tel;
}

function safeUserKey() {
  return localStorage.getItem("usuario") || "default";
}

/* ===============================
   Geocode (Promise)
=============================== */
function geocodeEnderecoPromise(endereco) {
  return new Promise(resolve => {
    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: endereco }, (results, status) => {
        if (status === "OK" && results && results[0]) resolve(results[0].geometry.location);
        else resolve(null);
      });
    } catch { resolve(null); }
  });
}

/* ===============================
   Limpar marcadores
=============================== */
function limparMarkers() {
  if (ficticios.length) {
    ficticios.forEach(m => { try { m.setMap(null); } catch (e) { } });
  }
  ficticios = [];
}

/* ===============================
   Filtro simples
=============================== */
function aplicarFiltro(mostrarApenasRecarga = false) {
  const powerMin = mostrarApenasRecarga ? 7 : -Infinity;
  ficticios.forEach(marker => {
    const est = marker._estacao || {};
    const power = Number(est.power ?? est.potencia ?? 0);
    marker.setVisible(isFinite(power) ? power >= powerMin : !mostrarApenasRecarga);
  });
}

/* ===============================
   Favoritos
=============================== */
function toggleFavorito(nome, estrelaElem) {
  const usuario = safeUserKey();
  const chave = `favoritos_${usuario}`;
  let favoritos = JSON.parse(localStorage.getItem(chave) || "[]");
  const idx = favoritos.findIndex(f => f.nome === nome);

  if (idx >= 0) {
    favoritos.splice(idx, 1);
    if (estrelaElem) estrelaElem.classList.remove("favorita");
    mostrarMensagem("Removido dos favoritos", "info");
  } else {
    favoritos.push({ nome, addedAt: new Date().toISOString() });
    if (estrelaElem) estrelaElem.classList.add("favorita");
    mostrarMensagem("Adicionado aos favoritos", "sucesso");
  }
  localStorage.setItem(chave, JSON.stringify(favoritos));
}

/* ===============================
   Atualizar estação (hook)
=============================== */
function atualizarEstacao() {
  console.log("atualizarEstacao() chamado (placeholder)");
}


/* ===============================
   Limpar botão "Report an issue"
=============================== */
function limparFeedbackDoMapa() {
  const tentarRemover = () => {
    document.querySelectorAll('*').forEach(el => {
      const txt = el.innerText?.trim() || "";
      if (txt === "Informar erro no mapa" || txt === "Report an issue on the map") {
        el.style.display = "none"; try { el.remove() } catch (e) { }
      }
    });
  };
  tentarRemover();
  let tent = 0;
  const intervalo = setInterval(() => {
    tentarRemover(); tent++;
    if (tent > 10) clearInterval(intervalo);
  }, 500);
}

/* ===============================
   Carregar estações do banco
=============================== */
async function carregarEstacoesDoBanco(userLocation = null) {
  try {
    const res = await fetch(`${API_BASE}/stations`);
    const estacoesBanco = await res.json();

    limparMarkers();

    for (let i = 0; i < estacoesBanco.length; i++) {
      const estacao = estacoesBanco[i];
      if (estacao.lat != null && estacao.lng != null) {
        adicionarEstacaoNoMapa(estacao);
      } else {
        const enderecoParts = [
          estacao.address || estacao.rua || "",
          estacao.number || estacao.numero || "",
          estacao.district || estacao.bairro || "",
          estacao.city || estacao.cidade || "",
          estacao.state || estacao.estado || "",
          estacao.cep || estacao.zip || ""
        ].filter(Boolean);
        if (!enderecoParts.length) continue;

        const pos = await geocodeEnderecoPromise(enderecoParts.join(", "));
        await sleep(150);
        if (!pos) continue;

        estacao.lat = pos.lat(); estacao.lng = pos.lng();
        adicionarEstacaoNoMapa(estacao);
      }
    }

    mostrarMensagem(`${estacoesBanco.length} estações carregadas do servidor`, "sucesso");
  } catch (err) {
    console.error("Erro em carregarEstacoesDoBanco:", err);
    mostrarMensagem("Erro ao buscar estações do servidor", "erro");
  }

  if (userLocation) {
    carregarEstacoesReais(userLocation);
  }

}

/* ===============================
   Adicionar estação no mapa
=============================== */
function adicionarEstacaoNoMapa(estacao) {
  try {
    const position = { lat: Number(estacao.lat), lng: Number(estacao.lng) };
    if (!isFinite(position.lat) || !isFinite(position.lng)) return;

    const nomeExibicao = estacao.name || estacao.nome || estacao.full_name || "Estação sem nome";

    const marker = new google.maps.Marker({
      position, map, title: nomeExibicao,
      icon: { url: "../assets/bateria-azul.png", scaledSize: new google.maps.Size(30, 30) }
    });
    marker._estacao = estacao;

    // InfoWindow
    const jaFavorito = (JSON.parse(localStorage.getItem(`favoritos_${safeUserKey()}`) || "[]")).some(f => f.nome === nomeExibicao);
    const content = `
      <div class="popup-estacao">
        <div class="popup-conteudo">
          <b>${nomeExibicao}</b><br>
          ${estacao.address || estacao.rua || ""} ${estacao.number || estacao.numero || ""}<br>
          ${estacao.district || estacao.bairro || "N/D"} - ${estacao.city || estacao.cidade || ""} / ${estacao.state || estacao.estado || ""}<br>
          Horário: ${estacao.open_time || estacao.open || "?"} - ${estacao.close_time || estacao.close || "?"}<br>
          Preço: ${estacao.price != null ? `R$ ${Number(estacao.price).toFixed(2)}/kWh` : "N/D"}<br>
          Potência: ${estacao.power ?? estacao.potencia ?? "N/D"} kW<br>
          Tempo de espera: ${estacao.wait_time ?? estacao.tempoEspera ?? "N/D"} min<br>
          Telefone: ${formatarTelefone(estacao.phone || estacao.telefone)}
        </div>
        <div class="popup-footer">
          <button class="btn-reservar">Reservar</button>
          <span class="estrela ${jaFavorito ? "favorita" : ""}" data-estacao="${encodeURIComponent(nomeExibicao)}"></span>
        </div>
      </div>
    `;
    const infowindow = new google.maps.InfoWindow({ content });
    marker.addListener("click", () => {
      if (infowindowAtual) infowindowAtual.close();
      infowindow.open(map, marker); infowindowAtual = infowindow;

      google.maps.event.addListenerOnce(infowindow, "domready", () => {
        const btn = document.querySelector(".btn-reservar");
        if (btn) {
          btn.onclick = null;
          btn.addEventListener("click", () => {
            localStorage.setItem(`estacaoSelecionada_${safeUserKey()}`, JSON.stringify(estacao));
            const modal = document.getElementById("agendamentoModal");
            if (modal) modal.style.display = "flex";
            atualizarEstacao();
          });
        }
        const estrela = document.querySelector(".estrela");
        if (estrela) {
          estrela.onclick = null;
          const handler = e => { e.stopPropagation(); toggleFavorito(nomeExibicao, estrela); };
          estrela.addEventListener("click", handler);
          estrela.addEventListener("touchstart", e => { e.preventDefault(); handler(e); });
        }
      });
    });

    ficticios.push(marker);
  } catch (err) { console.error("Erro ao adicionar estação:", err, estacao); }
}


/* ===============================
   Carregar estações não registradas (Places API New)
   =============================== */
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
          scaledSize: new google.maps.Size(30, 30),
        },
      });

      const nomeExibicao = place.displayName || "Estação Desconhecida";

      // 🔹 Popup SEM estrela (nem footer)
      const content = `
        <div class="popup-estacao">
          <div class="popup-conteudo">
            <b>${nomeExibicao}</b><br>
            ${place.formattedAddress || "Endereço não disponível"}<br>
            <span style="color:#666;font-size:12px">(Não registrada no app)</span>
          </div>
        </div>
      `;

      const infowindow = new google.maps.InfoWindow({ content });

      marker.addListener("click", () => {
        if (infowindowAtual) infowindowAtual.close();
        infowindow.open(map, marker);
        infowindowAtual = infowindow;
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



//placeholder de erro
function atualizarEstacao() {
  console.log("Função atualizarEstacao chamada (placeholder)");
}

function inputData() {
  console.log("Função inputData chamada (placeholder)");
}

// =========================================
// Sincroniza estações com o backend (único ponto)
// =========================================
async function sincronizarEstacoes() {
  try {
    // Usa o mesmo endpoint do mapa (backend local)
    const resp = await fetch(`${API_BASE}/stations`);
    const estacoes = await resp.json();

    if (Array.isArray(estacoes)) {
      const normalizadas = estacoes.map(e => ({
        nome: e.nome || e.name || e.full_name || "Sem nome",
        potencia: e.potencia ?? e.power ?? null,
        preco: e.preco ?? e.price ?? null,
        abertura: e.abertura ?? e.open_time ?? e.open ?? "?",
        fechamento: e.fechamento ?? e.close_time ?? e.close ?? "?",
        telefone: e.telefone ?? e.phone ?? "",
        tempoEspera: e.tempoEspera ?? e.wait_time ?? null,
        lat: Number(e.lat),
        lng: Number(e.lng),
        address: e.address ?? e.rua ?? "",
        number: e.number ?? e.numero ?? "",
        district: e.district ?? e.bairro ?? "",
        city: e.city ?? e.cidade ?? "",
        state: e.state ?? e.estado ?? "",
        cep: e.cep ?? e.zip ?? "",

        // 🔹 Inclui e-mail do responsável/usuário
        email:
          e.email ||
          e.estacaoEmail ||
          e.user_email ||
          e.responsavel_email ||
          e.responsavel ||
          e.contato ||
          e.owner_email ||
          e.user?.email ||
          null
      }));


      window.estacoes = normalizadas;
      localStorage.setItem("stations", JSON.stringify(normalizadas));

      console.log(`✅ ${normalizadas.length} estações salvas no localStorage e no window.estacoes`);
    } else {
      console.warn("⚠️ Resposta inesperada ao carregar estações:", estacoes);
    }
  } catch (e) {
    console.error("❌ Erro ao buscar estações:", e);
  }
}

// 🔹 Chama antes de inicializar o mapa
window.addEventListener("load", async () => {
  await sincronizarEstacoes();
  initMap(); // só inicia o mapa depois de sincronizar
});
