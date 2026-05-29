// ====================================
// reserva.js (usuário)
// ====================================
const API_BASE = "https://voltway-backend.onrender.com";

// ====================================
// pequenos utilitários
// ====================================


function normalizeName(n) {
  return (n || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
function namesEqual(a, b) {
  return normalizeName(a) === normalizeName(b);
}


function getEstacaoKey(estacao) {
  return (estacao && (estacao.email || estacao.nome)) || "unknown";
}


// ====================================
// Encontrar qual identificador de usuário usar para os keys do veículo

function findUsuarioIdForVeiculo(preferredId) {
  const candidates = [];
  if (preferredId) candidates.push(preferredId);
  const fromLocalEmail = localStorage.getItem("usuarioEmail");
  const fromLocal = localStorage.getItem("usuario");
  if (fromLocalEmail && !candidates.includes(fromLocalEmail)) candidates.push(fromLocalEmail);
  if (fromLocal && !candidates.includes(fromLocal)) candidates.push(fromLocal);

  // devolve o primeiro que tenha qualquer chave de veículo presente (compatibilidade)
  for (const id of candidates) {
    if (!id) continue;
    if (localStorage.getItem(`veiculoModelo_${id}`) ||
      localStorage.getItem(`veiculoAno_${id}`) ||
      localStorage.getItem(`veiculoPlaca_${id}`)) {
      return id;
    }
  }
  // se nenhum tem dados, devolve preferido ou o primeiro candidato (p/ leitura/escrita posterior)
  return preferredId || fromLocalEmail || fromLocal || "";
}

// helper para checar se um valor do localStorage conta como "preenchido"
function isFilledValue(v) {
  if (!v && v !== 0) return false;
  const s = String(v).trim();
  if (s === "" || /^-+$/.test(s)) return false;
  if (s.toLowerCase().includes("----")) return false;
  return true;
}

// ====================================
// Atualizar estatísticas da estação
// ====================================
function atualizarEstacao() {
  const usuarioAtual = localStorage.getItem("usuario");
  const estacaoSel = JSON.parse(localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`));

  const statPotencia = document.getElementById("statPotencia");
  const statEspera = document.getElementById("statEspera");
  const statDisponibilidade = document.getElementById("statDisponibilidade");
  const stationMsg = document.getElementById("stationMsg");
  const btnAgendar = document.getElementById("btnAgendar");
  const statPreco = document.getElementById("statPreco"); // Extras

  if (estacaoSel) {
    // 🔹 tentar resolver objeto completo (stations localStorage -> window.estacoes -> fallback)
    const stations = JSON.parse(localStorage.getItem("stations")) || [];
    let estacao = stations.find(s => namesEqual(s.nome, estacaoSel.nome))
      || (window.estacoes || []).find(s => namesEqual(s.nome, estacaoSel.nome))
      || estacaoSel;

    if (statPotencia) statPotencia.textContent = estacao.potencia ? (estacao.potencia + " kW") : "--";
    if (statEspera) statEspera.textContent = estacao.tempoEspera ? (estacao.tempoEspera + " min") : "--";
    if (statDisponibilidade) statDisponibilidade.textContent = `${estacao.abertura || "?"} - ${estacao.fechamento || "?"}`;
    if (stationMsg) stationMsg.textContent = `Estação selecionada: ${estacao.nome}`;
    if (statPreco) statPreco.textContent = estacao.preco ? (estacao.preco + " R$/kWh") : "--"; // Extras
    if (btnAgendar) btnAgendar.disabled = false;
  } else {
    if (statPotencia) statPotencia.textContent = "--";
    if (statEspera) statEspera.textContent = "--";
    if (statDisponibilidade) statDisponibilidade.textContent = "--";
    if (stationMsg) stationMsg.textContent = "Nenhuma estação de recarga selecionada.";
    if (statPreco) statPreco.textContent = "--"; //Extras
    if (btnAgendar) btnAgendar.disabled = true;
  }
}

// ====================================
// Modal de Seleção de Estação
// ====================================

// 🔹 Garante que window.estacoes tenha os dados do banco antes de carregar favoritos
if (!window.estacoes || !window.estacoes.length) {
  const estacoesBD = localStorage.getItem("stations");
  if (estacoesBD) {
    try {
      window.estacoes = JSON.parse(estacoesBD);
    } catch (e) {
      console.warn("Erro ao carregar stations do localStorage:", e);
      window.estacoes = [];
    }
  } else {
    window.estacoes = [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const usuarioAtual = localStorage.getItem("usuario");
  const btnSelecionar = document.getElementById("btnSelecionarEstacao");
  const modal = document.getElementById("stationModal");
  const closeBtn = modal ? modal.querySelector(".close") : null;
  const listaEstacoes = document.getElementById("listaEstacoes");
  const chaveFavoritos = `favoritos_${usuarioAtual}`;

  function carregarFavoritos() {
    return JSON.parse(localStorage.getItem(chaveFavoritos)) || [];
  }

  let favoritos = carregarFavoritos();
  let favoritosVisuais = favoritos.map(() => true);

  // ============================================================
  // Renderiza lista de estações favoritas (dados via localStorage)
  // ============================================================
  function renderizarLista() {
    if (!listaEstacoes) return;
    listaEstacoes.innerHTML = "";

    favoritos = carregarFavoritos();
    favoritosVisuais = favoritos.map(() => true);

    if (favoritos.length === 0) {
      listaEstacoes.innerHTML = "<li>Nenhuma estação favoritada ainda.</li>";
      return;
    }

    const stations = JSON.parse(localStorage.getItem("stations")) || [];

    favoritos.forEach((fav, idx) => {
      const estacaoCompleta =
        stations.find(s => namesEqual(s.nome, fav.nome)) ||
        (window.estacoes || []).find(s => namesEqual(s.nome, fav.nome)) ||
        fav;

      const li = document.createElement("li");
      li.className = "estacao-item";

      // Linha principal
      const linha = document.createElement("div");
      linha.className = "estacao-linha";

      const nome = document.createElement("span");
      nome.className = "estacao-nome";
      nome.textContent = estacaoCompleta.nome;

      const acoes = document.createElement("div");
      acoes.className = "estacao-acoes";

      // Estrela de favorito (visual)
      const estrela = document.createElement("span");
      estrela.className = "estrela-modal favorita";
      estrela.title = "Clique para desfavoritar";
      estrela.style.backgroundImage = "url('../assets/estrela.png')";
      if (!favoritosVisuais[idx]) estrela.classList.remove("favorita");

      estrela.addEventListener("click", (e) => {
        e.stopPropagation();
        favoritosVisuais[idx] = !favoritosVisuais[idx];
        estrela.classList.toggle("favorita", favoritosVisuais[idx]);
        if (favoritosVisuais[idx]) {
          if (typeof mostrarMensagem === "function") mostrarMensagem(`${estacaoCompleta.nome} adicionada aos favoritos!`, "sucesso", true);
        } else {
          if (typeof mostrarMensagem === "function") mostrarMensagem(`${estacaoCompleta.nome} removida dos favoritos.`, "erro", true);
        }
      });

      // Botão Selecionar
      const btnSelect = document.createElement("button");
      btnSelect.className = "btn-selecionar-estacao";
      btnSelect.textContent = "Selecionar";
      btnSelect.addEventListener("click", (e) => {
        e.stopPropagation();
        localStorage.setItem(`estacaoSelecionada_${usuarioAtual}`, JSON.stringify(estacaoCompleta));
        salvarFavoritosEFechar();
      });

      acoes.appendChild(btnSelect);
      acoes.appendChild(estrela);

      linha.appendChild(nome);
      linha.appendChild(acoes);

      // ============================================================
      // Detalhes da estação 
      // ============================================================
      const detalhes = document.createElement("div");
      detalhes.className = "detalhes-estacao ativo";

      detalhes.innerHTML = `
      <p><strong>Endereço:</strong><br>
      ${estacaoCompleta.address || estacaoCompleta.rua || ""} 
      ${estacaoCompleta.number || estacaoCompleta.numero || ""}<br>
      ${estacaoCompleta.district || estacaoCompleta.bairro || "N/D"} - 
      ${estacaoCompleta.city || estacaoCompleta.cidade || "N/D"} / 
      ${estacaoCompleta.state || estacaoCompleta.estado || ""}
      </p>
      <p><strong>Horário:</strong> 
      ${estacaoCompleta.open_time || estacaoCompleta.abertura || "?"} - 
      ${estacaoCompleta.close_time || estacaoCompleta.fechamento || "?"}
      </p>
      <p><strong>Preço:</strong> 
      ${estacaoCompleta.price != null
          ? `R$ ${Number(estacaoCompleta.price).toFixed(2)}/kWh`
          : (estacaoCompleta.preco != null
            ? `R$ ${Number(estacaoCompleta.preco).toFixed(2)}/kWh`
            : "N/D")}
      </p>
      <p><strong>Potência:</strong> 
        ${estacaoCompleta.power ?? estacaoCompleta.potencia ?? "N/D"} kW
      </p>
      <p><strong>Tempo de espera:</strong> 
        ${estacaoCompleta.wait_time ?? estacaoCompleta.tempoEspera ?? "N/D"} min
      </p>
      <p><strong>Telefone:</strong> 
        ${formatarTelefone(estacaoCompleta.phone || estacaoCompleta.telefone)}
      </p>
  `;

      li.appendChild(linha);
      li.appendChild(detalhes);

      listaEstacoes.appendChild(li);
    });
  }

  // ============================================================
  // Funções auxiliares
  // ============================================================
  function salvarFavoritos() {
    const originais = carregarFavoritos();
    const novos = originais.filter((_, i) => favoritosVisuais[i]);
    localStorage.setItem(chaveFavoritos, JSON.stringify(novos));
    favoritos = novos;
    favoritosVisuais = favoritos.map(() => true);
  }

  function salvarFavoritosEFechar() {
    salvarFavoritos();
    if (favoritos.length === 0) {
      localStorage.removeItem(`estacaoSelecionada_${usuarioAtual}`);
    }
    if (modal) modal.style.display = "none";
    if (typeof atualizarEstacao === "function") atualizarEstacao();
  }

  function abrirModal() {
    favoritos = carregarFavoritos();
    favoritosVisuais = favoritos.map(() => true);
    renderizarLista();
    if (modal) modal.style.display = "flex";
  }

  if (btnSelecionar) {
    btnSelecionar.addEventListener("click", (e) => {
      e.preventDefault();
      abrirModal();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      salvarFavoritosEFechar();
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) salvarFavoritosEFechar();
  });
});


// ====================================
// Modal de Agendamento
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  const btnAgendar = document.getElementById("btnAgendar");
  const agendamentoModal = document.getElementById("agendamentoModal");
  const closeBtns = document.querySelectorAll("#agendamentoModal .close");

    if (btnAgendar) {
    btnAgendar.addEventListener("click", () => {
      if (!agendamentoModal) return;

      const usuarioAtual = localStorage.getItem("usuario");

      const estacaoSel = JSON.parse(
        localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`) || "null"
      );

      if (!estacaoSel) {
        mostrarMensagem?.("❌ Selecione uma estação antes de agendar.", "erro");
        return;
      }

      const stations = JSON.parse(localStorage.getItem("stations")) || [];

      const estacao =
        stations.find(s => namesEqual(s.nome, estacaoSel.nome)) ||
        (window.estacoes || []).find(s => namesEqual(s.nome, estacaoSel.nome)) ||
        estacaoSel;

      const abertura =
        estacao.open_time ||
        estacao.openTime ||
        estacao.open ||
        estacao.abertura ||
        estacao.horarioAbertura;

      const fechamento =
        estacao.close_time ||
        estacao.closeTime ||
        estacao.close ||
        estacao.fechamento ||
        estacao.horarioFechamento;

      const form = agendamentoModal.querySelector("form");
      if (form) form.reset();

      const mensagens = agendamentoModal.querySelectorAll(".mensagem, .alert, .erro");
      mensagens.forEach(msg => msg.remove());

      const checkboxes = agendamentoModal.querySelectorAll("input[type='checkbox']");
      checkboxes.forEach(cb => (cb.checked = false));

      preencherHorariosPermitidos(abertura, fechamento);

      agendamentoModal.style.display = "flex";
    });
}

  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (agendamentoModal) agendamentoModal.style.display = "none";
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target === agendamentoModal) agendamentoModal.style.display = "none";
  });
});

