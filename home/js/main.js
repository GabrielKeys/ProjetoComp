  // Atualizar estação na carga inicial
  atualizarEstacao();

  // ====================================
  // Modal de Detalhes das Reservas
  // ====================================
  const btnDetalhesHome = document.getElementById("btnDetalhesReserva");
  const btnDetalhesMapa = document.getElementById("btnDetalhesReservaMapa");

  const detalhesModal = document.getElementById("detalhesModal");
  const detalhesReserva = document.getElementById("detalhesReserva");
  const closeDetalhes = document.getElementById("closeDetalhes");

  function abrirModalDetalhes() {
    const reservas = carregarReservas();
    if (!reservas || reservas.length === 0) {
      mostrarMensagem("Nenhuma reserva encontrada!", "aviso");
      return;
    }

    // Monta HTML com botão "Cancelar"
    detalhesReserva.innerHTML = reservas.map((r, i) => `
      <p>
        <strong>${i + 1}.</strong> ${r.data} às ${r.hora} - ${r.estacao}
        <button class="btn-cancelar" data-index="${i}">Cancelar</button>
      </p>
    `).join("");

    if (detalhesModal) detalhesModal.style.display = "flex";

    // Eventos de cancelar
    document.querySelectorAll(".btn-cancelar").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.getAttribute("data-index"), 10);
        if (confirm("Tem certeza que deseja cancelar esta reserva?")) {
          let reservas = carregarReservas();
          reservas.splice(index, 1); // remove a reserva
          salvarReservas(reservas);
          renderizarReservas();
          detalhesModal.style.display = "none";
          mostrarMensagem("❌ Reserva cancelada com sucesso.", "erro");
        }
      });
    });
  }

  // Eventos para abrir modal (Home e Mapa)
  if (btnDetalhesHome) btnDetalhesHome.addEventListener("click", abrirModalDetalhes);
  if (btnDetalhesMapa) btnDetalhesMapa.addEventListener("click", abrirModalDetalhes);

  // Fecha modal no X
  if (closeDetalhes) {
    closeDetalhes.addEventListener("click", () => {
      detalhesModal.style.display = "none";
    });
  }

  // Fecha modal ao clicar fora
  window.addEventListener("click", (e) => {
    if (e.target === detalhesModal) {
      detalhesModal.style.display = "none";
    }
  });


