// ======================================
// perfil.js (versão integrada com backend)
// ======================================
document.addEventListener("DOMContentLoaded", async () => {
  const usuarioEmail = localStorage.getItem("usuarioEmail") || localStorage.getItem("usuario");
  if (!usuarioEmail) return;

  let userData = null;

  // ======================================
  // Carregar dados do usuário do banco
  // ======================================
  async function carregarUsuario() {
    try {
      const res = await fetch(`${API_BASE}/users`);
      const lista = await res.json();
      userData = lista.find(u => u.email === usuarioEmail);

      if (!userData) {
        // se não existir no banco, cria registro básico
        const novoUser = {
          email: usuarioEmail,
          full_name: localStorage.getItem("usuario") || "",
          phone: "",
          password: "",
          photo_url: localStorage.getItem("usuarioFoto") || ""
        };
        const addRes = await fetch(`${API_BASE}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novoUser)
        });
        userData = await addRes.json();
      }

      renderPerfil();
      renderFoto();
      atualizarSidebar();
    } catch (err) {
      console.error("❌ Erro ao carregar usuário:", err);
    }
  }

  // ======================================
  // Sistema de mensagens
  // ======================================
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

  // ======================================
  // Atualizar no banco
  // ======================================
  async function salvarUsuarioAtualizado() {
    try {
      const { email, full_name, phone, password, photo_url } = userData;
      const res = await fetch(`${API_BASE}/users/${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name, phone, password, photo_url })
      });
      const data = await res.json();
      console.log("✅ Dados atualizados:", data);
    } catch (err) {
      console.error("❌ Erro ao atualizar usuário:", err);
    }
  }


  // ======================================
  // Atualizar UI
  // ======================================
  function atualizarSidebar() {
    const foto = userData.photo_url || "../assets/foto.png";
    const nome = userData.full_name || userData.email;

    const fotoEl = document.querySelector("#nomeUsuario .user-photo img");
    const nomeEl = document.querySelector("#nomeUsuario .user-name");

    if (fotoEl) fotoEl.src = foto;
    if (nomeEl) nomeEl.textContent = nome;

    localStorage.setItem("usuario", nome);
    localStorage.setItem("usuarioFoto", foto);
  }

  function renderFoto() {
    const fotoUsuario = document.getElementById("fotoUsuario");
    if (fotoUsuario) fotoUsuario.src = userData.photo_url || "../assets/foto.png";
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

  // ======================================
  // Renderizar perfil
  // ======================================
  async function renderPerfil() {
    const userDetalhes = document.getElementById("userDetalhes");
    if (!userDetalhes) return;

    userDetalhes.innerHTML = `
      <div class="vehicle-fields">
        <div class="field-row">
          <label>Email:</label>
          <span style="color:gray;">${userData.email}</span>
        </div>
        <div class="field-row">
          <label>Nome:</label>
          <span id="nomeSpan">${userData.full_name || "---"}</span>
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

    // Editar nome
    document.getElementById("editNomeBtn").onclick = () => {
      document.querySelectorAll(".icon-edit").forEach(btn => btn.style.display = "none");
      const span = document.getElementById("nomeSpan");
      span.outerHTML = `
        <input type="text" id="editNome" value="${userData.full_name || ""}">
        <button id="salvarNome" class="btn-salvar-inline">Salvar</button>
        <button id="cancelarNome" class="btn-cancelar-inline">Cancelar</button>`;
      document.getElementById("salvarNome").onclick = async () => {
        userData.full_name = document.getElementById("editNome").value.trim();
        await salvarUsuarioAtualizado();
        atualizarSidebar(); renderPerfil();
        mostrarMensagem("✅ Nome atualizado!", "sucesso");
      };
      document.getElementById("cancelarNome").onclick = renderPerfil;
    };

    // Editar telefone
    document.getElementById("editTelefoneBtn").onclick = () => {
      document.querySelectorAll(".icon-edit").forEach(btn => btn.style.display = "none");
      const span = document.getElementById("telefoneSpan");
      span.outerHTML = `
        <input type="text" id="editTelefone" value="${userData.phone || ""}">
        <button id="salvarTel" class="btn-salvar-inline">Salvar</button>
        <button id="cancelarTel" class="btn-cancelar-inline">Cancelar</button>`;
      aplicarMascaraTelefone(document.getElementById("editTelefone"));
      document.getElementById("salvarTel").onclick = async () => {
        userData.phone = document.getElementById("editTelefone").value.trim();
        await salvarUsuarioAtualizado();
        atualizarSidebar(); renderPerfil();
        mostrarMensagem("✅ Telefone atualizado!", "sucesso");
      };
      document.getElementById("cancelarTel").onclick = renderPerfil;
    };

    // Editar senha
    document.getElementById("editSenhaBtn").onclick = () => {
      document.querySelectorAll(".icon-edit").forEach(btn => btn.style.display = "none");
      const span = document.getElementById("senhaSpan");
      span.outerHTML = `
        <input type="password" id="senhaAtual" placeholder="Senha Atual">
        <input type="password" id="novaSenha" placeholder="Nova Senha">
        <button id="salvarSenha" class="btn-salvar-inline">Salvar</button>
        <button id="cancelarSenha" class="btn-cancelar-inline">Cancelar</button>
        <p id="perfilMsg" style="margin-left:10px;"></p>`;
      document.getElementById("salvarSenha").onclick = async () => {
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
        await salvarUsuarioAtualizado();
        mostrarMensagem("✅ Senha atualizada!", "sucesso");
        setTimeout(renderPerfil, 1000);
      };
      document.getElementById("cancelarSenha").onclick = renderPerfil;
    };
  }

  // Inicializa
  await carregarUsuario();


  // ================================
  // Veículo
  // ================================
  if (usuarioEmail && typeof carregarVeiculoDoBanco === "function") {
    const veiculoContainer = document.getElementById("veiculoDetalhes");
    carregarVeiculoDoBanco(usuarioEmail, veiculoContainer);
  }

// ================================
// Foto: Upload / Remover (com backend)
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

      const btnSalvar = document.querySelector("#btnSalvarFoto");
      const btnCancelar = document.querySelector("#btnCancelarFoto");

      // Salvar foto
      if (btnSalvar) {
        btnSalvar.onclick = async () => {
          try {
            const res = await fetch(`${API_BASE}/users/${userData.email}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ photo_url: dataUrl }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Erro ao salvar foto");

            // Atualiza localmente
            userData.photo_url = dataUrl;
            localStorage.setItem("usuarioFoto", dataUrl);
            atualizarSidebar();

            confirmBox.remove();
            btnUploadFoto.style.display = "inline-block";
            if (btnRemoverFoto) btnRemoverFoto.style.display = "inline-block";
            mostrarMensagem("✅ Foto atualizada com sucesso!", "sucesso");
          } catch (err) {
            console.error("❌ Erro ao salvar foto:", err);
            mostrarMensagem("Erro ao atualizar foto no servidor.", "erro");
          }
        };
      }

      // Cancelar alteração
      if (btnCancelar) {
        btnCancelar.onclick = () => {
          renderFoto();
          confirmBox.remove();
          btnUploadFoto.style.display = "inline-block";
          if (btnRemoverFoto) btnRemoverFoto.style.display = "inline-block";
          mostrarMensagem("Alteração de foto cancelada.", "aviso");
        };
      }
    };

    reader.readAsDataURL(file);
  });
}