// ====================================
// Funções de Reservas (Backend)
// ====================================

// ============================================================
// Função para carregar reservas com cache local
// ============================================================

let reservasCache = []; // 🧠 cache global na memória

async function carregarReservas(force = false) {
  const usuarioEmail = localStorage.getItem("usuarioEmail");
  if (!usuarioEmail) {
    console.warn("⚠️ Nenhum usuário logado.");
    return [];
  }

  // 🔁 Usa cache se já existir e não for forçado o reload
  if (reservasCache.length > 0 && !force) {
    console.log("📦 Usando cache local de reservas:", reservasCache);
    return reservasCache;
  }

  try {
    console.log("🌐 Buscando reservas do backend...");
    const res = await fetch(`${API_BASE}/reservas/${usuarioEmail}`);
    if (!res.ok) throw new Error("Erro ao buscar reservas");

    const reservas = await res.json();
    reservasCache = Array.isArray(reservas) ? reservas : []; // 💾 salva no cache
    console.log("✅ Reservas recebidas do backend:", reservasCache);

    return reservasCache;
  } catch (erro) {
    console.error("❌ Erro ao carregar reservas:", erro);
    return [];
  }
}

async function salvarReservas(reservas) {
  const usuarioEmail = localStorage.getItem("usuarioEmail");
  if (!usuarioEmail) return;

  try {
    const res = await fetch(`${API_BASE}/reservas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_email: usuarioEmail,
        reservas,
      }),
    });

    if (!res.ok) throw new Error("Erro ao salvar reservas");
    console.log("💾 Reservas salvas no banco.");
  } catch (erro) {
    console.error("❌ Erro ao salvar reservas:", erro);
  }
}

// ====================================
// Validação de dados do veículo (via banco)
// ====================================
async function dadosVeiculoPreenchidos(usuarioEmail) {
  if (!usuarioEmail) return false;

  try {
    const resp = await fetch(`${API_BASE}/veiculos/${usuarioEmail}`);
    if (!resp.ok) {
      console.warn("⚠️ Erro ao buscar veículo:", resp.status);
      return false;
    }

    const veiculo = await resp.json();
    if (!veiculo || Object.keys(veiculo).length === 0) return false;

    const camposValidos =
      veiculo.modelo &&
      veiculo.ano &&
      veiculo.placa &&
      veiculo.bateria &&
      veiculo.carregamento;

    return Boolean(camposValidos);
  } catch (err) {
    console.error("❌ Erro de rede ao verificar veículo:", err);
    return false;
  }
}

async function renderizarReservas() {
  const reservas = await carregarReservas();
  console.log("🔍 Reservas carregadas:", reservas);

  const textoReserva = document.getElementById("textoReserva");
  const lista = document.getElementById("listaReservas");
  const textoReservaMapa = document.getElementById("textoReservaMapa");
  const listaMapa = document.getElementById("listaReservasMapa");

  if (!reservas || reservas.length === 0) {
    if (textoReserva) textoReserva.textContent = "Nenhuma reserva agendada.";
    if (lista) lista.innerHTML = "";
    if (textoReservaMapa) textoReservaMapa.textContent = "Nenhuma reserva agendada.";
    if (listaMapa) listaMapa.innerHTML = "";
    return;
  }

  const primeira = reservas[0];
  console.log("🧩 Primeira reserva:", primeira);

  const estacaoNome = primeira?.estacao_nome || primeira?.estacao_email || "Estação desconhecida";
  const dataReserva = primeira?.data ? new Date(primeira.data).toLocaleDateString("pt-BR") : "--/--/----";
  const horarioInicio = primeira?.inicio ? primeira.inicio.slice(0, 5) : "--:--";
  const horarioFim = primeira?.fim ? primeira.fim.slice(0, 5) : "--:--";

  const reservaHtml = `
    <strong>Próxima Reserva</strong>
    <p>Estação: ${estacaoNome}</p>
    <p>Data: ${dataReserva}</p>
    <p>Horário: ${horarioInicio} às ${horarioFim}</p>
  `;

  if (textoReserva) textoReserva.innerHTML = reservaHtml;
  if (textoReservaMapa) textoReservaMapa.innerHTML = reservaHtml;
  if (document.getElementById("btnDetalhesReserva"))
    document.getElementById("btnDetalhesReserva").style.display = "block";
}

// ====================================
// Modal de Detalhes da Reserva + Cancelamento
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  const btnDetalhes = document.getElementById("btnDetalhesReserva");
  const btnDetalhesMapa = document.getElementById("btnDetalhesReservaMapa");
  const modalDetalhes = document.getElementById("detalhesReservaModal");
  const listaDetalhes = document.getElementById("listaDetalhesReservas");
  const closeBtn = modalDetalhes ? modalDetalhes.querySelector(".close") : null;

  const confirmarModal = document.getElementById("confirmarCancelamentoModal");
  const btnConfirmar = document.getElementById("btnCancelarConfirmar");
  const btnFechar = document.getElementById("btnCancelarFechar");
  const btnRemoverCanceladas = document.getElementById("btnRemoverCanceladas");

  // cache das reservas (normalizadas) vindas do backend
  let reservasCache = [];

  // Atualiza status tanto no usuário quanto na estação 
  const atualizarStatus = typeof atualizarStatusReservaEstacao === "function"
    ? atualizarStatusReservaEstacao
    : atualizarStatusReserva; // compatibilidade com código antigo

  // Função que atualiza no usuário e na estação (mantive seu comportamento local)
  function atualizarStatusReservaEstacao(estacaoEmail, usuarioEmail, data, hora, status) {
    // Atualiza no usuário 
    const reservasUsuario = JSON.parse(localStorage.getItem(`reservasUsuario_${usuarioEmail}`)) || [];
    const reservaU = reservasUsuario.find(r => r.data === data && r.hora === hora && r.estacaoEmail === estacaoEmail);
    if (reservaU) reservaU.status = status;
    localStorage.setItem(`reservasUsuario_${usuarioEmail}`, JSON.stringify(reservasUsuario));

    // Atualiza na estação
    const reservasEstacao = JSON.parse(localStorage.getItem(`reservasEstacao_${estacaoEmail}`)) || [];
    const reservaE = reservasEstacao.find(r => r.data === data && r.hora === hora && r.usuarioEmail === usuarioEmail);
    if (reservaE) reservaE.status = status;
    localStorage.setItem(`reservasEstacao_${estacaoEmail}`, JSON.stringify(reservasEstacao));
  }

  // utilitário robusto para recuperar dados do veículo (mantive igual)
  function getVeiculoForReservation(r) {
    if (r && r.veiculo && typeof r.veiculo === "object") return r.veiculo;

    const ids = [];
    if (r) {
      if (r.usuarioEmail) ids.push(r.usuarioEmail);
      if (r.usuario) ids.push(r.usuario);
    }
    const usuarioAtual = localStorage.getItem("usuario");
    const usuarioEmailAtual = localStorage.getItem("usuarioEmail");
    if (usuarioAtual) ids.push(usuarioAtual);
    if (usuarioEmailAtual) ids.push(usuarioEmailAtual);
    const uniqueIds = [...new Set(ids.filter(Boolean))];

    for (const id of uniqueIds) {
      const modelo = localStorage.getItem(`veiculoModelo_${id}`);
      if (modelo && modelo.toString().trim() !== "") {
        return {
          modelo: modelo,
          ano: localStorage.getItem(`veiculoAno_${id}`) || "",
          placa: localStorage.getItem(`veiculoPlaca_${id}`) || "",
          bateria: localStorage.getItem(`veiculoBateria_${id}`) || "",
          carga: localStorage.getItem(`veiculoCarregamento_${id}`) || ""
        };
      }
    }
    return null;
  }

  // ================================
  // Renderiza detalhes das reservas (agora buscando do backend)
  // ================================
  async function renderizarDetalhes() {
    try {
      const email = localStorage.getItem("usuarioEmail");
      if (!listaDetalhes) return;
      listaDetalhes.innerHTML = "";

      if (!email) {
        listaDetalhes.innerHTML = "<li>Usuário não autenticado.</li>";
        return;
      }

      // 1) Buscar reservas do backend
      let fetched = [];
      try {
        const res = await fetch(`${API_BASE}/reservas/${encodeURIComponent(email)}`);
        if (!res.ok) {
          console.warn("Falha ao buscar reservas do backend:", res.status);
        } else {
          fetched = await res.json();
        }
      } catch (e) {
        console.warn("Erro na fetch de reservas:", e);
      }

      // 2) Normaliza o formato das reservas para uso no frontend
      reservasCache = (Array.isArray(fetched) ? fetched : []).map(item => ({
        id: item.id || null,
        data: item.data || item.date || "",
        inicio: item.inicio || item.hora || "",
        fim: item.fim || "",
        hora: item.inicio || item.hora || "",
        duracaoMin: item.duracao_minutos ?? item.duracaoMin ?? item.duracao_min ?? 0,
        duracaoHoras: item.duracao_horas ?? item.duracaoHoras ?? 0,
        estacao: item.estacao_name || item.estacao || item.estacao_nome || item.estacao_nome || item.estacao_email || item.estacaoEmail || "",
        estacaoEmail: item.estacao_email || item.estacaoEmail || item.estacao_email || null,
        usuarioEmail: item.usuario_email || item.usuarioEmail || "",
        status: item.status || "pendente",
        __raw: item
      }));

      if (!reservasCache || reservasCache.length === 0) {
        listaDetalhes.innerHTML = "<li>Nenhuma reserva encontrada.</li>";
        return;
      }

      // 3) Garante stations (window.estacoes / localStorage). Se vazio, tenta buscar do backend.
      let stations = (window.estacoes && window.estacoes.length) ? window.estacoes : (JSON.parse(localStorage.getItem("stations") || "[]") || []);
      if ((!stations || stations.length === 0) && typeof API_BASE !== "undefined") {
        try {
          const resp = await fetch(`${API_BASE}/stations`);
          if (resp.ok) {
            const rawStations = await resp.json();
            if (Array.isArray(rawStations)) {
              // opcional: normalizar aqui se quiser, mas assumimos que sua rotina de sincronização usa a mesma normalização
              stations = rawStations.map(e => ({
                nome: e.nome || e.name || e.full_name || "",
                potencia: e.potencia ?? e.power ?? null,
                preco: e.preco ?? e.price ?? null,
                abertura: e.abertura ?? e.open_time ?? e.open ?? "?",
                fechamento: e.fechamento ?? e.close_time ?? e.close ?? "?",
                telefone: e.telefone ?? e.phone ?? "",
                tempoEspera: e.tempoEspera ?? e.wait_time ?? null,
                lat: e.lat ? Number(e.lat) : null,
                lng: e.lng ? Number(e.lng) : null,
                address: e.address ?? e.rua ?? "",
                number: e.number ?? e.numero ?? "",
                district: e.district ?? e.bairro ?? "",
                city: e.city ?? e.cidade ?? "",
                state: e.state ?? e.estado ?? "",
                cep: e.cep ?? e.zip ?? "",
                email: e.email || e.estacaoEmail || e.user_email || e.responsavel_email || e.contato || e.owner_email || (e.user && e.user.email) || null,
                // mantém campos originais como fallback
                raw: e
              }));
              window.estacoes = stations;
              localStorage.setItem("stations", JSON.stringify(stations));
              console.log(`✅ stations sincronizadas (${stations.length}) dentro do renderizarDetalhes`);
            }
          }
        } catch (e) {
          console.warn("Falha ao buscar /stations dentro do renderizarDetalhes:", e);
        }
      }

      const usuarioAtual = localStorage.getItem("usuario");
      const favoritos = JSON.parse(localStorage.getItem(`favoritos_${usuarioAtual}`) || "[]");

      // 4) Itera e renderiza cada reserva
      for (const [idx, r] of reservasCache.entries()) {
        const li = document.createElement("li");
        const linha = document.createElement("div");
        linha.className = "reserva-linha";

        // --- botão/seta de expandir (visível e clicável) ---
        const btnExpandir = document.createElement("button");
        btnExpandir.type = "button";
        btnExpandir.className = "reserva-seta";
        btnExpandir.setAttribute("aria-expanded", "false");
        btnExpandir.innerHTML = "&#9662;"; // ▼

        // nome da estação
        const nome = document.createElement("span");
        nome.className = "reserva-nome";
        nome.textContent = r.estacao || (r.__raw && (r.__raw.estacao || r.__raw.estacao_name)) || "Estação desconhecida";

        // status
        const statusSpan = document.createElement("span");
        statusSpan.className = "reserva-status";
        statusSpan.textContent = r.status || "pendente";

        // botão cancelar
        const btnCancelar = document.createElement("button");
        btnCancelar.className = "btn-cancelar-reserva";
        btnCancelar.textContent = "Cancelar";
        btnCancelar.dataset.index = idx;

        // evita que clicar no botão cancelar também expanda a linha
        btnCancelar.addEventListener("click", (ev) => {
          ev.stopPropagation();
          // fluxo existente de cancelamento (mantém seu comportamento)
          window.reservaIndexParaCancelar = idx;
          console.log("🟢 Clique detectado no botão cancelar:", idx);
          if (confirmarModal) confirmarModal.style.display = "flex";
        });

        // desabilita condicionalmente
        if (r.status && r.status !== "pendente" && r.status !== "confirmada") {
          btnCancelar.disabled = true;
          btnCancelar.textContent = "Indisponível";
        }

        // monta a linha (nome => status => cancelar => seta)
        const acoes = document.createElement("div");
        acoes.className = "reserva-acoes";
        acoes.appendChild(statusSpan);
        acoes.appendChild(btnCancelar);
        acoes.appendChild(btnExpandir); // seta no final

        linha.appendChild(nome);
        linha.appendChild(acoes);

        // 5) Resolve dados da estação (prioriza email -> nome -> payload bruto -> favoritos)
        let estacaoDados = {};
        const raw = r.__raw || {};

        const estacaoEmailDaReserva = r.estacaoEmail || raw.estacao_email || raw.estacaoEmail || null;
        if (estacaoEmailDaReserva && Array.isArray(stations)) {
          estacaoDados = stations.find(s => {
            const sEmail = (s.email || s.estacaoEmail || s.user_email || "").toString().toLowerCase();
            return sEmail && sEmail === estacaoEmailDaReserva.toString().toLowerCase();
          }) || {};
        }

        if (!estacaoDados || Object.keys(estacaoDados).length === 0) {
          const nomeReserva = r.estacao || raw.estacao || raw.estacao_name || "";
          if (nomeReserva) {
            estacaoDados = (Array.isArray(stations) ? stations.find(s => namesEqual(s.nome || s.name || s.full_name, nomeReserva)) : null)
              || favoritos.find(f => namesEqual(f.nome, nomeReserva)) || {};
          }
        }
        estacaoDados = estacaoDados || {};

        // 6) Busca dados do veículo do backend (mantém seu código, só gera html)
        let veiculoHtml = "";
        try {
          const usuarioEmailParaVeiculo = r.usuarioEmail || localStorage.getItem("usuarioEmail");
          if (usuarioEmailParaVeiculo) {
            const resp = await fetch(`${API_BASE}/veiculos/${encodeURIComponent(usuarioEmailParaVeiculo)}`);
            const data = resp.ok ? await resp.json() : null;
            if (data && Object.keys(data).length) {
              const v = data;
              veiculoHtml = `
          <p><strong>Modelo:</strong> ${v.modelo || "N/D"} ${v.ano ? `(${v.ano})` : ""}</p>
          <p><strong>Placa:</strong> ${v.placa || "N/D"}</p>
          <p><strong>Bateria:</strong> ${v.bateria ? v.bateria + " kWh" : "N/D"}</p>
          <p><strong>Carga:</strong> ${v.carregamento ? v.carregamento + " kW" : "N/D"}</p>
        `;
            } else {
              veiculoHtml = `<p><em>Veículo não cadastrado.</em></p>`;
            }
          } else {
            veiculoHtml = `<p><em>Email de usuário não identificado.</em></p>`;
          }
        } catch (err) {
          console.warn("⚠ Falha ao buscar veículo do backend:", err);
          veiculoHtml = `<p><em>Erro ao carregar informações do veículo.</em></p>`;
        }

        // 7) Formata horário/duração (seu código)
        let horarioFormatado = r.hora || r.inicio || "";
        if (r.inicio && r.fim) {
          let dur = horaParaMinutos(r.fim) - horaParaMinutos(r.inicio);
          if (dur < 0) dur += 24 * 60;
          const horas = Math.floor(dur / 60);
          const minutos = dur % 60;
          horarioFormatado = `${r.inicio} - ${r.fim} (${horas}h${minutos ? " " + minutos + "min" : ""})`;
        } else if (r.hora && r.duracaoMin) {
          const inicioMin = horaParaMinutos(r.hora);
          const fimMin = inicioMin + r.duracaoMin;
          const fimHora = minutosParaHora(fimMin);
          const horas = Math.floor(r.duracaoMin / 60);
          const minutos = r.duracaoMin % 60;
          horarioFormatado = `${r.hora} - ${fimHora} (${horas}h${minutos ? " " + minutos + "min" : ""})`;
        }

        // 8) Monta HTML final dos detalhes (inicia oculto)
        const detalhes = document.createElement("div");
        detalhes.className = "detalhes-reserva";
        detalhes.innerHTML = `
    <p><strong>Data:</strong> ${r.data || "--/--/----"}</p>
    <p><strong>Horário:</strong> ${horarioFormatado || "--:--"}</p>
    <p><strong>Status:</strong> ${r.status || "pendente"}</p>
    <p><strong>Endereço:</strong><br>
      ${estacaoDados?.address || estacaoDados?.rua || "N/D"}
      ${estacaoDados?.number || estacaoDados?.numero ? " " + (estacaoDados.number || estacaoDados.numero) : ""}<br>
      ${estacaoDados?.district || estacaoDados?.bairro || "N/D"} - 
      ${estacaoDados?.city || estacaoDados?.cidade || "N/D"} / 
      ${estacaoDados?.state || estacaoDados?.estado || ""}
    </p>
    <p><strong>Telefone da Estação:</strong> ${r.estacao_telefone || estacaoDados?.telefone || "N/D"}</p>
    <p><strong>Potência Máx:</strong> ${(estacaoDados?.potencia ?? estacaoDados?.power)
            ? ((estacaoDados.potencia ?? estacaoDados.power) + " kW")
            : "N/D"}</p>
    <p><strong>Disponibilidade:</strong> ${estacaoDados?.abertura || estacaoDados?.open_time || "?"} - ${estacaoDados?.fechamento || estacaoDados?.close_time || "?"}</p>
    <p><strong>Tempo de Espera:</strong> ${estacaoDados?.tempoEspera ?? estacaoDados?.wait_time
            ? (estacaoDados.tempoEspera ?? estacaoDados.wait_time) + " min"
            : "--"}</p>
    <p><strong>Preço:</strong> ${(estacaoDados?.preco != null)
            ? (estacaoDados.preco + " R$/kWh")
            : (estacaoDados?.price != null ? (Number(estacaoDados.price).toFixed(2) + " R$/kWh") : "--")}</p>
    ${veiculoHtml}
  `;
        detalhes.style.display = "none"; // inicia oculto

        // --- comportamento de expandir/ocultar ---
        function abrirDetalhes() {
          const aberto = detalhes.style.display === "block";
          if (aberto) {
            detalhes.style.display = "none";
            btnExpandir.classList.remove("aberto");
            btnExpandir.setAttribute("aria-expanded", "false");
          } else {
            detalhes.style.display = "block";
            btnExpandir.classList.add("aberto");
            btnExpandir.setAttribute("aria-expanded", "true");
          }
        }

        // clicar na seta/linha abre ou fecha (seta tem prioridade)
        btnExpandir.addEventListener("click", (ev) => {
          ev.stopPropagation();
          abrirDetalhes();
        });

        linha.addEventListener("click", (ev) => {
          // já prevenimos propagação onde necessário; aqui abrimos/fechamos
          abrirDetalhes();
        });

        // adiciona ao DOM
        li.appendChild(linha);
        li.appendChild(detalhes);
        listaDetalhes.appendChild(li);
      }

    } catch (err) {
      console.error("Erro em renderizarDetalhes:", err);
      if (listaDetalhes) listaDetalhes.innerHTML = "<li>Erro ao carregar detalhes.</li>";
    }
  }

  // ============================================================
  // 🔧 Correção: variável global para controle de cancelamento
  // ============================================================
  window.reservaIndexParaCancelar = null;

  // ============================================================
  // Confirmar cancelamento (status → cancelada)
  // ============================================================
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", async () => {
      if (window.reservaIndexParaCancelar !== null) {
        // usa o cache das reservas vindas do backend
        const r = reservasCache[window.reservaIndexParaCancelar];

        if (r) {
          // Atualiza status localmente (cache)
          r.status = "cancelada";

          // Atualiza o status no backend
          try {
            if (r.id) {
              const resposta = await fetch(`${API_BASE}/reservas/${r.id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "cancelada" })
              });

              if (!resposta.ok) {
                const erro = await resposta.json();
                throw new Error(erro.error || "Falha ao atualizar status no backend");
              }

              console.log("✅ Status da reserva atualizado para 'cancelada' no backend!");
            } else {
              console.warn("⚠️ Reserva sem ID — atualização no backend ignorada.");
            }
          } catch (e) {
            console.error("❌ Erro ao atualizar status da reserva:", e);
          }

          // Atualiza também nas reservas globais (libera horário)
          try {
            const keyGlobais = `reservasGlobais_${r.estacao_email || r.estacao}`;
            let reservasGlobais = JSON.parse(localStorage.getItem(keyGlobais) || "[]");
            reservasGlobais = reservasGlobais.map(g => {
              if ((g.data === r.data) && (g.hora === r.hora || g.inicio === r.inicio)) {
                return { ...g, status: "cancelada" };
              }
              return g;
            });
            localStorage.setItem(keyGlobais, JSON.stringify(reservasGlobais));
          } catch (e) {
            console.warn("⚠️ Falha ao atualizar reservas globais:", e);
          }

          // Atualiza também na estação (libera horário)
          try {
            const keyEstacao = `reservasEstacao_${r.estacao_email || r.estacao}`;
            let reservasEstacao = JSON.parse(localStorage.getItem(keyEstacao) || "[]");
            reservasEstacao = reservasEstacao.map(g => {
              if ((g.data === r.data) && (g.hora === r.hora || g.inicio === r.inicio)) {
                return { ...g, status: "cancelada" };
              }
              return g;
            });
            localStorage.setItem(keyEstacao, JSON.stringify(reservasEstacao));
          } catch (e) {
            console.warn("⚠️ Falha ao atualizar reservas da estação:", e);
          }

          // ============================================================
          // Atualiza interface e estado local
          // ============================================================
          if (typeof renderizarReservas === "function") await renderizarReservas();
          if (typeof renderizarDetalhes === "function") await renderizarDetalhes();

          if (typeof atualizarHorarios === "function") {
            atualizarHorarios();
          } //else { setTimeout(() => location.reload(), 300); }
        }

        window.reservaIndexParaCancelar = null;
      }

      if (confirmarModal) confirmarModal.style.display = "none";
    });
  }

  // ============================================================
  // Fechar modal de confirmação
  // ============================================================
  if (btnFechar) {
    btnFechar.addEventListener("click", () => {
      if (confirmarModal) confirmarModal.style.display = "none";
      window.reservaIndexParaCancelar = null;
    });
  }

  // ============================================================
  // Remover reservas canceladas (banco + local) — versão robusta
  // ============================================================
  if (btnRemoverCanceladas) {
    btnRemoverCanceladas.addEventListener("click", async () => {
      const usuarioEmail = localStorage.getItem("usuarioEmail");
      if (!usuarioEmail) {
        console.error("⚠️ Nenhum usuário logado.");
        return;
      }

      // desabilita botão enquanto processa
      btnRemoverCanceladas.disabled = true;

      try {
        // remove no backend
        const resp = await fetch(`${API_BASE}/reservas/limpar-canceladas/${encodeURIComponent(usuarioEmail)}`, {
          method: "DELETE",
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data.error || data.message || "Erro ao remover no backend");

        console.log("🗑️ Canceladas removidas no banco:", data);

        // atualiza o cache local imediatamente filtrando o que já temos (se existir)
        if (Array.isArray(window.reservasCache)) {
          window.reservasCache = window.reservasCache.filter((r) => (r.status || "").toLowerCase() !== "cancelada");
        } else {
          window.reservasCache = [];
        }

        // grava cache no localStorage (opcional)
        localStorage.setItem(
          `reservasUsuario_${usuarioEmail}`,
          JSON.stringify(window.reservasCache || [])
        );

        // força recarregar do backend (usa o parâmetro force = true)
        // adiciona pequeno retry para garantir consistência se o backend demorar
        async function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
        let attempts = 0;
        let backendReservas = [];
        while (attempts < 5) {
          attempts++;
          // chamar com force=true para forçar fetch do servidor
          backendReservas = await carregarReservas(true).catch(() => []);
          // verifica se não há mais reservas com status "cancelada"
          const temCanceladas = (backendReservas || []).some(r => (r.status || "").toLowerCase() === "cancelada");
          if (!temCanceladas) break;
          // espera um pouco e tenta de novo
          await sleep(250);
        }

        // garante que o cache global reflita o backend final
        window.reservasCache = Array.isArray(backendReservas) && backendReservas.length ? backendReservas : (window.reservasCache || []);

        // finalmente re-renderiza as listas
        if (typeof renderizarReservas === "function") await renderizarReservas();
        if (typeof renderizarDetalhes === "function") await renderizarDetalhes();

        if (typeof mostrarMensagem === "function")
          mostrarMensagem("Reservas canceladas removidas com sucesso.", "sucesso");

      } catch (err) {
        console.error("❌ Falha ao remover reservas canceladas:", err);
        if (typeof mostrarMensagem === "function")
          mostrarMensagem("Erro ao remover canceladas.", "erro");
      } finally {
        btnRemoverCanceladas.disabled = false;
      }
    });
  }


  // ============================================================
  // Abrir modal de detalhes
  // ============================================================
  function abrirModal() {
    if (typeof renderizarDetalhes === "function") renderizarDetalhes();
    if (modalDetalhes) modalDetalhes.style.display = "flex";
  }

  if (btnDetalhes) {
    btnDetalhes.addEventListener("click", (e) => {
      e.preventDefault();
      abrirModal();
    });
  }

  if (btnDetalhesMapa) {
    btnDetalhesMapa.addEventListener("click", (e) => {
      e.preventDefault();
      abrirModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (modalDetalhes) modalDetalhes.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modalDetalhes) modalDetalhes.style.display = "none";
  });

});


