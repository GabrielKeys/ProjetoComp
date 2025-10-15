// perfil.js
document.addEventListener("DOMContentLoaded", () => {
  const usuarioEmail = localStorage.getItem("usuarioEmail") || localStorage.getItem("usuario");
  if (!usuarioEmail) return;

  let users = JSON.parse(localStorage.getItem("users")) || [];
  let userIndex = users.findIndex(u => u.email === usuarioEmail || u.username === usuarioEmail);
  let userData;

  if (userIndex === -1) {
    userData = {
      fullName: localStorage.getItem("usuario") || "",
      email: localStorage.getItem("usuarioEmail") || usuarioEmail,
      phone: "",
      car: {},
      photo: localStorage.getItem("usuarioFoto") || "",
    };
    users.push(userData);
    userIndex = users.length - 1;
    localStorage.setItem("users", JSON.stringify(users));
  } else {
    userData = users[userIndex];
    const fotoLS = localStorage.getItem("usuarioFoto");
    if (fotoLS && (!userData.photo || userData.photo !== fotoLS)) {
      userData.photo = fotoLS;
      users[userIndex] = userData;
      localStorage.setItem("users", JSON.stringify(users));
    }
  }

  const userDetalhes = document.getElementById("userDetalhes");
  const veiculoDetalhes = document.getElementById("veiculoDetalhes");
  const fotoUsuario = document.getElementById("fotoUsuario");
  const btnUploadFoto = document.getElementById("btnUploadFoto");
  const inputFoto = document.getElementById("inputFoto");
  const btnRemoverFoto = document.getElementById("btnRemoverFoto");
  const btnEditarVeiculo = document.getElementById("btnEditarVeiculo");

  // ================================
  // Sistema de mensagens customizadas
  // ================================
  // só define se não existir (evita sobrescrever se já estiver global)
  if (typeof mostrarMensagem !== "function") {
    function mostrarMensagem(texto, tipo = "aviso") {
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

      const msg = document.createElement("div");
      msg.textContent = texto;
      msg.style.padding = "12px 18px";
      msg.style.borderRadius = "8px";
      msg.style.color = "#fff";
      msg.style.fontWeight = "bold";
      msg.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
      msg.style.opacity = "0";
      msg.style.transition = "opacity 0.3s ease";

      if (tipo === "erro") msg.style.background = "#e74c3c";
      else if (tipo === "sucesso") msg.style.background = "#27ae60";
      else msg.style.background = "#f39c12";

      container.appendChild(msg);

      setTimeout(() => { msg.style.opacity = "1"; }, 50);
      setTimeout(() => {
        msg.style.opacity = "0";
        setTimeout(() => msg.remove(), 300);
      }, 3000);
    }
  }

  function persistirUsers() {
    users[userIndex] = userData;
    localStorage.setItem("users", JSON.stringify(users));
  }

  function atualizarSidebar() {
    const foto = userData.photo || "../assets/foto.png";
    const nome = userData.fullName || userData.email;

    const fotoEl = document.querySelector("#nomeUsuario .user-photo img");
    const nomeEl = document.querySelector("#nomeUsuario .user-name");

    if (fotoEl) fotoEl.src = foto;
    if (nomeEl) nomeEl.textContent = nome;

    localStorage.setItem("usuario", nome);
    localStorage.setItem("usuarioFoto", foto);
  }

  function renderFoto() {
    fotoUsuario.src = userData.photo || "../assets/foto.png";
  }

  function aplicarMascaraTelefone(input) {
    if (!input) return;
    input.addEventListener("input", () => {
      let v = input.value.replace(/\D/g, "").slice(0, 11);
      if (v.length <= 2) input.value = v;
      else if (v.length <= 6) input.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
      else if (v.length <= 10) input.value = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
      else input.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    });
  }

  // ================================
  // Renderizar Perfil
  // ================================
  function renderPerfil() {
    userDetalhes.innerHTML = `
      <div class="vehicle-fields">
      <div class="field-row">
          <label>Email:</label>
          <span style="color:gray;">${userData.email}</span>
        </div>
        <div class="field-row">
          <label>Nome:</label>
          <span id="nomeSpan">${userData.fullName || "---"}</span>
          <button class="icon-edit" id="editNomeBtn">
            <img src="../assets/icone-editar.png" alt="editar" width="18">
          </button>
        </div>
        <div class="field-row">
          <label>Número:</label>
          <span id="telefoneSpan">${userData.phone || "(--) ---------"}</span>
          <button class="icon-edit" id="editTelefoneBtn">
            <img src="../assets/icone-editar.png" alt="editar" width="18">
          </button>
        </div>
        <div class="field-row">
          <label>Senha:</label>
          <span id="senhaSpan">********</span>
          <button class="icon-edit" id="editSenhaBtn">
            <img src="../assets/icone-editar.png" alt="editar" width="18">
          </button>
        </div>
      </div>
    `;


    // Editar Nome
    document.getElementById("editNomeBtn").addEventListener("click", () => {
      document.querySelectorAll(".icon-edit").forEach(btn => btn.style.display = "none");

      const span = document.getElementById("nomeSpan");
      span.outerHTML = `
    <input type="text" id="editNome" value="${userData.fullName || ""}">
    <button id="salvarNome" class="btn-salvar-inline">Salvar</button>
    <button id="cancelarNome" class="btn-cancelar-inline">Cancelar</button>`;

      document.getElementById("salvarNome").onclick = () => {
        userData.fullName = document.getElementById("editNome").value.trim();
        persistirUsers(); atualizarSidebar(); renderPerfil();
        mostrarMensagem("✅ Nome atualizado!", "sucesso");
      };
      document.getElementById("cancelarNome").onclick = () => {
        renderPerfil();
        mostrarMensagem("Edição de nome cancelada.", "aviso");
      };
    });

    // Editar Telefone
document.getElementById("editTelefoneBtn").addEventListener("click", () => {
  // Esconde todos os ícones de edição
  document.querySelectorAll(".icon-edit").forEach(btn => btn.style.display = "none");

  const span = document.getElementById("telefoneSpan");
  span.outerHTML = `
    <input type="text" id="editTelefone" value="${userData.phone || ""}">
    <button id="salvarTel" class="btn-salvar-inline">Salvar</button>
    <button id="cancelarTel" class="btn-cancelar-inline">Cancelar</button>`;

  aplicarMascaraTelefone(document.getElementById("editTelefone"));

  document.getElementById("salvarTel").onclick = () => {
    userData.phone = document.getElementById("editTelefone").value.trim();
    persistirUsers(); atualizarSidebar(); renderPerfil();
    mostrarMensagem("✅ Telefone atualizado!", "sucesso");
  };

  document.getElementById("cancelarTel").onclick = () => {
    renderPerfil();
    mostrarMensagem("Edição de telefone cancelada.", "aviso");
  };
});

// Editar Senha
document.getElementById("editSenhaBtn").addEventListener("click", () => {
  // Esconde todos os ícones de edição
  document.querySelectorAll(".icon-edit").forEach(btn => btn.style.display = "none");

  const span = document.getElementById("senhaSpan");
  span.outerHTML = `
    <input type="password" id="senhaAtual" placeholder="Senha Atual">
    <input type="password" id="novaSenha" placeholder="Nova Senha">
    <button id="salvarSenha" class="btn-salvar-inline">Salvar</button>
    <button id="cancelarSenha" class="btn-cancelar-inline">Cancelar</button>
    <p id="perfilMsg" style="margin-left:10px;"></p>`;

  document.getElementById("salvarSenha").onclick = () => {
    const atual = document.getElementById("senhaAtual").value;
    const nova = document.getElementById("novaSenha").value;
    const msg = document.getElementById("perfilMsg");

    if (userData.password && atual !== userData.password) {
      msg.innerText = "❌ Senha atual incorreta.";
      msg.style.color = "red";
      return;
    }
    if (nova.length < 8) {
      msg.innerText = "❌ A nova senha deve ter pelo menos 8 caracteres.";
      msg.style.color = "red";
      return;
    }
    userData.password = nova;
    persistirUsers();
    mostrarMensagem("✅ Senha atualizada!", "sucesso");
    setTimeout(renderPerfil, 1000);
  };

  document.getElementById("cancelarSenha").onclick = () => {
    renderPerfil();
    mostrarMensagem("Edição de senha cancelada.", "aviso");
  };
});


  }

  // ================================
  // Veículo
  // ================================
  function renderVeiculo() {
    veiculoDetalhes.innerHTML = `
      <div class="vehicle-fields">
        <div class="field-row"><label>Modelo:</label><span>${localStorage.getItem(`veiculoModelo_${usuarioEmail}`) || "----"}</span></div>
        <div class="field-row"><label>Ano:</label><span>${localStorage.getItem(`veiculoAno_${usuarioEmail}`) || "----"}</span></div>
        <div class="field-row"><label>Placa:</label><span>${localStorage.getItem(`veiculoPlaca_${usuarioEmail}`) || "----"}</span></div>
        <div class="field-row"><label>Bateria:</label><span>${localStorage.getItem(`veiculoBateria_${usuarioEmail}`) || "---- kWh"}</span></div>
        <div class="field-row"><label>Carga:</label><span>${localStorage.getItem(`veiculoCarregamento_${usuarioEmail}`) || "---- kW"}</span></div>
      </div>
    `;
    btnEditarVeiculo.classList.remove("hidden");
  }

  btnEditarVeiculo.addEventListener("click", () => {
    btnEditarVeiculo.classList.add("hidden");
    veiculoDetalhes.innerHTML = `
      <div class="vehicle-fields">
        <div class="field-row"><label>Modelo:</label><input type="text" id="editModelo" value="${localStorage.getItem(`veiculoModelo_${usuarioEmail}`) || ""}" placeholder="Modelo do veículo"></div>
        <div class="field-row"><label>Ano:</label><input type="text" id="editAno" value="${localStorage.getItem(`veiculoAno_${usuarioEmail}`) || ""}" placeholder="Ano"></div>
        <div class="field-row"><label>Placa:</label><input type="text" id="editPlaca" value="${localStorage.getItem(`veiculoPlaca_${usuarioEmail}`) || ""}" placeholder="AAA-0000" maxlength="8"></div>
        <div class="field-row"><label>Bateria:</label><input type="text" id="editBateria" value="${(localStorage.getItem(`veiculoBateria_${usuarioEmail}`) || "").replace(" kWh", "")}" placeholder="Em kWh"></div>
        <div class="field-row"><label>Carga:</label><input type="text" id="editCarregamento" value="${(localStorage.getItem(`veiculoCarregamento_${usuarioEmail}`) || "").replace(" kW", "")}" placeholder="Em kW"></div>
      </div>
      <div class="form-actions">
        <button id="btnSalvarVeiculo">Salvar</button>
        <button id="btnCancelarEdicao" class="btn-cancelar">Cancelar</button>
      </div>
    `;
    aplicarRegrasInputs();
  });

  function aplicarRegrasInputs() {
    const anoInput = document.getElementById("editAno");
    const placaInput = document.getElementById("editPlaca");
    const batInput = document.getElementById("editBateria");
    const carInput = document.getElementById("editCarregamento");
    const btnSalvar = document.getElementById("btnSalvarVeiculo");
    const btnCancelar = document.getElementById("btnCancelarEdicao");

    anoInput.addEventListener("input", () => {
      anoInput.value = anoInput.value.replace(/\D/g, "").slice(0, 4);
    });

    placaInput.addEventListener("input", () => {
      let valor = placaInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (valor.length > 3) valor = valor.slice(0, 3) + "-" + valor.slice(3, 7);
      placaInput.value = valor.slice(0, 8);
    });

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

    btnSalvar.addEventListener("click", () => {
      if (anoInput.value.length !== 4) {
        mostrarMensagem("❌ O ano deve ter 4 dígitos.", "erro");
        return;
      }
      if (placaInput.value.length !== 8) {
        mostrarMensagem("❌ A placa deve estar no formato AAA-0000.", "erro");
        return;
      }

      localStorage.setItem(`veiculoModelo_${usuarioEmail}`, document.getElementById("editModelo").value);
      localStorage.setItem(`veiculoAno_${usuarioEmail}`, anoInput.value);
      localStorage.setItem(`veiculoPlaca_${usuarioEmail}`, placaInput.value);
      localStorage.setItem(`veiculoBateria_${usuarioEmail}`, batInput.value.endsWith("kWh") ? batInput.value : batInput.value + " kWh");
      localStorage.setItem(`veiculoCarregamento_${usuarioEmail}`, carInput.value.endsWith("kW") ? carInput.value : carInput.value + " kW");

      renderVeiculo();
      mostrarMensagem("✅ Veículo atualizado com sucesso!", "sucesso");
    });

    btnCancelar.addEventListener("click", () => {
      renderVeiculo();
      mostrarMensagem("Edição de veículo cancelada.", "aviso");
    });
  }

  // ================================
  // Foto: Upload / Remover
  // ================================
  if (btnUploadFoto && inputFoto) {
    btnUploadFoto.addEventListener("click", () => inputFoto.click());

    inputFoto.addEventListener("change", (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        fotoUsuario.src = dataUrl;
        btnUploadFoto.style.display = "none";
        if (btnRemoverFoto) btnRemoverFoto.style.display = "none";

        let confirmBox = document.getElementById("fotoConfirmBox");
        if (!confirmBox) {
          confirmBox = document.createElement("div");
          confirmBox.id = "fotoConfirmBox";
          confirmBox.style.marginTop = "10px";
          confirmBox.innerHTML = `
            <button id="btnSalvarFoto" class="btn-salvar-inline">Salvar</button>
            <button id="btnCancelarFoto" class="btn-cancelar-inline">Cancelar</button>
          `;
          fotoUsuario.parentElement.appendChild(confirmBox);
        }

        document.getElementById("btnSalvarFoto").onclick = () => {
          userData.photo = dataUrl;
          localStorage.setItem("usuarioFoto", dataUrl);
          persistirUsers(); atualizarSidebar();
          confirmBox.remove();
          btnUploadFoto.style.display = "inline-block";
          if (btnRemoverFoto) btnRemoverFoto.style.display = "inline-block";
          // popup ao salvar foto
          mostrarMensagem("✅ Foto atualizada com sucesso!", "sucesso");
        };

        document.getElementById("btnCancelarFoto").onclick = () => {
          renderFoto();
          confirmBox.remove();
          btnUploadFoto.style.display = "inline-block";
          if (btnRemoverFoto) btnRemoverFoto.style.display = "inline-block";
          // popup ao cancelar alteração
          mostrarMensagem("Alteração de foto cancelada.", "aviso");
        };
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnRemoverFoto) {
    btnRemoverFoto.addEventListener("click", () => {
      btnUploadFoto.style.display = "none";
      btnRemoverFoto.style.display = "none";
      let confirmBox = document.getElementById("fotoConfirmBox");
      if (!confirmBox) {
        confirmBox = document.createElement("div");
        confirmBox.id = "fotoConfirmBox";
        confirmBox.style.marginTop = "10px";
        confirmBox.innerHTML = `
          <p style="margin-bottom:5px;">Remover foto?</p>
          <button id="btnConfirmarRemover" class="btn-salvar-inline">Remover</button>
          <button id="btnCancelarRemover" class="btn-cancelar-inline">Cancelar</button>
        `;
        fotoUsuario.parentElement.appendChild(confirmBox);
      }

      document.getElementById("btnConfirmarRemover").onclick = () => {
        userData.photo = "";
        localStorage.removeItem("usuarioFoto");
        persistirUsers(); renderFoto(); atualizarSidebar();
        confirmBox.remove();
        btnUploadFoto.style.display = "inline-block";
        btnRemoverFoto.style.display = "inline-block";
        // popup ao confirmar remoção
        mostrarMensagem("✅ Foto removida com sucesso!", "sucesso");
      };

      document.getElementById("btnCancelarRemover").onclick = () => {
        confirmBox.remove();
        btnUploadFoto.style.display = "inline-block";
        btnRemoverFoto.style.display = "inline-block";
        // popup ao cancelar remoção
        mostrarMensagem("Remoção de foto cancelada.", "aviso");
      };
    });
  }

  // Inicializações
  renderFoto();
  renderPerfil();
  renderVeiculo();
  atualizarSidebar();
});