// ================================
// Remover foto
// ================================
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

    const btnConfirmar = document.querySelector("#btnConfirmarRemover");
    const btnCancelar = document.querySelector("#btnCancelarRemover");

    // Confirmar remoção
    if (btnConfirmar) {
      btnConfirmar.onclick = async () => {
        try {
          const res = await fetch(`${API_BASE}/users/${userData.email}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photo_url: null }),
          });

          const result = await res.json();
          if (!res.ok) throw new Error(result.error || "Erro ao remover foto");

          // Atualiza localmente
          userData.photo_url = "";
          localStorage.removeItem("usuarioFoto");
          renderFoto();
          atualizarSidebar();

          confirmBox.remove();
          btnUploadFoto.style.display = "inline-block";
          btnRemoverFoto.style.display = "inline-block";
          mostrarMensagem("✅ Foto removida com sucesso!", "sucesso");
        } catch (err) {
          console.error("❌ Erro ao remover foto:", err);
          mostrarMensagem("Erro ao remover foto no servidor.", "erro");
        }
      };
    }

    // Cancelar remoção
    if (btnCancelar) {
      btnCancelar.onclick = () => {
        confirmBox.remove();
        btnUploadFoto.style.display = "inline-block";
        btnRemoverFoto.style.display = "inline-block";
        mostrarMensagem("Remoção de foto cancelada.", "aviso");
      };
    }
  });
}

// ================================
// Inicializações
// ================================
renderFoto();
renderPerfil();
atualizarSidebar();

});


