document.addEventListener("DOMContentLoaded", () => {
  const logado = localStorage.getItem("logado");
  const usuario = localStorage.getItem("usuario");

  if (!logado || !usuario) {
    window.location.href = "../login/login.html";
    return;
  }

  // Nome formatado do usuário
  const nomeFormatado = usuario.charAt(0).toUpperCase() + usuario.slice(1);
  const nomeUsuario = document.getElementById("nomeUsuario");
  if (nomeUsuario) {
    nomeUsuario.innerHTML = `<span class="online-dot"></span> ${nomeFormatado} <span class="settings-icon"><img src="../assets/engrenagem.png" alt="Logo" class="header-logo" /></span>`;
  }

  // Atualizar estação na carga inicial
  atualizarEstacao();

  // Evento do botão "Ver Detalhes"
  const btnDetalhes = document.getElementById("btnDetalhesReserva");
  const detalhesModal = document.getElementById("detalhesModal");
  const detalhesReserva = document.getElementById("detalhesReserva");
  const closeDetalhes = document.getElementById("closeDetalhes");

  if (btnDetalhes) {
    btnDetalhes.addEventListener("click", () => {
      const reservas = carregarReservas();
      if (!reservas || reservas.length === 0) {
        alert("Nenhuma reserva encontrada.");
        return;
      }

// Monta HTML com botão "Cancelar"
detalhesReserva.innerHTML = reservas.map((r, i) => `
  <p>
    <strong>${i + 1}.</strong> ${r.data} às ${r.hora} - ${r.estacao}
    <button class="btn-cancelar" data-index="${i}">Cancelar</button>
  </p>
`).join("");

// Adiciona evento aos botões "Cancelar"
document.querySelectorAll(".btn-cancelar").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const index = e.target.getAttribute("data-index");
    if (confirm("Tem certeza que deseja cancelar esta reserva?")) {
      let reservas = carregarReservas();
      reservas.splice(index, 1); // remove a reserva
      salvarReservas(reservas);  // atualiza no localStorage
      renderizarReservas();      // atualiza lista na tela
      detalhesModal.style.display = "none"; // fecha modal
    }
  });
});

      // Mostra modal
      detalhesModal.style.display = "flex";
    });
  }

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
});
