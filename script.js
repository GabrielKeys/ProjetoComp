// ---- Verificação de login + inicialização ----
window.onload = function () {
  const logado = localStorage.getItem("logado");
  const usuario = localStorage.getItem("usuario");

  if (!logado || !usuario) {
    window.location.href = "login.html";
    return;
  }

  // Nome com primeira letra maiúscula + ícone engrenagem
  const nomeFormatado = usuario.charAt(0).toUpperCase() + usuario.slice(1);
  const nomeUsuario = document.getElementById("nomeUsuario");
  if (nomeUsuario) {
    nomeUsuario.innerHTML = `<span class="online-dot"></span> ${nomeFormatado} <span class="settings-icon">⚙️</span>`;
  }

  // -----------------------------
  // Preenche dados do veículo
  // -----------------------------
  document.querySelector(".vehicle-info").querySelectorAll("p")[0].innerText =
    "Modelo: " + (localStorage.getItem("veiculoModelo") || "Veículo Elétrico");
  document.querySelector(".vehicle-info").querySelectorAll("p")[1].innerText =
    "Ano: " + (localStorage.getItem("veiculoAno") || "2023");
  document.querySelector(".vehicle-info").querySelectorAll("p")[2].innerText =
    "Bateria: " + (localStorage.getItem("veiculoBateria") || "0,3 kWh");
  document.querySelector(".vehicle-info").querySelectorAll("p")[3].innerText =
    "Carregando: " + (localStorage.getItem("veiculoCarregamento") || "170 kW");

  // -----------------------------
  // Modal de edição
  // -----------------------------
  const modal = document.getElementById("editModal");
  const settingsIcon = document.querySelector(".settings-icon");
  const closeBtn = document.querySelector(".close");
  const editForm = document.getElementById("editForm");

  if (settingsIcon) {
    settingsIcon.addEventListener("click", () => {
      // Preenche os inputs com os valores atuais
      document.getElementById("editModelo").value = localStorage.getItem("veiculoModelo") || "Veículo Elétrico";
      document.getElementById("editAno").value = localStorage.getItem("veiculoAno") || "2023";
      document.getElementById("editBateria").value = localStorage.getItem("veiculoBateria") || "0,3 kWh";
      document.getElementById("editCarregamento").value = localStorage.getItem("veiculoCarregamento") || "170 kW";
      modal.style.display = "flex";
    });
  }

  if (closeBtn) {
    closeBtn.onclick = () => (modal.style.display = "none");
  }

  if (editForm) {
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Salva no localStorage
      localStorage.setItem("veiculoModelo", document.getElementById("editModelo").value);
      localStorage.setItem("veiculoAno", document.getElementById("editAno").value);
      localStorage.setItem("veiculoBateria", document.getElementById("editBateria").value);
      localStorage.setItem("veiculoCarregamento", document.getElementById("editCarregamento").value);

      modal.style.display = "none";
      location.reload(); // Atualiza a página para refletir mudanças
    });
  }
};

// ---- Função de logout ----
function logout() {
  localStorage.removeItem("logado");
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}