// ====================================
// Confirmar Nova Reserva (corrigido + telefone)
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  const formAgendamento = document.getElementById("formAgendamento");
  if (!formAgendamento) return;

  formAgendamento.addEventListener("submit", async (e) => {
    e.preventDefault();


    const btnConfirmar = formAgendamento.querySelector('button[type="submit"]');
    if (btnConfirmar) {
      btnConfirmar.disabled = true;
      btnConfirmar.innerText = "Processando...";
    }


    try {
      const data = document.getElementById("dataReserva").value;
      const hora = document.getElementById("horaReserva").value;
      const usuarioAtual = localStorage.getItem("usuario");
      const usuarioEmail = localStorage.getItem("usuarioEmail");
      const estacaoSel = JSON.parse(localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`));

      if (!data || !hora || !estacaoSel) {
        mostrarMensagem?.("❌ Selecione estação, data e horário!", "erro");
        return;
      }

      const stations = JSON.parse(localStorage.getItem("stations")) || [];
      const estacao = stations.find(s => namesEqual(s.nome, estacaoSel.nome))
        || (window.estacoes || []).find(s => namesEqual(s.nome, estacaoSel.nome))
        || estacaoSel;

      const reservas = await carregarReservas?.() || [];
      if (typeof validarDisponibilidade === "function") {
        const resultado = validarDisponibilidade(estacao, data, hora, reservas);
        if (!resultado.disponivel) {
          mostrarMensagem?.("❌ " + resultado.mensagem, "erro");
          return;
        }
      }

      // 🔍 Buscar dados do veículo
      const veiculoRes = await fetch(`${API_BASE}/veiculos/${usuarioEmail}`);
      const veiculo = veiculoRes.ok ? await veiculoRes.json() : null;
      if (!veiculo || !veiculo.modelo || !veiculo.placa) {
        mostrarMensagem?.("❌ Preencha as informações do veículo antes de reservar!", "erro");
        return;
      }

      // ===========================
      // DÉBITO FIXO: R$10,00 (Reserva)
      // ===========================
      const custoReserva = 10.00;

      async function atualizarCarteiraUI() {
        try {
          const res = await fetch(`${API_BASE}/wallet/${usuarioEmail}`);
          const data = await res.json();
          if (!res.ok || !data.wallet) throw new Error();

          const saldoEl = document.getElementById("saldoCarteira");
          const listaTransacoes = document.getElementById("listaTransacoes");

          if (saldoEl) saldoEl.innerText = `R$${Number(data.wallet.balance).toFixed(2)}`;

          if (listaTransacoes) {
            const transacoes = data.transactions || [];
            listaTransacoes.innerHTML = transacoes.length
              ? transacoes
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map(t => `
                  <p class="${Number(t.amount) >= 0 ? 'pos' : 'neg'}">
                    ${Number(t.amount) >= 0 ? '+' : '-'} R$${Math.abs(Number(t.amount)).toFixed(2)} (${t.type})
                  </p>`).join("")
              : "<p>Nenhuma transação ainda.</p>";
          }
        } catch (e) {
          console.warn("⚠ Falha ao atualizar carteira:", e);
        }
      }

      async function debitarReserva(email, valor) {
        try {
          const res = await fetch(`${API_BASE}/wallet/debit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, amount: valor, type: "Reserva" }),
          });
          const data = await res.json();

          if (!res.ok || !data.success) throw new Error(data.message);
          mostrarMensagem?.(`R$${valor.toFixed(2)} debitados da carteira.`, "aviso");
          await atualizarCarteiraUI();
          return true;
        } catch (err) {
          console.error("❌ Erro ao debitar:", err);
          mostrarMensagem?.("❌ Falha ao debitar a reserva. Tente novamente.", "erro");
          return false;
        }
      }

      // 💰 Verifica saldo
      const resSaldo = await fetch(`${API_BASE}/wallet/${usuarioEmail}`);
      const dataSaldo = await resSaldo.json();
      if (!resSaldo.ok || !dataSaldo.wallet) {
        mostrarMensagem?.("❌ Erro ao consultar saldo.", "erro");
        return;
      }

      const saldoAtual = dataSaldo.wallet.balance;
      if (saldoAtual < custoReserva) {
        mostrarMensagem?.("❌ Saldo insuficiente! Recarregue sua carteira.", "erro");
        return;
      }

      const debitoOK = await debitarReserva(usuarioEmail, custoReserva);
      if (!debitoOK) return;
      // 📞 Buscar telefone do usuário
      let telefoneUsuario = null;
      try {
        const respUser = await fetch(`${API_BASE}/users/${encodeURIComponent(usuarioEmail)}`);
        if (respUser.ok) {
          const userData = await respUser.json();
          telefoneUsuario = userData.phone || userData.telefone || null;
        }
      } catch (err) {
        console.warn("⚠️ Erro ao buscar telefone do usuário no backend:", err);
      }

      if (!telefoneUsuario) {
        telefoneUsuario = localStorage.getItem("usuarioTelefone") || null;
      }

      // 🕒 Cálculo horário final
      const durH = parseInt(document.getElementById("duracaoHoras")?.value || 1);
      const durM = parseInt(document.getElementById("duracaoMinutos")?.value || 0);
      function addMinutesToHora(hora, minutes) {
        const [h, m] = hora.split(":").map(Number);
        const total = h * 60 + m + minutes;
        const hh = Math.floor((total / 60) % 24);
        const mm = total % 60;
        return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      }

      const inicio = hora;
      const fim = addMinutesToHora(hora, durH * 60 + durM);

      const estacaoEmail =
        estacao?.email ||
        estacao?.user_email ||
        estacao?.estacaoEmail ||
        estacao?.responsavel_email ||
        estacao?.contato ||
        (stations.find(s => namesEqual(s.nome, estacaoSel.nome))?.email) ||
        null;

      if (!estacaoEmail) {
        mostrarMensagem?.("❌ Esta estação não possui e-mail cadastrado. Contate o suporte.", "erro");
        return;
      }

      // 🛰️ Enviar reserva ao backend
      const payload = {
        usuario_email: usuarioEmail,
        usuario_nome: usuarioAtual,
        usuario_telefone: telefoneUsuario,
        estacao_email: estacaoEmail,
        estacao_nome: estacao?.nome || estacao?.name || estacaoSel?.nome || estacaoSel?.name || "Sem nome",
        estacao_telefone: estacao?.telefone || null,
        data,
        inicio,
        fim,
        duracao_horas: durH,
        duracao_minutos: durM,
        status: "pendente",
        veiculo_modelo: veiculo.modelo,
        veiculo_ano: parseInt(veiculo.ano) || null,
        veiculo_placa: veiculo.placa,
        veiculo_bateria: parseFloat(veiculo.bateria) || null,
        veiculo_carga: parseFloat(veiculo.carregamento) || null,
      };

      console.log("🛰️ Enviando reserva:", payload);

      const resposta = await fetch(`${API_BASE}/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!resposta.ok) throw new Error(await resposta.text());

      mostrarMensagem?.("✅ Reserva criada com sucesso!", "sucesso");
      renderizarReservas?.();

      const agendamentoModal = document.getElementById("agendamentoModal");
      if (agendamentoModal) agendamentoModal.style.display = "none";

    } catch (err) {
      console.error("❌ Erro no submit de agendamento:", err);
      mostrarMensagem?.("❌ Erro ao processar a reserva.", "erro");
    }finally {
    // ✅ Reativar o botão mesmo se der erro
    if (btnConfirmar) {
      btnConfirmar.disabled = false;
      btnConfirmar.innerText = "Confirmar";
    }
  }

  });
});


// ====================================
// Gerar e manter horários permitidos da estação
// ====================================

let horarioAberturaAtual = null;
let horarioFechamentoAtual = null;
let observadorHorarioAtivo = null;
let filtrandoHorarios = false;
let ultimoHorarioSelecionadoValido = "";

function normalizarHoraSelect(hora) {
  if (!hora) return null;

  const texto = String(hora).trim();
  const match = texto.match(/^(\d{1,2}):(\d{2})/);

  if (!match) return null;

  const h = String(Number(match[1])).padStart(2, "0");
  const m = match[2];

  return `${h}:${m}`;
}

function horaParaMinutosSelect(hora) {
  const normalizada = normalizarHoraSelect(hora);
  if (!normalizada) return null;

  const [h, m] = normalizada.split(":").map(Number);
  return h * 60 + m;
}

function minutosParaHoraSelect(minutosTotais) {
  const horas = Math.floor(minutosTotais / 60);
  const minutos = minutosTotais % 60;

  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

function criarPlaceholderHorario(selectHora) {
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Selecione um horário";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.hidden = true;

  selectHora.appendChild(placeholder);
}

function horarioEstaDentroDoFuncionamento(hora) {
  const minutos = horaParaMinutosSelect(hora);

  if (
    minutos === null ||
    horarioAberturaAtual === null ||
    horarioFechamentoAtual === null
  ) {
    return false;
  }

  return minutos >= horarioAberturaAtual && minutos < horarioFechamentoAtual;
}

function filtrarHorariosForaDoFuncionamento() {
  const selectHora = document.getElementById("horaReserva");
  if (!selectHora || filtrandoHorarios) return;

  filtrandoHorarios = true;

  const valorAtual = selectHora.value;
  const valorDesejado = valorAtual || ultimoHorarioSelecionadoValido;

  const opcoes = Array.from(selectHora.options);

  opcoes.forEach(option => {
    if (option.value === "") return;

    if (!horarioEstaDentroDoFuncionamento(option.value)) {
      option.remove();
    }
  });

  const existePlaceholder = Array.from(selectHora.options).some(
    option => option.value === ""
  );

  if (!existePlaceholder) {
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Selecione um horário";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.hidden = true;

    selectHora.insertBefore(placeholder, selectHora.firstChild);
  }

  const valorNormalizado = normalizarHoraSelect(valorDesejado);

  const valorAindaExiste =
    valorNormalizado &&
    Array.from(selectHora.options).some(option => option.value === valorNormalizado);

  if (valorAindaExiste && horarioEstaDentroDoFuncionamento(valorNormalizado)) {
    selectHora.value = valorNormalizado;
    ultimoHorarioSelecionadoValido = valorNormalizado;
  } else {
    selectHora.value = "";
  }

  filtrandoHorarios = false;
}

function ativarProtecaoDoSelectHorario() {
  const selectHora = document.getElementById("horaReserva");
  if (!selectHora) return;

  if (observadorHorarioAtivo) {
    observadorHorarioAtivo.disconnect();
  }

  observadorHorarioAtivo = new MutationObserver(() => {
    filtrarHorariosForaDoFuncionamento();
  });

  observadorHorarioAtivo.observe(selectHora, {
    childList: true,
    subtree: true
  });
}

function preencherHorariosPermitidos(openTime, closeTime, horarioParaManter = null) {
  const selectHora = document.getElementById("horaReserva");

  if (!selectHora) {
    console.warn("Select horaReserva não encontrado.");
    return;
  }

  const horarioDesejado =
    horarioParaManter ||
    ultimoHorarioSelecionadoValido ||
    selectHora.value ||
    "";

  horarioAberturaAtual = horaParaMinutosSelect(openTime);
  horarioFechamentoAtual = horaParaMinutosSelect(closeTime);

  console.log("Horários da estação:", {
    openTime,
    closeTime,
    abertura: horarioAberturaAtual,
    fechamento: horarioFechamentoAtual,
    horarioDesejado
  });

  selectHora.innerHTML = "";
  criarPlaceholderHorario(selectHora);

  if (
    horarioAberturaAtual === null ||
    horarioFechamentoAtual === null ||
    horarioAberturaAtual >= horarioFechamentoAtual
  ) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Horários indisponíveis";
    option.disabled = true;
    selectHora.appendChild(option);
    return;
  }

  const intervalo = 30;

  for (
    let minutos = horarioAberturaAtual;
    minutos < horarioFechamentoAtual;
    minutos += intervalo
  ) {
    const horaFormatada = minutosParaHoraSelect(minutos);

    const option = document.createElement("option");
    option.value = horaFormatada;
    option.textContent = horaFormatada;

    selectHora.appendChild(option);
  }

  const horarioNormalizado = normalizarHoraSelect(horarioDesejado);

  const horarioExiste =
    horarioNormalizado &&
    Array.from(selectHora.options).some(option => option.value === horarioNormalizado);

  if (horarioExiste && horarioEstaDentroDoFuncionamento(horarioNormalizado)) {
    selectHora.value = horarioNormalizado;
    ultimoHorarioSelecionadoValido = horarioNormalizado;
  } else {
    selectHora.value = "";
  }

  ativarProtecaoDoSelectHorario();
}

// deixa acessível para o mapa.js
window.preencherHorariosPermitidos = preencherHorariosPermitidos;

function obterHorariosDaEstacaoSelecionada() {
  const usuarioAtual = localStorage.getItem("usuario");

  const estacaoSel = JSON.parse(
    localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`) || "null"
  );

  if (!estacaoSel) return null;

  const stations = JSON.parse(localStorage.getItem("stations")) || [];

  const estacao =
    stations.find(s => namesEqual(s.nome, estacaoSel.nome)) ||
    (window.estacoes || []).find(s => namesEqual(s.nome, estacaoSel.nome)) ||
    estacaoSel;

  const abertura =
    estacao.open_time ||
    estacao.openTime ||
    estacao.open ||
    estacao.abertura ||
    estacao.horarioAbertura;

  const fechamento =
    estacao.close_time ||
    estacao.closeTime ||
    estacao.close ||
    estacao.fechamento ||
    estacao.horarioFechamento;

  return { abertura, fechamento };
}

