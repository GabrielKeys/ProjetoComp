let map;
let userMarker;
let carregadores = [];

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  configurarFiltro();
});

// ===============================
// Inicializa o mapa
// ===============================
function initMap() {
  map = L.map("map").setView([-23.5505, -46.6333], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      pos => {
        const userLocation = [pos.coords.latitude, pos.coords.longitude];
        const precisao = pos.coords.accuracy;

        map.setView(userLocation, 16);

        if (userMarker) {
          userMarker.setLatLng(userLocation);
        } else {
          userMarker = L.marker(userLocation, {
            title: `Você está aqui (precisão: ${Math.round(precisao)}m)`,
            icon: L.icon({
              iconUrl: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              iconSize: [32, 32]
            })
          }).addTo(map);

          // ===============================
          // Mensagem adaptada conforme precisão
          // ===============================
          if (precisao <= 50) {
            mostrarMensagem(
              `📍 Localização encontrada (precisão: ${Math.round(precisao)}m)`,
              "sucesso"
            );
          } else if (precisao <= 200) {
            mostrarMensagem(
              `📍 Localização aproximada (precisão: ${Math.round(precisao)}m)`,
              "aviso"
            );
          } else {
            mostrarMensagem(
              `⚠️ Localização imprecisa (precisão: ${Math.round(precisao)}m)`,
              "erro"
            );
          }
        }

        if (carregadores.length === 0) {
          carregarEstacoes();
        }
      },
      err => {
        console.error(err);
        mostrarMensagem("Não foi possível obter sua localização precisa.", "erro");
        carregarEstacoes();
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  } else {
    mostrarMensagem("Geolocalização não suportada no seu navegador.", "erro");
    carregarEstacoes();
  }
}

// ===============================
// Converte endereço em coordenadas
// ===============================
function obterLocalizacaoEstacao(estacao) {
  if (estacao.lat && estacao.lng) {
    return Promise.resolve({ lat: estacao.lat, lng: estacao.lng });
  }

  const endereco = `${estacao.rua || ""} ${estacao.numero || ""}, ${estacao.cidade || ""}, ${estacao.estado || ""}, ${estacao.cep || ""}`;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`;

  return fetch(url, { headers: { "Accept-Language": "pt-BR" } })
    .then(res => res.json())
    .then(data => {
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      } else {
        throw new Error("Endereço não encontrado");
      }
    });
}

// ===============================
// Adiciona marcadores das estações
// ===============================
function carregarEstacoes() {
  estacoes.forEach(estacao => {
    obterLocalizacaoEstacao(estacao)
      .then(coords => {
        const marker = L.marker([coords.lat, coords.lng], {
          title: estacao.nome,
          icon: L.icon({
            iconUrl: "https://cdn-icons-png.flaticon.com/512/3103/3103446.png",
            iconSize: [28, 28]
          })
        });

        const usuarioAtual = localStorage.getItem("usuario");
        const chaveFavoritos = `favoritos_${usuarioAtual}`;
        let favoritos = JSON.parse(localStorage.getItem(chaveFavoritos)) || [];

        const jaFavorito = favoritos.some(fav => fav.nome === estacao.nome);

        // ===============================
        // Popup com Reservar + Favoritar
        // ===============================
        marker.bindPopup(`
  <div class="popup-conteudo">
    <b>${estacao.nome}</b><br>
    ${estacao.rua || ""} ${estacao.numero || ""}<br>
    ${estacao.cidade || ""} - ${estacao.estado || ""} ${estacao.cep || ""}<br>
    Potência: ${estacao.potencia}<br>
    Tempo de Espera: ${estacao.tempoEspera}<br>
    Horário: ${estacao.abertura} - ${estacao.fechamento}
    <div class="popup-footer">
      <button class="btn-reservar" data-estacao='${JSON.stringify(estacao)}'>Reservar</button>
      <span class="estrela ${jaFavorito ? "favorita" : ""}" onclick="toggleFavorito('${estacao.nome}', this)"></span>
    </div>
  </div>
`);

        // Quando o popup abrir, adiciona evento ao botão
        marker.on("popupopen", (e) => {
          const btn = document.querySelector(".btn-reservar");
          if (btn) {
            btn.addEventListener("click", () => {
              abrirAgendamento(estacao);
            });
          }
        });

        function abrirAgendamento(estacao) {
          const usuarioAtual = localStorage.getItem("usuario");
          localStorage.setItem(`estacaoSelecionada_${usuarioAtual}`, JSON.stringify(estacao));

          const agendamentoModal = document.getElementById("agendamentoModal");
          if (agendamentoModal) {
            agendamentoModal.style.display = "flex";
          } else {
            mostrarMensagem("⚠️ Modal de agendamento não encontrado!", "erro");
          }

          atualizarEstacao(); // garante que o painel mostre a estação selecionada
        }


        // ===============================
        // Evento do botão Reservar
        // ===============================
        marker.on("popupopen", (e) => {
          const btn = e.popup._contentNode.querySelector(".btn-reservar");
          if (btn) {
            btn.addEventListener("click", () => {
              const estacao = JSON.parse(btn.getAttribute("data-estacao"));
              const usuarioAtual = localStorage.getItem("usuario");

              // salva estação selecionada
              localStorage.setItem(`estacaoSelecionada_${usuarioAtual}`, JSON.stringify(estacao));

              // abre modal de agendamento (o reserva.js já trata o submit)
              const agendamentoModal = document.getElementById("agendamentoModal");
              if (agendamentoModal) agendamentoModal.style.display = "flex";

              atualizarEstacao(); // atualiza painel lateral
            });
          }
        });

        marker.addTo(map);
        carregadores.push(marker);
      })
      .catch(err => {
        console.error(`Erro ao localizar ${estacao.nome}:`, err);
        mostrarMensagem(`Não foi possível localizar ${estacao.nome}`, "erro");
      });
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
  const index = favoritos.findIndex(fav => fav.nome === nomeEstacao);

  if (index >= 0) {
    favoritos.splice(index, 1);
    mostrarMensagem(`❌ ${nomeEstacao} removida dos favoritos.`, "erro");
    if (elemento) elemento.classList.remove("favorita");
  } else {
    const estacao = estacoes.find(e => e.nome === nomeEstacao);
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
    carregadores.forEach(marker => {
      if (filtro.checked) {
        marker.addTo(map);
      } else {
        map.removeLayer(marker);
      }
    });

    if (filtro.checked) {
      mostrarMensagem("Exibindo estações de recarga.", "aviso");
    } else {
      mostrarMensagem("Estações de recarga ocultadas.", "aviso");
    }
  });
}
