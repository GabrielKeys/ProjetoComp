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

  // Renderiza lista (mostra favoritos, mas resolve dados completos via stations / estacoes)
  function renderizarLista() {
    if (!listaEstacoes) return;
    listaEstacoes.innerHTML = "";

    favoritos = carregarFavoritos();
    favoritosVisuais = favoritos.map(() => true);

    if (favoritos.length === 0) {
      listaEstacoes.innerHTML = "<li>Nenhuma estação favoritada ainda.</li>";
      return;
    }

    // pega stations salvas (registradas)
    const stations = JSON.parse(localStorage.getItem("stations")) || [];

    favoritos.forEach((fav, idx) => {
      // 🔹 resolve objeto completo: primeiro stations, depois window.estacoes, enfim use fav
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

      // Estrela (visual) - mantém a lógica anterior de favoritosVisuais
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
          mostrarMensagem(`${estacaoCompleta.nome} adicionada aos favoritos!`, "sucesso", true);
        } else {
          mostrarMensagem(`${estacaoCompleta.nome} removida dos favoritos.`, "erro", true);
        }
      });

      // Botão Selecionar -> salva a estacao completa
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

      // Detalhes sempre visíveis (usando estacaoCompleta)
      const detalhes = document.createElement("div");
      detalhes.className = "detalhes-estacao ativo";
      detalhes.innerHTML = `
        <p><strong>Endereço:</strong> ${estacaoCompleta.rua || "N/D"} ${estacaoCompleta.numero || ""}</p>
        <p><strong>Cidade:</strong> ${estacaoCompleta.cidade || "N/D"} - ${estacaoCompleta.estado || ""}</p>
        <p><strong>Potência Máx:</strong> ${estacaoCompleta.potencia ? (estacaoCompleta.potencia + " kW") : "N/D"}</p>
        <p><strong>Disponibilidade:</strong> ${estacaoCompleta.abertura || "?"} - ${estacaoCompleta.fechamento || "?"}</p>

      <!-- Extras -->
        <p><strong>Tempo de Espera:</strong> ${estacaoCompleta.tempoEspera ? (estacaoCompleta.tempoEspera + " min") : "--"}</p>
        <p><strong>Preço:</strong> ${estacaoCompleta.preco ? (estacaoCompleta.preco + " R$/kWh") : "--"}</p>
      `;

      li.appendChild(linha);
      li.appendChild(detalhes);

      listaEstacoes.appendChild(li);
    });
  }

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

  // 🔹 Atualiza status tanto no usuário quanto na estação
  function atualizarStatusReserva(estacaoEmail, usuarioEmail, data, hora, status) {
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

  function renderizarDetalhes() {
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

    reservas.forEach((r, idx) => {
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

      btnCancelar.addEventListener("click", () => {
        reservaIndexParaCancelar = idx;
        confirmarModal.style.display = "flex";
      });

      linha.appendChild(nome);
      linha.appendChild(statusSpan);
      linha.appendChild(btnCancelar);

      // 🔹 Busca dados completos
      let estacaoDados = stations.find(e => namesEqual(e.nome, r.estacao))
        || favoritos.find(e => namesEqual(e.nome, r.estacao))
        || (window.estacoes || []).find(e => namesEqual(e.nome, r.estacao))
        || {};

      const detalhes = document.createElement("div");
      detalhes.className = "detalhes-reserva";
      detalhes.innerHTML = `
        <p><strong>Data:</strong> ${r.data}</p>
        <p><strong>Horário:</strong> ${r.hora}</p>
        <p><strong>Status:</strong> ${r.status || "pendente"}</p>
        <p><strong>Endereço:</strong> ${estacaoDados?.rua || "N/D"} ${estacaoDados?.numero || ""}</p>
        <p><strong>Cidade:</strong> ${estacaoDados?.cidade || "N/D"} - ${estacaoDados?.estado || ""}</p>
        <p><strong>Potência Máx:</strong> ${estacaoDados?.potencia ? (estacaoDados.potencia + " kW") : "N/D"}</p>
        <p><strong>Disponibilidade:</strong> ${estacaoDados?.abertura || "?"} - ${estacaoDados?.fechamento || "?"}</p>
        <p><strong>Tempo de Espera:</strong> ${estacaoDados?.tempoEspera ? (estacaoDados.tempoEspera + " min") : "--"}</p>
        <p><strong>Preço:</strong> ${estacaoDados?.preco ? (estacaoDados.preco + " R$/kWh") : "--"}</p>
      `;

      li.appendChild(linha);
      li.appendChild(detalhes);

      listaDetalhes.appendChild(li);
    });
  }

  // Confirmar cancelamento (status → cancelada)
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", () => {
      if (reservaIndexParaCancelar !== null) {
        const reservas = carregarReservas();
        const r = reservas[reservaIndexParaCancelar];

        if (r) {
          r.status = "cancelada";
          salvarReservas(reservas);

          atualizarStatusReserva(r.estacaoEmail, r.usuario, r.data, r.hora, "cancelada");

          renderizarReservas();
          renderizarDetalhes();
          mostrarMensagem("❌ Reserva cancelada.", "erro");
        }
        reservaIndexParaCancelar = null;
      }
      confirmarModal.style.display = "none";
    });
  }

  // Fechar modal de confirmação
  if (btnFechar) {
    btnFechar.addEventListener("click", () => {
      confirmarModal.style.display = "none";
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
      mostrarMensagem("🗑️ Reservas canceladas removidas.", "sucesso");
    });
  }

  function abrirModal() {
    renderizarDetalhes();
    modalDetalhes.style.display = "flex";
  }

  if (btnDetalhes) btnDetalhes.addEventListener("click", abrirModal);
  if (btnDetalhesMapa) btnDetalhesMapa.addEventListener("click", abrirModal);

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modalDetalhes.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modalDetalhes) modalDetalhes.style.display = "none";
    if (e.target === confirmarModal) confirmarModal.style.display = "none";
  });
});

