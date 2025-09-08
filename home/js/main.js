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
    nomeUsuario.innerHTML = `
  <span class="online-dot"></span> ${nomeFormatado}
  <button id="gearBtn" class="settings-icon" title="Configurações">
    <img src="../assets/engrenagem.png" alt="Configurações" />
  </button>
`;
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

// ---- Sistema de mensagens customizadas ----
function mostrarMensagem(texto, tipo = "aviso") {
  // cria container se não existir
  let container = document.getElementById("mensagensContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "mensagensContainer";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.right = "20px";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    document.body.appendChild(container);
  }

  // cria mensagem
  const msg = document.createElement("div");
  msg.textContent = texto;
  msg.style.padding = "12px 18px";
  msg.style.borderRadius = "8px";
  msg.style.color = "#fff";
  msg.style.fontWeight = "bold";
  msg.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  msg.style.opacity = "0";
  msg.style.transition = "opacity 0.3s ease";

  // cores por tipo
  if (tipo === "erro") msg.style.background = "#e74c3c";
  else if (tipo === "sucesso") msg.style.background = "#27ae60";
  else msg.style.background = "#f39c12";

  container.appendChild(msg);

  // animação de entrada
  setTimeout(() => {
    msg.style.opacity = "1";
  }, 50);

  // remove após 3s
  setTimeout(() => {
    msg.style.opacity = "0";
    setTimeout(() => msg.remove(), 300);
  }, 3000);
}
