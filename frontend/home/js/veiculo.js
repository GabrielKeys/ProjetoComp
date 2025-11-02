document.addEventListener("DOMContentLoaded", async () => {
  const usuarioAtual = localStorage.getItem("usuarioEmail");
  if (!usuarioAtual) return;

  const detalhes = document.getElementById("veiculoDetalhes");
  const btnEditar = document.getElementById("btnEditarVeiculo");

  // =====================================================
  //  BUSCAR VEÍCULO DO BANCO
  // =====================================================
  async function buscarVeiculo() {
    try {
      const resp = await fetch(`http://localhost:4000/veiculos/${usuarioAtual}`);
      if (!resp.ok) throw new Error("Erro ao buscar veículo");
      const data = await resp.json();
      // Garante retorno null caso não exista veículo
      return data && Object.keys(data).length ? data : null;
    } catch (err) {
      console.error("Erro ao buscar veículo:", err);
      return null;
    }
  }

  // =====================================================
  //  RENDERIZAR VEÍCULO NA TELA
  // =====================================================
  async function renderVehicle() {
    const veiculo = await buscarVeiculo();

    detalhes.innerHTML = `
      <div class="vehicle-fields">
        <div class="field-row"><label>Modelo:</label><span>${veiculo?.modelo || "----"}</span></div>
        <div class="field-row"><label>Ano:</label><span>${veiculo?.ano || "----"}</span></div>
        <div class="field-row"><label>Placa:</label><span>${veiculo?.placa || "----"}</span></div>
        <div class="field-row"><label>Bateria:</label><span>${veiculo?.bateria ? veiculo.bateria + " kWh" : "----"}</span></div>
        <div class="field-row"><label>Carga:</label><span>${veiculo?.carregamento ? veiculo.carregamento + " kW" : "----"}</span></div>
      </div>
    `;
    btnEditar.classList.remove("hidden");
  }

  await renderVehicle();

  // =====================================================
  //  ENTRAR NO MODO EDIÇÃO
  // =====================================================
  btnEditar.addEventListener("click", async () => {
    btnEditar.classList.add("hidden");
    const veiculo = await buscarVeiculo();

    detalhes.innerHTML = `
      <div class="vehicle-fields">
        <div class="field-row"><label>Modelo:</label><input type="text" id="editModelo" value="${veiculo?.modelo || ""}" placeholder="Modelo do veículo"></div>
        <div class="field-row"><label>Ano:</label><input type="text" id="editAno" value="${veiculo?.ano || ""}" placeholder="Ano"></div>
        <div class="field-row"><label>Placa:</label><input type="text" id="editPlaca" value="${veiculo?.placa || ""}" placeholder="AAA-0000" maxlength="8"></div>
        <div class="field-row"><label>Bateria:</label><input type="text" id="editBateria" value="${veiculo?.bateria || ""}" placeholder="Em kWh"></div>
        <div class="field-row"><label>Carga:</label><input type="text" id="editCarregamento" value="${veiculo?.carregamento || ""}" placeholder="Em kW"></div>
      </div>
      <div class="form-actions">
        <button id="btnSalvarVeiculo">Salvar</button>
        <button id="btnCancelarEdicao" class="btn-cancelar">Cancelar</button>
      </div>
    `;

    aplicarRegrasInputs();
  });

  // =====================================================
  //  FORMATAR E SALVAR VEÍCULO
  // =====================================================
  function aplicarRegrasInputs() {
    const anoInput = document.getElementById("editAno");
    const placaInput = document.getElementById("editPlaca");
    const batInput = document.getElementById("editBateria");
    const carInput = document.getElementById("editCarregamento");
    const btnSalvar = document.getElementById("btnSalvarVeiculo");
    const btnCancelar = document.getElementById("btnCancelarEdicao");

    // Ano = apenas 4 dígitos
    anoInput.addEventListener("input", () => {
      anoInput.value = anoInput.value.replace(/\D/g, "").slice(0, 4);
    });

    // Placa = AAA-0000
    placaInput.addEventListener("input", () => {
      let valor = placaInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (valor.length > 3) valor = valor.slice(0, 3) + "-" + valor.slice(3, 7);
      placaInput.value = valor.slice(0, 8);
    });

    // Campos numéricos com formatação
    function configurarCampoNumeroComSufixo(input, sufixo) {
      input.addEventListener("input", () => {
        let valor = input.value.replace(/[^0-9,]/g, "");
        const partes = valor.split(",");
        if (partes[0].length > 4) partes[0] = partes[0].slice(0, 4);
        if (partes[1]) partes[1] = partes[1].slice(0, 2);
        input.value = partes.join(",");
      });

      input.addEventListener("blur", () => {
        if (input.value && !input.value.includes(sufixo)) {
          input.value += ` ${sufixo}`;
        }
      });

      input.addEventListener("focus", () => {
        input.value = input.value.replace(` ${sufixo}`, "");
      });

      if (input.value && !input.value.includes(sufixo)) {
        input.value += ` ${sufixo}`;
      }
    }

    configurarCampoNumeroComSufixo(batInput, "kWh");
    configurarCampoNumeroComSufixo(carInput, "kW");

    // =====================================================
    //  SALVAR VEÍCULO NO BANCO
    // =====================================================
    btnSalvar.addEventListener("click", async () => {
      const modelo = document.getElementById("editModelo").value.trim();
      const ano = anoInput.value.trim();
      const placa = placaInput.value.trim().toUpperCase();
      const bateriaRaw = batInput.value.trim().replace(" kWh", "").replace(",", ".");
      const carregamentoRaw = carInput.value.trim().replace(" kW", "").replace(",", ".");
      const bateria = bateriaRaw === "" ? NaN : parseFloat(bateriaRaw);
      const carregamento = carregamentoRaw === "" ? NaN : parseFloat(carregamentoRaw);

      if (!modelo) return mostrarMensagem("❌ O modelo do veículo é obrigatório.", "erro");
      if (ano.length !== 4 || isNaN(ano)) return mostrarMensagem("❌ O ano deve ter 4 dígitos.", "erro");
      if (!/^[A-Z]{3}-\d{4}$/.test(placa)) return mostrarMensagem("❌ A placa deve estar no formato AAA-0000.", "erro");
      if (isNaN(bateria)) return mostrarMensagem("❌ Informe a capacidade da bateria (em kWh).", "erro");
      if (isNaN(carregamento)) return mostrarMensagem("❌ Informe a potência de carregamento (em kW).", "erro");

      const payload = { usuario_email: usuarioAtual, modelo, ano: parseInt(ano), placa, bateria, carregamento };

      try {
        const resp = await fetch("http://localhost:4000/veiculos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const erroTexto = await resp.text();
          console.error("❌ Erro do servidor:", erroTexto);
          mostrarMensagem("❌ Erro ao salvar veículo no banco de dados.", "erro");
          return;
        }

        mostrarMensagem("✅ Veículo salvo com sucesso!", "sucesso");
        await renderVehicle();
      } catch (err) {
        console.error("❌ Erro de rede:", err);
        mostrarMensagem("❌ Falha ao conectar com o servidor.", "erro");
      }
    });

    // =====================================================
    //  CANCELAR EDIÇÃO
    // =====================================================
    btnCancelar.addEventListener("click", () => renderVehicle());
  }

  // =====================================================
  //  MENSAGEM DE FEEDBACK
  // =====================================================
  function mostrarMensagem(texto, tipo) {
    const msg = document.createElement("div");
    msg.textContent = texto;
    msg.className = `mensagem ${tipo}`;
    msg.style.position = "fixed";
    msg.style.top = "20px";
    msg.style.right = "20px";
    msg.style.padding = "10px 14px";
    msg.style.borderRadius = "8px";
    msg.style.zIndex = 9999;
    msg.style.fontWeight = "600";
    msg.style.color = "#fff";
    msg.style.boxShadow = "0 6px 18px rgba(0,0,0,0.25)";
    msg.style.background = tipo === "sucesso" ? "#4CAF50" : "#F44336";

    document.body.appendChild(msg);
    setTimeout(() => {
      msg.style.transition = "opacity 300ms ease";
      msg.style.opacity = "0";
      setTimeout(() => msg.remove(), 300);
    }, 3000);
  }
});
