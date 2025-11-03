// ====================================
// reserva.js (usuário)
// ====================================
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
      if (agendamentoModal) agendamentoModal.style.display = "flex";
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
// Funções de Reservas
// ====================================
function carregarReservas() {
  const usuario = localStorage.getItem("usuario");
  return JSON.parse(localStorage.getItem(`reservas_${usuario}`)) || [];
}
function salvarReservas(reservas) {
  const usuario = localStorage.getItem("usuario");
  localStorage.setItem(`reservas_${usuario}`, JSON.stringify(reservas));
}

// ====================================
// Validação de dados do veículo (via banco)
// ====================================
async function dadosVeiculoPreenchidos(usuarioEmail) {
  if (!usuarioEmail) return false;

  try {
    const resp = await fetch(`http://localhost:4000/veiculos/${usuarioEmail}`);
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

function renderizarReservas() {
  const reservas = carregarReservas();
  const textoReserva = document.getElementById("textoReserva");
  const lista = document.getElementById("listaReservas");
  const textoReservaMapa = document.getElementById("textoReservaMapa");
  const listaMapa = document.getElementById("listaReservasMapa");

  if (reservas.length === 0) {
    if (textoReserva) textoReserva.textContent = "Nenhuma reserva agendada.";
    if (lista) lista.innerHTML = "";
    if (textoReservaMapa) textoReservaMapa.textContent = "Nenhuma reserva agendada.";
    if (listaMapa) listaMapa.innerHTML = "";
    return;
  }

  const primeira = reservas[0];
  const reservaHtml = `
    <strong>Próxima Reserva</strong>
    <p>Estação: ${primeira.estacao}</p>
    <p>Data: ${primeira.data}</p>
    <p>Horário: ${primeira.hora}</p>
  `;

  if (textoReserva) textoReserva.innerHTML = reservaHtml;
  if (textoReservaMapa) textoReservaMapa.innerHTML = reservaHtml;

  if (lista) {
    lista.innerHTML = "";
    reservas.slice(1).forEach(r => {
      const div = document.createElement("div");
      div.classList.add("reserva-item");
      div.innerHTML = `<p><strong>${r.estacao}</strong> - ${r.data} ${r.hora}</p>`;
      lista.appendChild(div);
    });
  }

  if (listaMapa) {
    listaMapa.innerHTML = "";
    reservas.slice(1).forEach(r => {
      const div = document.createElement("div");
      div.classList.add("reserva-item");
      div.innerHTML = `<p><strong>${r.estacao}</strong> - ${r.data} ${r.hora}</p>`;
      listaMapa.appendChild(div);
    });
  }

  const btnDetalhes = document.getElementById("btnDetalhesReserva");
  const btnDetalhesMapa = document.getElementById("btnDetalhesReservaMapa");
  if (btnDetalhes) btnDetalhes.style.display = "inline-block";
  if (btnDetalhesMapa) btnDetalhesMapa.style.display = "inline-block";
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

  let reservaIndexParaCancelar = null;

  // Atualiza status tanto no usuário quanto na estação 
  const atualizarStatus = typeof atualizarStatusReservaEstacao === "function"
    ? atualizarStatusReservaEstacao
    : atualizarStatusReserva; // compatibilidade com código antigo

  // Função que atualiza no usuário e na estação
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

  // utilitário robusto para recuperar dados do veículo
  function getVeiculoForReservation(r) {
    // 1) se já vier na própria reserva, usa direto
    if (r && r.veiculo && typeof r.veiculo === "object") return r.veiculo;

    // 2) tenta vários ids possíveis (prioriza campos da reserva, depois o usuário logado)
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
  // Renderiza detalhes das reservas
  // ================================
  async function renderizarDetalhes() {
    try {
      const reservas = carregarReservas();
      const usuarioAtual = localStorage.getItem("usuario");
      if (!listaDetalhes) return;
      listaDetalhes.innerHTML = "";

      if (reservas.length === 0) {
        listaDetalhes.innerHTML = "<li>Nenhuma reserva encontrada.</li>";
        return;
      }

      const stations = JSON.parse(localStorage.getItem("stations")) || [];
      const favoritos = JSON.parse(localStorage.getItem(`favoritos_${usuarioAtual}`)) || [];

      for (const [idx, r] of reservas.entries()) {
        const li = document.createElement("li");
        const linha = document.createElement("div");
        linha.className = "reserva-linha";

        const nome = document.createElement("span");
        nome.className = "reserva-nome";
        nome.textContent = r.estacao;

        const statusSpan = document.createElement("span");
        statusSpan.className = "reserva-status";
        statusSpan.textContent = r.status ? r.status : "pendente";

        const btnCancelar = document.createElement("button");
        btnCancelar.className = "btn-cancelar-reserva";
        btnCancelar.textContent = "Cancelar";
        btnCancelar.dataset.index = idx;

        // Desativa botão se já estiver cancelada/finalizada
        if (r.status && r.status !== "pendente" && r.status !== "confirmada") {
          btnCancelar.disabled = true;
          btnCancelar.textContent = "Indisponível";
        } else {
          btnCancelar.addEventListener("click", () => {
            reservaIndexParaCancelar = idx;
            if (confirmarModal) confirmarModal.style.display = "flex";
          });
        }

        linha.appendChild(nome);
        linha.appendChild(statusSpan);
        linha.appendChild(btnCancelar);

        // 🔹 Busca dados da estação
        let estacaoDados =
          stations.find(e => namesEqual(e.nome, r.estacao)) ||
          favoritos.find(e => namesEqual(e.nome, r.estacao)) ||
          (window.estacoes || []).find(e => namesEqual(e.nome, r.estacao)) ||
          {};

        // 🔹 Busca dados do veículo do backend
        let veiculoHtml = "";
        try {
          const usuarioEmail = r.usuarioEmail || localStorage.getItem("usuarioEmail");
          if (usuarioEmail) {
            const resp = await fetch(`${API_BASE}/veiculos/${usuarioEmail}`);
            const data = await resp.json();

            console.log("🚗 Dados retornados do backend:", data);

            if (data && Object.keys(data).length) {
              const v = data;
              veiculoHtml = `
              <p><strong>Usuário:</strong> ${usuarioEmail}</p>
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

        // 🔹 Monta detalhes da reserva
        const detalhes = document.createElement("div");
        detalhes.className = "detalhes-reserva";

        // Duração e horário formatado
        let horarioFormatado = r.hora;

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


        detalhes.innerHTML = `
        <p><strong>Data:</strong> ${r.data}</p>
        <p><strong>Horário:</strong> ${horarioFormatado}</p>
        <p><strong>Status:</strong> ${r.status || "pendente"}</p>
        <p><strong>Endereço:</strong> 
        ${estacaoDados?.address || estacaoDados?.rua || "N/D"} 
        ${estacaoDados?.number || estacaoDados?.numero || ""} 
        ${estacaoDados?.district || estacaoDados?.bairro || "N/D"} - 
        ${estacaoDados?.city || estacaoDados?.cidade || "N/D"} / 
        ${estacaoDados?.state || estacaoDados?.estado || ""}</p>
        <p><strong>Potência Máx:</strong> ${estacaoDados?.potencia ? estacaoDados.potencia + " kW" : "N/D"}</p>
        <p><strong>Disponibilidade:</strong> ${estacaoDados?.abertura || "?"} - ${estacaoDados?.fechamento || "?"}</p>
        <p><strong>Tempo de Espera:</strong> ${estacaoDados?.tempoEspera ? estacaoDados.tempoEspera + " min" : "--"}</p>
        <p><strong>Preço:</strong> ${estacaoDados?.preco ? estacaoDados.preco + " R$/kWh" : "--"}</p>
        ${veiculoHtml}
      `;

        li.appendChild(linha);
        li.appendChild(detalhes);
        listaDetalhes.appendChild(li);
      }
    } catch (err) {
      console.error("Erro em renderizarDetalhes:", err);
      if (listaDetalhes) listaDetalhes.innerHTML = "<li>Erro ao carregar detalhes.</li>";
    }
  }


  // Confirmar cancelamento (status → cancelada)
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", async () => {
      if (reservaIndexParaCancelar !== null) {
        const reservas = carregarReservas();
        const r = reservas[reservaIndexParaCancelar];

        if (r) {
          r.status = "cancelada";
          salvarReservas(reservas);

          // Atualiza também nas reservas globais para liberar o horário
          try {
            const keyGlobais = `reservasGlobais_${r.estacaoEmail || r.estacao}`;
            let reservasGlobais = JSON.parse(localStorage.getItem(keyGlobais) || "[]");
            reservasGlobais = reservasGlobais.map(g => {
              if (g.data === r.data && g.hora === r.hora) {
                return { ...g, status: "cancelada" };
              }
              return g;
            });
            localStorage.setItem(keyGlobais, JSON.stringify(reservasGlobais));
          } catch (e) {
            console.warn("Falha ao atualizar reservas globais", e);
          }

          // Atualiza também na estação para liberar o horário
          try {
            const keyEstacao = `reservasEstacao_${r.estacaoEmail || r.estacao}`;
            let reservasEstacao = JSON.parse(localStorage.getItem(keyEstacao) || "[]");
            reservasEstacao = reservasEstacao.map(g => {
              if (g.data === r.data && g.hora === r.hora) {
                return { ...g, status: "cancelada" };
              }
              return g;
            });
            localStorage.setItem(keyEstacao, JSON.stringify(reservasEstacao));
          } catch (e) {
            console.warn("Falha ao atualizar reservas da estação", e);
          }

          // 💰 REEMBOLSO FIXO DE R$10 (via backend)
          try {
            const usuarioEmail = localStorage.getItem("usuarioEmail");
            if (!usuarioEmail) throw new Error("Usuário não autenticado.");

            // Chama o backend para processar o reembolso
            const resposta = await fetch("http://localhost:4000/wallet/refund", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: usuarioEmail,
                amount: 10,
                description: "Reembolso automático por cancelamento"
              }),
            });

            const data = await resposta.json();

            if (!resposta.ok) throw new Error(data.error || "Falha no reembolso");
            console.log("💰 Reembolso de R$10 aplicado com sucesso:", data);

            // Atualiza carteira em tempo real
            window.dispatchEvent(new Event("carteiraAtualizada"));
          } catch (e) {
            console.error("Falha ao processar reembolso:", e);
          }

          // Re-renderiza as telas
          renderizarReservas();
          renderizarDetalhes();

          if (typeof atualizarHorarios === "function") {
            atualizarHorarios();
          } else {
            setTimeout(() => location.reload(), 300);
          }
        }

        reservaIndexParaCancelar = null;
      }

      if (confirmarModal) confirmarModal.style.display = "none";
    });
  }


  // Fechar modal de confirmação
  if (btnFechar) {
    btnFechar.addEventListener("click", () => {
      if (confirmarModal) confirmarModal.style.display = "none";
      reservaIndexParaCancelar = null;
    });
  }

  // Remover apenas as reservas canceladas
  if (btnRemoverCanceladas) {
    btnRemoverCanceladas.addEventListener("click", () => {
      let reservas = carregarReservas();
      reservas = reservas.filter(r => r.status !== "cancelada");
      salvarReservas(reservas);
      renderizarReservas();
      renderizarDetalhes();
      if (typeof mostrarMensagem === "function") mostrarMensagem("Reservas canceladas removidas.", "sucesso");
    });
  }

  function abrirModal() {
    renderizarDetalhes();
    if (modalDetalhes) modalDetalhes.style.display = "flex";
  }

  if (btnDetalhes) btnDetalhes.addEventListener("click", abrirModal);
  if (btnDetalhesMapa) btnDetalhesMapa.addEventListener("click", abrirModal);

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (modalDetalhes) modalDetalhes.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modalDetalhes) modalDetalhes.style.display = "none";
    if (e.target === confirmarModal) confirmarModal.style.display = "none";
  });
});

// ====================================
// Confirmar Nova Reserva (corrigido)
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  const formAgendamento = document.getElementById("formAgendamento");
  if (!formAgendamento) return;

  formAgendamento.addEventListener("submit", async (e) => {
    e.preventDefault();

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

      // Carrega estações do localStorage ou do global
      const stations = JSON.parse(localStorage.getItem("stations")) || [];
      const estacao = stations.find(s => namesEqual(s.nome, estacaoSel.nome))
        || (window.estacoes || []).find(s => namesEqual(s.nome, estacaoSel.nome))
        || estacaoSel;

      // Busca reservas existentes para validação
      const reservas = carregarReservas?.() || [];

      if (typeof validarDisponibilidade === "function") {
        const resultado = validarDisponibilidade(estacao, data, hora, reservas);
        if (!resultado.disponivel) {
          mostrarMensagem?.("❌ " + resultado.mensagem, "erro");
          return;
        }
      }

      // 🔍 Buscar dados do veículo direto do backend
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

      // ☎️ Capturar telefone
      let telefoneUsuario = "";
      try {
        const users = JSON.parse(localStorage.getItem("users")) || [];
        const dadosUser = users.find(u => (u.email || "").toLowerCase() === usuarioEmail.toLowerCase());
        telefoneUsuario = dadosUser?.phone || localStorage.getItem("usuarioTelefone") || "";
      } catch (e) {
        console.warn("Telefone não encontrado.");
      }

      // 🕒 Cálculo horário fim
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

      console.log("🧩 Estação selecionada:", estacao);

      const estacaoEmail =
        estacao?.email ||
        estacao?.user_email ||
        estacao?.estacaoEmail ||
        estacao?.responsavel_email ||
        estacao?.contato ||
        (stations.find(s => namesEqual(s.nome, estacaoSel.nome))?.email) ||
        null;

      if (!estacaoEmail) {
        console.warn("⚠️ Nenhum e-mail encontrado na estação:", estacao);
        mostrarMensagem?.("❌ Esta estação não possui e-mail cadastrado. Contate o suporte.", "erro");
        return;
      }

      // 🚀 Envia reserva ao backend
      console.log("🛰️ Enviando reserva:", {
        usuario_email: usuarioEmail,
        estacao_email: estacaoEmail,
        veiculo
      });

      const resposta = await fetch(`${API_BASE}/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_email: usuarioEmail,
          estacao_email: estacaoEmail,
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
          telefone: telefoneUsuario || null
        })
      });

      if (!resposta.ok) throw new Error("Erro ao salvar reserva no backend.");

      mostrarMensagem?.("✅ Reserva criada com sucesso!", "sucesso");
      renderizarReservas?.();

      const agendamentoModal = document.getElementById("agendamentoModal");
      if (agendamentoModal) agendamentoModal.style.display = "none";

    } catch (err) {
      console.error("❌ Erro no submit de agendamento:", err);
      mostrarMensagem?.("❌ Erro ao processar a reserva.", "erro");
    }
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
