document.addEventListener("DOMContentLoaded", () => {
  const usuarioAtual = localStorage.getItem("usuarioEmail");
  if (!usuarioAtual) return;

  const detalhes = document.getElementById("veiculoDetalhes");
  const btnEditar = document.getElementById("btnEditarVeiculo");

  // =====================================================
  //  Abrir a edição do veículo
  // =====================================================

  // ---- Renderizar veículo na tela ----
  function renderVehicle() {
    detalhes.innerHTML = `
      <div class="vehicle-fields">
        <div class="field-row"><label>Modelo:</label><span>${localStorage.getItem(`veiculoModelo_${usuarioAtual}`) || "----"}</span></div>
        <div class="field-row"><label>Ano:</label><span>${localStorage.getItem(`veiculoAno_${usuarioAtual}`) || "----"}</span></div>
        <div class="field-row"><label>Placa:</label><span>${localStorage.getItem(`veiculoPlaca_${usuarioAtual}`) || "----"}</span></div>
        <div class="field-row"><label>Bateria:</label><span>${localStorage.getItem(`veiculoBateria_${usuarioAtual}`) || "---- kWh"}</span></div>
        <div class="field-row"><label>Carga:</label><span>${localStorage.getItem(`veiculoCarregamento_${usuarioAtual}`) || "---- kW"}</span></div>
      </div>
    `;
    btnEditar.classList.remove("hidden"); // garante que volta a aparecer
  }

  renderVehicle();

  // ---- Entrar no modo edição ----
  btnEditar.addEventListener("click", () => {
    btnEditar.classList.add("hidden"); // esconde botão editar

    detalhes.innerHTML = `
      <div class="vehicle-fields">
        <div class="field-row"><label>Modelo:</label><input type="text" id="editModelo" value="${localStorage.getItem(`veiculoModelo_${usuarioAtual}`) || ""}" placeholder="Modelo do veículo"></div>
        <div class="field-row"><label>Ano:</label><input type="text" id="editAno" value="${localStorage.getItem(`veiculoAno_${usuarioAtual}`) || ""}" placeholder="Ano"></div>
        <div class="field-row"><label>Placa:</label><input type="text" id="editPlaca" value="${localStorage.getItem(`veiculoPlaca_${usuarioAtual}`) || ""}" placeholder="AAA-0000" maxlength="8"></div>
        <div class="field-row"><label>Bateria:</label><input type="text" id="editBateria" value="${(localStorage.getItem(`veiculoBateria_${usuarioAtual}`) || "").replace(" kWh", "")}" placeholder="Em kWh"></div>
        <div class="field-row"><label>Carga:</label><input type="text" id="editCarregamento" value="${(localStorage.getItem(`veiculoCarregamento_${usuarioAtual}`) || "").replace(" kW", "")}" placeholder="Em kW"></div>
      </div>
      <div class="form-actions">
        <button id="btnSalvarVeiculo">Salvar</button>
        <button id="btnCancelarEdicao" class="btn-cancelar">Cancelar</button>
      </div>
    `;

    aplicarRegrasInputs();
  });

  // ---- Regras de formatação ----
  function aplicarRegrasInputs() {
    const anoInput = document.getElementById("editAno");
    const placaInput = document.getElementById("editPlaca");
    const batInput = document.getElementById("editBateria");
    const carInput = document.getElementById("editCarregamento");
    const btnSalvar = document.getElementById("btnSalvarVeiculo");
    const btnCancelar = document.getElementById("btnCancelarEdicao");

    // Ano = só 4 dígitos
    anoInput.addEventListener("input", () => {
      anoInput.value = anoInput.value.replace(/\D/g, "").slice(0, 4);
    });

    // Placa = AAA-0000
    placaInput.addEventListener("input", () => {
      let valor = placaInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (valor.length > 3) valor = valor.slice(0, 3) + "-" + valor.slice(3, 7);
      placaInput.value = valor.slice(0, 8);
    });

    // Função para Bateria e Carregamento
    function configurarCampoNumeroComSufixo(input, sufixo) {
      input.addEventListener("input", () => {
        let valor = input.value.replace(/[^0-9,]/g, "");
        const partes = valor.split(",");
        if (partes[0].length > 4) partes[0] = partes[0].slice(0, 4);
        if (partes[1]) partes[1] = partes[1].slice(0, 2);
        input.value = partes.join(",");
      });

      // Aplica o sufixo quando sair do campo
      input.addEventListener("blur", () => {
        if (input.value && !input.value.includes(sufixo)) {
          input.value += ` ${sufixo}`;
        }
      });

      // Remove o sufixo ao focar, para editar
      input.addEventListener("focus", () => {
        input.value = input.value.replace(` ${sufixo}`, "");
      });

      // Garante que o sufixo já apareça logo ao abrir edição
      if (input.value && !input.value.includes(sufixo)) {
        input.value += ` ${sufixo}`;
      }
    }

    configurarCampoNumeroComSufixo(batInput, "kWh");
    configurarCampoNumeroComSufixo(carInput, "kW");

    // ---- Salvar ----
    btnSalvar.addEventListener("click", () => {
      if (anoInput.value.length !== 4) {
        mostrarMensagem("❌ O ano deve ter 4 dígitos.", "erro");
        return;
      }

      if (placaInput.value.length !== 8) {
        mostrarMensagem("❌ A placa deve estar no formato AAA-0000.", "erro");
        return;
      }

      localStorage.setItem(`veiculoModelo_${usuarioAtual}`, document.getElementById("editModelo").value);
      localStorage.setItem(`veiculoAno_${usuarioAtual}`, anoInput.value);
      localStorage.setItem(`veiculoPlaca_${usuarioAtual}`, placaInput.value);
      localStorage.setItem(`veiculoBateria_${usuarioAtual}`, batInput.value.endsWith("kWh") ? batInput.value : batInput.value + " kWh");
      localStorage.setItem(`veiculoCarregamento_${usuarioAtual}`, carInput.value.endsWith("kW") ? carInput.value : carInput.value + " kW");

      renderVehicle();
      mostrarMensagem("✅ Veículo atualizado com sucesso!", "sucesso");
    });

    // ---- Cancelar ----
    btnCancelar.addEventListener("click", () => {
      renderVehicle(); // volta para visualização
    });
  }
});