// ====================================
// Confirmar Nova Reserva
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  const formAgendamento = document.getElementById("formAgendamento");
  if (!formAgendamento) return;

  formAgendamento.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = document.getElementById("dataReserva").value;
    const hora = document.getElementById("horaReserva").value;
    const usuarioAtual = localStorage.getItem("usuario");
    const estacaoSel = JSON.parse(localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`));

    if (!data || !hora || !estacaoSel) {
      mostrarMensagem("❌ Selecione estação, data e horário!", "erro");
      return;
    }

    const stations = JSON.parse(localStorage.getItem("stations")) || [];
    const estacao = stations.find(s => namesEqual(s.nome, estacaoSel.nome))
      || (window.estacoes || []).find(s => namesEqual(s.nome, estacaoSel.nome))
      || estacaoSel;

    const reservas = carregarReservas();
    const resultado = validarDisponibilidade(estacao, data, hora, reservas);
    if (!resultado.disponivel) {
      mostrarMensagem("❌ " + resultado.mensagem, "erro");
      return;
    }

    // Salva no perfil do usuário
    reservas.push({
      estacao: estacao.nome,
      estacaoEmail: estacao.email,
      data,
      hora,
      status: "pendente"
    });
    salvarReservas(reservas);

    // Salva também na estação
    let reservasEstacao = JSON.parse(localStorage.getItem(`reservasEstacao_${estacao.email}`)) || [];
    reservasEstacao.push({
      usuarioEmail: usuarioAtual,
      data,
      hora,
      status: "pendente"
    });
    localStorage.setItem(`reservasEstacao_${estacao.email}`, JSON.stringify(reservasEstacao));

    renderizarReservas();

    const agendamentoModal = document.getElementById("agendamentoModal");
    if (agendamentoModal) agendamentoModal.style.display = "none";

    mostrarMensagem("✅ Reserva realizada com sucesso!", "sucesso");
  });
});

// ====================================
// Inicialização Automática
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  atualizarEstacao();
  renderizarReservas();
});
