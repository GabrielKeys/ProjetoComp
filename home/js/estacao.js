// ---- Atualizar estatísticas da estação ----
function atualizarEstacao() {
  const usuarioAtual = localStorage.getItem("usuario");
  const estacao = JSON.parse(localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`));

  const statPotencia = document.getElementById("statPotencia");
  const statEspera = document.getElementById("statEspera");
  const statDisponibilidade = document.getElementById("statDisponibilidade");
  const stationMsg = document.getElementById("stationMsg");
  const btnAgendar = document.getElementById("btnAgendar");

  if (estacao) {
    statPotencia.textContent = estacao.potencia || "--";
    statEspera.textContent = estacao.tempoEspera || "--";
    statDisponibilidade.textContent = estacao.disponibilidade || "--";
    stationMsg.textContent = `Estação selecionada: ${estacao.nome}`;
    if (btnAgendar) btnAgendar.disabled = false;
  } else {
    statPotencia.textContent = "--";
    statEspera.textContent = "--";
    statDisponibilidade.textContent = "--";
    stationMsg.textContent = "Nenhuma estação de recarga selecionada.";
    if (btnAgendar) btnAgendar.disabled = true;
  }
}

// Lista de estações fictícias
const estacoesFicticias = [
  { nome: "Estação Central", potencia: "150 kW", tempoEspera: "10 min", disponibilidade: "24/7" },
  { nome: "Shopping Center", potencia: "90 kW", tempoEspera: "15 min", disponibilidade: "6h - 23h" },
  { nome: "Posto Rodovia", potencia: "200 kW", tempoEspera: "5 min", disponibilidade: "24/7" }
];

// Modal e seleção de estação
document.addEventListener("DOMContentLoaded", () => {
  const usuarioAtual = localStorage.getItem("usuario");
  const btnSelecionar = document.getElementById("btnSelecionarEstacao");
  const modal = document.getElementById("stationModal");
  const closeBtn = modal ? modal.querySelector(".close") : null;
  const listaEstacoes = document.getElementById("listaEstacoes");

  if (listaEstacoes) {
    listaEstacoes.innerHTML = "";
    estacoesFicticias.forEach(estacao => {
      const li = document.createElement("li");
      li.textContent = estacao.nome;
      li.addEventListener("click", () => {
        localStorage.setItem(`estacaoSelecionada_${usuarioAtual}`, JSON.stringify(estacao));
        modal.style.display = "none";
        atualizarEstacao();
      });
      listaEstacoes.appendChild(li);
    });
  }

  if (btnSelecionar) {
    btnSelecionar.addEventListener("click", () => {
      modal.style.display = "flex";
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
});

// ---- Modal de Agendamento ----
document.addEventListener("DOMContentLoaded", () => {
  const btnAgendar = document.getElementById("btnAgendar");
  const agendamentoModal = document.getElementById("agendamentoModal");
  const closeBtns = document.querySelectorAll("#agendamentoModal .close");
  const formAgendamento = document.getElementById("formAgendamento");
  const usuarioAtual = localStorage.getItem("usuario");

  if (btnAgendar) {
    btnAgendar.addEventListener("click", () => {
      agendamentoModal.style.display = "flex";
    });
  }

  // Fecha modal
  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      agendamentoModal.style.display = "none";
    });
  });

  // Salvar agendamento
  if (formAgendamento) {
    formAgendamento.addEventListener("submit", (e) => {
      e.preventDefault();

      const data = document.getElementById("dataReserva").value;
      const hora = document.getElementById("horaReserva").value;
      const estacao = JSON.parse(localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`));

      if (!estacao) {
        alert("Selecione uma estação antes de agendar.");
        return;
      }

      const reserva = { data, hora, estacao: estacao.nome };
      localStorage.setItem(`reserva_${usuarioAtual}`, JSON.stringify(reserva));

      // Atualizar card de próxima reserva
      const textoReserva = document.getElementById("textoReserva");
      const btnDetalhes = document.getElementById("btnDetalhesReserva");

      if (textoReserva) {
        textoReserva.textContent = `Reserva em ${estacao.nome} para ${data} às ${hora}`;
      }
      if (btnDetalhes) {
        btnDetalhes.style.display = "inline-block";
      }

      agendamentoModal.style.display = "none";
      formAgendamento.reset();
    });
  }

  // Fechar modal clicando fora
  window.addEventListener("click", (e) => {
    if (e.target === agendamentoModal) agendamentoModal.style.display = "none";
  });
});

// Função para carregar reservas salvas
function carregarReservas() {
  const usuario = localStorage.getItem("usuario");
  return JSON.parse(localStorage.getItem(`reservas_${usuario}`)) || [];
}

// Função para salvar reservas
function salvarReservas(reservas) {
  const usuario = localStorage.getItem("usuario");
  localStorage.setItem(`reservas_${usuario}`, JSON.stringify(reservas));
}

// Função para renderizar as reservas na tela
function renderizarReservas() {
  const reservas = carregarReservas();
  const textoReserva = document.getElementById("textoReserva");
  const lista = document.getElementById("listaReservas");

  if (reservas.length === 0) {
    textoReserva.textContent = "Nenhuma reserva agendada.";
    lista.innerHTML = "";
    return;
  
  }

  // Reserva mais próxima (primeira)
  const primeira = reservas[0];
  textoReserva.innerHTML = `
    <strong>Próxima Reserva</strong>
    <p>Estação: ${primeira.estacao}</p>
    <p>Data: ${primeira.data}</p>
    <p>Horário: ${primeira.hora}</p>
  `;

  // Outras reservas
  lista.innerHTML = "";
  reservas.slice(1).forEach(r => {
    const div = document.createElement("div");
    div.classList.add("reserva-item");
    div.innerHTML = `
      <p><strong>${r.estacao}</strong> - ${r.data} ${r.hora}</p>
    `;
    lista.appendChild(div);
  });
}

// Confirmar nova reserva
document.getElementById("formAgendamento").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = document.getElementById("dataReserva").value;
  const hora = document.getElementById("horaReserva").value;
  const estacao = JSON.parse(localStorage.getItem(`estacaoSelecionada_${localStorage.getItem("usuario")}`));

  if (!data || !hora || !estacao) {
    alert("Selecione estação, data e horário!");
    return;
  }

  const reservas = carregarReservas();
  reservas.push({ estacao: estacao.nome, data, hora });
  salvarReservas(reservas);
  renderizarReservas();

  document.getElementById("agendamentoModal").style.display = "none";
});

const btnDetalhes = document.getElementById("btnDetalhesReserva");
const modalDetalhes = document.getElementById("detalhesModal");
const closeDetalhes = document.getElementById("closeDetalhes");
const detalhesReserva = document.getElementById("detalhesReserva");

btnDetalhes.addEventListener("click", () => {
  const reservas = carregarReservas();
  if (reservas.length === 0) {
    alert("Nenhuma reserva encontrada!");
    return;
  }

  const primeira = reservas[0]; // mostra a próxima reserva
  detalhesReserva.innerHTML = `
    <p><strong>Estação:</strong> ${primeira.estacao}</p>
    <p><strong>Data:</strong> ${primeira.data}</p>
    <p><strong>Horário:</strong> ${primeira.hora}</p>
  `;
  modalDetalhes.style.display = "flex";
});

closeDetalhes.addEventListener("click", () => {
  modalDetalhes.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modalDetalhes) {
    modalDetalhes.style.display = "none";
  }
});

