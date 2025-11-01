// ====================================
// Modal de Detalhes das Reservas (BACKEND + UI)
// ====================================

// 🔹 Botões e elementos do DOM
const btnDetalhesHome = document.getElementById("btnDetalhesReserva");
const btnDetalhesMapa = document.getElementById("btnDetalhesReservaMapa");
const detalhesModal = document.getElementById("detalhesModal");
const detalhesReserva = document.getElementById("detalhesReserva");
const closeDetalhes = document.getElementById("closeDetalhes");

// ====================================
// Função principal: abrir o modal com reservas do backend
// ====================================
async function abrirModalDetalhes() {
  const email = localStorage.getItem("usuarioEmail");
  if (!email) {
    mostrarMensagem("⚠️ Nenhum usuário logado.", "erro");
    return;
  }

  try {
    // 🔹 Busca as reservas no backend
    const reservas = await fetch(`${API_BASE}/reservations/${email}`).then(r => r.json());

    if (!reservas || reservas.length === 0) {
      mostrarMensagem("Nenhuma reserva encontrada!", "aviso");
      return;
    }

    // 🔹 Monta o HTML com botão "Cancelar"
    detalhesReserva.innerHTML = reservas.map((r, i) => `
      <p>
        <strong>${i + 1}.</strong> ${r.data} às ${r.hora} - ${r.stations?.name || 'Estação desconhecida'}
        <button class="btn-cancelar" data-id="${r.id}">Cancelar</button>
      </p>
    `).join("");

    if (detalhesModal) detalhesModal.style.display = "flex";

    // 🔹 Atribui eventos de cancelamento
    document.querySelectorAll(".btn-cancelar").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const reservaId = e.target.getAttribute("data-id");
        if (confirm("Tem certeza que deseja cancelar esta reserva?")) {
          // 🔸 Remove no backend
          await fetch(`${API_BASE}/reservations/${reservaId}`, { method: "DELETE" });

          // 🔸 Atualiza a lista local após cancelamento
          mostrarMensagem("❌ Reserva cancelada com sucesso.", "erro");
          detalhesModal.style.display = "none";
          abrirModalDetalhes(); // recarrega a lista atualizada
        }
      });
    });
  } catch (err) {
    console.error("Erro ao carregar reservas:", err);
    mostrarMensagem("Erro ao carregar reservas do servidor.", "erro");
  }
}

// ====================================
// Eventos do modal (abrir / fechar)
// ====================================
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
