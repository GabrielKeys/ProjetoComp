document.addEventListener("DOMContentLoaded", () => {
  const usuarioAtual = localStorage.getItem("usuario");
  if (!usuarioAtual) return;

  const vehicleInfoEl = document.querySelector(".vehicle-info");
  if (!vehicleInfoEl) return;

  const info = vehicleInfoEl.querySelectorAll("p");

  // ---- Renderizar veículo na tela ----
  function renderVehicle() {
    info[0].innerText = "Modelo: " + (localStorage.getItem(`veiculoModelo_${usuarioAtual}`) || "---");
    info[1].innerText = "Ano: " + (localStorage.getItem(`veiculoAno_${usuarioAtual}`) || "----");
    info[2].innerText = "Placa: " + (localStorage.getItem(`veiculoPlaca_${usuarioAtual}`) || "----");
    info[3].innerText = "Bateria: " + (localStorage.getItem(`veiculoBateria_${usuarioAtual}`) || "-- kWh");
    info[4].innerText = "Carregando: " + (localStorage.getItem(`veiculoCarregamento_${usuarioAtual}`) || "---- kW");
  }

  renderVehicle();

  const modal = document.getElementById("editModal");
  const editForm = document.getElementById("editForm");
  const closeBtn = modal ? modal.querySelector(".close") : null;

  const nomeUsuario = document.getElementById("nomeUsuario");

  // ---- Abrir modal ao clicar na engrenagem ----
  if (nomeUsuario) {
    nomeUsuario.addEventListener("click", (e) => {
      if (e.target.closest && e.target.closest(".settings-icon")) {
        document.getElementById("editModelo").value = localStorage.getItem(`veiculoModelo_${usuarioAtual}`) || "";
        document.getElementById("editAno").value = localStorage.getItem(`veiculoAno_${usuarioAtual}`) || "";
        document.getElementById("editPlaca").value = localStorage.getItem(`veiculoPlaca_${usuarioAtual}`) || "";
        document.getElementById("editBateria").value = localStorage.getItem(`veiculoBateria_${usuarioAtual}`) || "";
        document.getElementById("editCarregamento").value = localStorage.getItem(`veiculoCarregamento_${usuarioAtual}`) || "";

        if (modal) modal.style.display = "flex";
      }
    });
  }

  // ---- Fechar modal ----
  if (closeBtn) closeBtn.addEventListener("click", () => {
    if (modal) modal.style.display = "none";
  });

  // ---- Regras de formatação ----

  // Ano: somente 4 dígitos obrigatórios
  const anoInput = document.getElementById("editAno");
  anoInput.addEventListener("input", () => {
    anoInput.value = anoInput.value.replace(/\D/g, "").slice(0, 4);
  });

  // Placa: 3 letras + "-" + 4 números
  const placaInput = document.getElementById("editPlaca");
  placaInput.addEventListener("input", () => {
    let valor = placaInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (valor.length > 3) {
      valor = valor.slice(0, 3) + "-" + valor.slice(3, 7);
    }
    placaInput.value = valor.slice(0, 8);
  });

  // Função para bateria e carregamento
  function configurarCampoNumeroComSufixo(input, sufixo) {
    input.addEventListener("input", () => {
      let valor = input.value.toUpperCase();

      // Mantém apenas números e vírgula
      valor = valor.replace(/[^0-9,]/g, "");

      // Apenas uma vírgula
      const partes = valor.split(",");
      if (partes.length > 2) {
        valor = partes[0] + "," + partes[1];
      }

      // Máximo 4 números antes da vírgula
      if (partes[0].length > 4) {
        partes[0] = partes[0].slice(0, 4);
      }

      // Máximo 2 números depois da vírgula
      if (partes[1]) {
        partes[1] = partes[1].slice(0, 2);
      }

      input.value = partes.join(",");
    });

    // Adiciona sufixo ao sair do campo
    input.addEventListener("blur", () => {
      let valor = input.value;
      if (valor && !valor.endsWith(sufixo)) {
        input.value = valor + " " + sufixo;
      }
    });

    // Remove sufixo ao focar
    input.addEventListener("focus", () => {
      input.value = input.value.replace(" " + sufixo, "");
    });
  }

  configurarCampoNumeroComSufixo(document.getElementById("editBateria"), "kWh");
  configurarCampoNumeroComSufixo(document.getElementById("editCarregamento"), "kW");

  // ---- Salvar edição ----
  if (editForm) {
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (anoInput.value.length !== 4) {
        mostrarMensagem("❌ O ano deve ter 4 dígitos.", "erro");
        return;
      }

      if (placaInput.value.length !== 8) {
        mostrarMensagem("❌ A placa deve ter 7 caracteres (ex: ABC-1234).", "erro");
        return;
      }

      localStorage.setItem(`veiculoModelo_${usuarioAtual}`, document.getElementById("editModelo").value);
      localStorage.setItem(`veiculoAno_${usuarioAtual}`, anoInput.value);
      localStorage.setItem(`veiculoPlaca_${usuarioAtual}`, placaInput.value);
      localStorage.setItem(`veiculoBateria_${usuarioAtual}`, document.getElementById("editBateria").value);
      localStorage.setItem(`veiculoCarregamento_${usuarioAtual}`, document.getElementById("editCarregamento").value);

      if (modal) modal.style.display = "none";
      renderVehicle(); // atualiza sem reload
      mostrarMensagem("✅ Veículo atualizado com sucesso!", "sucesso");
    });
  }
});
