document.addEventListener("DOMContentLoaded", () => {
  const usuarioAtual = localStorage.getItem("usuario");
  if (!usuarioAtual) return;

  const vehicleInfoEl = document.querySelector(".vehicle-info");
  if (!vehicleInfoEl) return;

  const info = vehicleInfoEl.querySelectorAll("p");

  function renderVehicle() {
    info[0].innerText = "Modelo: " + (localStorage.getItem(`veiculoModelo_${usuarioAtual}`) || "Veículo Elétrico");
    info[1].innerText = "Ano: " + (localStorage.getItem(`veiculoAno_${usuarioAtual}`) || "----");
    info[2].innerText = "Bateria: " + (localStorage.getItem(`veiculoBateria_${usuarioAtual}`) || "-- kWh");
    info[3].innerText = "Carregando: " + (localStorage.getItem(`veiculoCarregamento_${usuarioAtual}`) || "---- kW");
  }

  renderVehicle();

  const modal = document.getElementById("editModal");
  const editForm = document.getElementById("editForm");
  const closeBtn = modal ? modal.querySelector(".close") : null;

  // --- Event delegation: pega cliques no elemento nomeUsuario e abre modal quando o alvo for a engrenagem ---
  const nomeUsuario = document.getElementById("nomeUsuario");

  if (nomeUsuario) {
    nomeUsuario.addEventListener("click", (e) => {
      // se clicar numa tag dentro da engrenagem, acha o elemento mais próximo com essa classe
      if (e.target.closest && e.target.closest(".settings-icon")) {
        // preencher inputs com valores atuais (ou vazios)
        const m = document.getElementById("editModelo");
        const a = document.getElementById("editAno");
        const b = document.getElementById("editBateria");
        const c = document.getElementById("editCarregamento");

        if (m) m.value = localStorage.getItem(`veiculoModelo_${usuarioAtual}`) || "Veículo Elétrico";
        if (a) a.value = localStorage.getItem(`veiculoAno_${usuarioAtual}`) || "2023";
        if (b) b.value = localStorage.getItem(`veiculoBateria_${usuarioAtual}`) || "0,3 kWh";
        if (c) c.value = localStorage.getItem(`veiculoCarregamento_${usuarioAtual}`) || "170 kW";

        if (modal) modal.style.display = "flex";
      }
    });
  }

  // fechar modal
  if (closeBtn) closeBtn.addEventListener("click", () => {
    if (modal) modal.style.display = "none";
  });

  // salvar edição
  if (editForm) {
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();
      localStorage.setItem(`veiculoModelo_${usuarioAtual}`, document.getElementById("editModelo").value);
      localStorage.setItem(`veiculoAno_${usuarioAtual}`, document.getElementById("editAno").value);
      localStorage.setItem(`veiculoBateria_${usuarioAtual}`, document.getElementById("editBateria").value);
      localStorage.setItem(`veiculoCarregamento_${usuarioAtual}`, document.getElementById("editCarregamento").value);

      if (modal) modal.style.display = "none";
      renderVehicle(); // atualiza sem reload
    });
  }
});
