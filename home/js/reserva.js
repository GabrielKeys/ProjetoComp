// ====================================
// Atualizar estatísticas da estação
// ====================================
function atualizarEstacao() {
  const usuarioAtual = localStorage.getItem("usuario");
  const estacao = JSON.parse(localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`));

  const statPotencia = document.getElementById("statPotencia");
  const statEspera = document.getElementById("statEspera");
  const statDisponibilidade = document.getElementById("statDisponibilidade");
  const stationMsg = document.getElementById("stationMsg");
  const btnAgendar = document.getElementById("btnAgendar");

  if (estacao) {
    if (statPotencia) statPotencia.textContent = estacao.potencia || "--";
    if (statEspera) statEspera.textContent = estacao.tempoEspera || "--";
    if (statDisponibilidade) statDisponibilidade.textContent = `${estacao.abertura} - ${estacao.fechamento}`;
    if (stationMsg) stationMsg.textContent = `Estação selecionada: ${estacao.nome}`;
    if (btnAgendar) btnAgendar.disabled = false;
  } else {
    if (statPotencia) statPotencia.textContent = "--";
    if (statEspera) statEspera.textContent = "--";
    if (statDisponibilidade) statDisponibilidade.textContent = "--";
    if (stationMsg) stationMsg.textContent = "Nenhuma estação de recarga selecionada.";
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

  if (listaEstacoes) {
    listaEstacoes.innerHTML = "";
    const chaveFavoritos = `favoritos_${usuarioAtual}`;
    let favoritos = JSON.parse(localStorage.getItem(chaveFavoritos)) || [];

    if (favoritos.length === 0) {
      listaEstacoes.innerHTML = "<li>Nenhuma estação favoritada ainda.</li>";
    } else {
      favoritos.forEach((estacao, index) => {
        const li = document.createElement("li");
        li.textContent = estacao.nome;

        // Selecionar estação
        li.addEventListener("click", () => {
          localStorage.setItem(`estacaoSelecionada_${usuarioAtual}`, JSON.stringify(estacao));
          if (modal) modal.style.display = "none";
          atualizarEstacao();
        });

        // Botão remover
        const btnRemover = document.createElement("button");
        btnRemover.textContent = "❌";
        btnRemover.title = "Remover dos favoritos";
        btnRemover.classList.add("btn-remover-estacao");

        btnRemover.addEventListener("click", (e) => {
          e.stopPropagation(); // impede selecionar estação
          favoritos.splice(index, 1);
          localStorage.setItem(chaveFavoritos, JSON.stringify(favoritos));
          li.remove();
          mostrarMensagem(`❌ ${estacao.nome} removida dos favoritos.`, "erro");

          const selecionada = JSON.parse(localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`));
          if (selecionada && selecionada.nome === estacao.nome) {
            localStorage.removeItem(`estacaoSelecionada_${usuarioAtual}`);
          }
          atualizarEstacao();

          if (favoritos.length === 0) {
            listaEstacoes.innerHTML = "<li>Nenhuma estação favoritada ainda.</li>";
          }
        });

        li.appendChild(btnRemover);
        listaEstacoes.appendChild(li);
      });
    }
  }

  if (btnSelecionar) {
    btnSelecionar.addEventListener("click", () => {
      if (modal) modal.style.display = "flex";
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (modal) modal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
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

  // Home
  const textoReserva = document.getElementById("textoReserva");
  const lista = document.getElementById("listaReservas");

  // Mapa
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

  // Botão de detalhes (home e mapa)
  const btnDetalhes = document.getElementById("btnDetalhesReserva");
  const btnDetalhesMapa = document.getElementById("btnDetalhesReservaMapa");

  if (btnDetalhes) btnDetalhes.style.display = "inline-block";
  if (btnDetalhesMapa) btnDetalhesMapa.style.display = "inline-block";
}

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
    const estacao = JSON.parse(localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`));

    if (!data || !hora || !estacao) {
      mostrarMensagem("❌ Selecione estação, data e horário!", "erro");
      return;
    }

    const reservas = carregarReservas();

    // ✅ validar disponibilidade antes de salvar
    const resultado = validarDisponibilidade(estacao, data, hora, reservas);
    if (!resultado.disponivel) {
      mostrarMensagem("❌ " + resultado.mensagem, "erro");
      return;
    }

    reservas.push({ estacao: estacao.nome, data, hora });
    salvarReservas(reservas);
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