function reaplicarHorariosDaEstacaoSelecionada(horarioParaManter = null) {
  const horarios = obterHorariosDaEstacaoSelecionada();

  if (!horarios) {
    console.warn("Nenhuma estação selecionada para preencher horários.");
    return;
  }

  preencherHorariosPermitidos(
    horarios.abertura,
    horarios.fechamento,
    horarioParaManter
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const dataReserva = document.getElementById("dataReserva");
  const selectHora = document.getElementById("horaReserva");

  if (selectHora) {
    selectHora.addEventListener("change", () => {
      if (
        selectHora.value &&
        horarioEstaDentroDoFuncionamento(selectHora.value)
      ) {
        ultimoHorarioSelecionadoValido = selectHora.value;
      }
    });
  }

  if (!dataReserva) return;

  dataReserva.addEventListener("change", () => {
    const horarioAntesDaData =
      document.getElementById("horaReserva")?.value ||
      ultimoHorarioSelecionadoValido ||
      "";

    if (horarioAntesDaData) {
      ultimoHorarioSelecionadoValido = horarioAntesDaData;
    }

    reaplicarHorariosDaEstacaoSelecionada(horarioAntesDaData);

    setTimeout(() => {
      reaplicarHorariosDaEstacaoSelecionada(horarioAntesDaData);
      filtrarHorariosForaDoFuncionamento();
    }, 100);

    setTimeout(() => {
      reaplicarHorariosDaEstacaoSelecionada(horarioAntesDaData);
      filtrarHorariosForaDoFuncionamento();
    }, 500);

    setTimeout(() => {
      reaplicarHorariosDaEstacaoSelecionada(horarioAntesDaData);
      filtrarHorariosForaDoFuncionamento();
    }, 1000);
  });
});
// ===================================
// Inicialização Automática
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  try {
    atualizarEstacao();
    renderizarReservas();
  } catch (err) {
    console.error("Erro inicializando reservas:", err);
  }
});