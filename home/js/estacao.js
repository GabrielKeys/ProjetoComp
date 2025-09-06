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

