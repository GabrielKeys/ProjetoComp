// perfilEstacao.js
document.addEventListener("DOMContentLoaded", () => {
  // ---------- helpers ----------
  function safeGetJSON(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  }
  function namesEqual(a, b) {
    if (!a || !b) return false;
    return a.toString().trim().toLowerCase() === b.toString().trim().toLowerCase();
  }
  function showMessage(text, tipo = "aviso") {
    if (typeof mostrarMensagem === "function") {
      mostrarMensagem(text, tipo);
      return;
    }
    // fallback simples
    const el = document.createElement("div");
    el.textContent = text;
    el.style.position = "fixed";
    el.style.right = "20px";
    el.style.top = "20px";
    el.style.padding = "10px 14px";
    el.style.zIndex = 9999;
    el.style.borderRadius = "8px";
    el.style.color = "#fff";
    el.style.background = tipo === "sucesso" ? "#27ae60" : tipo === "erro" ? "#e74c3c" : "#f39c12";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
  function applyPhoneMask(input) {
    if (!input) return;
    input.addEventListener("input", () => {
      let v = input.value.replace(/\D/g, "").slice(0, 11);
      if (v.length <= 2) input.value = v;
      else if (v.length <= 6) input.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
      else if (v.length <= 10) input.value = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
      else input.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    });
  }
  function formatBRLFromDigits(digits) {
    if (!digits) digits = "0";
    // remove leading zeros
    digits = digits.replace(/^0+(?=\d)/, "");
    const num = (parseInt(digits, 10) || 0) / 100;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  }
  function extractDigitsFromBRL(formatted) {
    return (formatted || "").replace(/\D/g, "") || "0";
  }

  // ---------- carregar estação atual ----------
  // tenta várias fontes
  const estacaoSelecionadaObj = safeGetJSON("estacaoSelecionada");
  const fallbackEmail1 = localStorage.getItem("estacaoEmail");
  const fallbackEmail2 = localStorage.getItem("usuarioEmail");
  const fallbackKeyUser = localStorage.getItem("usuario"); // às vezes são nomes

  let stations = JSON.parse(localStorage.getItem("stations")) || [];

  // função para localizar índice
  function findStationIndex() {
    // prefer estacaoSelecionada object
    if (estacaoSelecionadaObj && (estacaoSelecionadaObj.email || estacaoSelecionadaObj.nome)) {
      const e = estacaoSelecionadaObj.email;
      const n = estacaoSelecionadaObj.nome || estacaoSelecionadaObj.name;
      let idx = -1;
      if (e) idx = stations.findIndex(s => (s.email || "").toLowerCase() === (e || "").toLowerCase());
      if (idx === -1 && n) idx = stations.findIndex(s => namesEqual(s.nome || s.name, n));
      if (idx !== -1) return idx;
    }

    // fallback por estacaoEmail ou usuarioEmail
    const email = (fallbackEmail1 || fallbackEmail2 || "").toLowerCase();
    if (email) {
      const idx = stations.findIndex(s => (s.email || "").toLowerCase() === email);
      if (idx !== -1) return idx;
    }

    // fallback por nome igual ao "usuario" (quando foi salvo nome da estação em usuario)
    if (fallbackKeyUser) {
      const idx = stations.findIndex(s => namesEqual(s.nome || s.name, fallbackKeyUser));
      if (idx !== -1) return idx;
    }

    // nada encontrado
    return -1;
  }

  let stationIndex = findStationIndex();
  let stationData;

  if (stationIndex === -1) {
    // não encontrada: tenta criar entry mínima a partir de estacaoSelecionadaObj ou dados fallback
    const emailCandidate = estacaoSelecionadaObj?.email || fallbackEmail1 || fallbackEmail2 || "";
    const nomeCandidate = estacaoSelecionadaObj?.nome || estacaoSelecionadaObj?.name || fallbackKeyUser || "";
    stationData = {
      nome: nomeCandidate || "",
      email: emailCandidate || "",
      telefone: estacaoSelecionadaObj?.telefone || "",
      potencia: estacaoSelecionadaObj?.potencia || "",
      preco: estacaoSelecionadaObj?.preco || "",
      abertura: estacaoSelecionadaObj?.abertura || "",
      fechamento: estacaoSelecionadaObj?.fechamento || "",
      photo: localStorage.getItem("estacaoFoto") || "",
    };
    stations.push(stationData);
    stationIndex = stations.length - 1;
    localStorage.setItem("stations", JSON.stringify(stations));
  } else {
    stationData = stations[stationIndex];
    const fotoLS = localStorage.getItem("estacaoFoto");
    if (fotoLS && (!stationData.photo || stationData.photo !== fotoLS)) {
      stationData.photo = fotoLS;
      stations[stationIndex] = stationData;
      localStorage.setItem("stations", JSON.stringify(stations));
    }
  }

  // elementos (compatível com HTML do usuário)
  const containerDetalhes = document.getElementById("userDetalhes") || document.getElementById("estacaoDetalhes");
  const fotoEl = document.getElementById("fotoUsuario") || document.getElementById("fotoEstacao");
  const btnUploadFoto = document.getElementById("btnUploadFoto");
  const inputFoto = document.getElementById("inputFoto");
  const btnRemoverFoto = document.getElementById("btnRemoverFoto");

  function persistirStations() {
    stations[stationIndex] = stationData;
    localStorage.setItem("stations", JSON.stringify(stations));
    // se havia estacaoSelecionada, atualiza também
    try {
      const sel = safeGetJSON("estacaoSelecionada");
      if (sel && (sel.email || sel.nome)) {
        // se os emails/nome baterem atualiza estacaoSelecionada
        if ((sel.email && stationData.email && sel.email.toLowerCase() === stationData.email.toLowerCase()) ||
            (sel.nome && namesEqual(sel.nome, stationData.nome))) {
          localStorage.setItem("estacaoSelecionada", JSON.stringify(stationData));
        }
      }
    } catch (e) {}
  }

  function updateSidebarNameAndPhoto() {
    // tenta atualizar elementos do sidebar (mesma estrutura do perfil usuário)
    const fotoSide = document.querySelector("#nomeUsuario .user-photo img");
    const nomeSide = document.querySelector("#nomeUsuario .user-name");
    const foto = stationData.photo || "../assets/foto.png";
    const nome = stationData.nome || stationData.email || "Estação";
    if (fotoSide) fotoSide.src = foto;
    if (nomeSide) nomeSide.textContent = nome;
    // guarda também em localStorage para uso global
    localStorage.setItem("usuario", nome);
    if (stationData.email) localStorage.setItem("usuarioEmail", stationData.email);
    if (stationData.photo) localStorage.setItem("estacaoFoto", stationData.photo);
  }

  function renderFoto() {
    if (!fotoEl) return;
    fotoEl.src = stationData.photo || "../assets/foto.png";
  }

  // ---------- Render perfil (HTML dinamicamente) ----------
  function renderPerfilEstacao() {
    if (!containerDetalhes) return;

    // garante valores default
    const potenciaDisplay = stationData.potencia ? stationData.potencia : "-- kW";
    const precoDisplay = stationData.preco ? stationData.preco : "R$ 0,00";
    const abertura = stationData.abertura || "--";
    const fechamento = stationData.fechamento || "--";

    containerDetalhes.innerHTML = `
      <div class="vehicle-fields">
        <div class="field-row">
          <label>Nome:</label>
          <span id="nomeSpan">${stationData.nome || "---"}</span>
          <button class="icon-edit" id="editNomeBtn"><img src="../assets/icone-editar.png" alt="editar" width="18"></button>
        </div>

        <div class="field-row">
          <label>Email:</label>
          <span style="color:gray;">${stationData.email || "----"}</span>
        </div>

        <div class="field-row">
          <label>Telefone:</label>
          <span id="telefoneSpan">${stationData.telefone || "(--) ---------"}</span>
          <button class="icon-edit" id="editTelefoneBtn"><img src="../assets/icone-editar.png" alt="editar" width="18"></button>
        </div>

        <div class="field-row">
          <label>Potência:</label>
          <span id="potenciaSpan">${potenciaDisplay}</span>
          <button class="icon-edit" id="editPotenciaBtn"><img src="../assets/icone-editar.png" alt="editar" width="18"></button>
        </div>

        <div class="field-row">
          <label>Preço (R$/kWh):</label>
          <span id="precoSpan">${precoDisplay}</span>
          <button class="icon-edit" id="editPrecoBtn"><img src="../assets/icone-editar.png" alt="editar" width="18"></button>
        </div>

        <div class="field-row">
          <label>Horário:</label>
          <span id="horarioSpan">${abertura} - ${fechamento}</span>
          <button class="icon-edit" id="editHorarioBtn"><img src="../assets/icone-editar.png" alt="editar" width="18"></button>
        </div>
      </div>
    `;

    // ---------- listeners inline ----------
    // Nome
    const editNomeBtn = document.getElementById("editNomeBtn");
    if (editNomeBtn) {
      editNomeBtn.addEventListener("click", () => {
        const span = document.getElementById("nomeSpan");
        span.outerHTML = `
          <input type="text" id="editNome" value="${stationData.nome || ""}">
          <button id="salvarNome" class="btn-salvar-inline">Salvar</button>
          <button id="cancelarNome" class="btn-cancelar-inline">Cancelar</button>
        `;
        document.getElementById("salvarNome").onclick = () => {
          stationData.nome = document.getElementById("editNome").value.trim();
          persistirStations(); renderPerfilEstacao(); updateSidebarNameAndPhoto();
          showMessage("✅ Nome atualizado!", "sucesso");
        };
        document.getElementById("cancelarNome").onclick = () => {
          renderPerfilEstacao();
          showMessage("Edição de nome cancelada.", "aviso");
        };
      });
    }

    // Telefone
    const editTelefoneBtn = document.getElementById("editTelefoneBtn");
    if (editTelefoneBtn) {
      editTelefoneBtn.addEventListener("click", () => {
        const span = document.getElementById("telefoneSpan");
        span.outerHTML = `
          <input type="text" id="editTelefone" value="${stationData.telefone || ""}">
          <button id="salvarTel" class="btn-salvar-inline">Salvar</button>
          <button id="cancelarTel" class="btn-cancelar-inline">Cancelar</button>
        `;
        applyPhoneMask(document.getElementById("editTelefone"));
        document.getElementById("salvarTel").onclick = () => {
          stationData.telefone = document.getElementById("editTelefone").value.trim();
          persistirStations(); renderPerfilEstacao();
          showMessage("✅ Telefone atualizado!", "sucesso");
        };
        document.getElementById("cancelarTel").onclick = () => {
          renderPerfilEstacao();
          showMessage("Edição de telefone cancelada.", "aviso");
        };
      });
    }

    // Potência (kW)
    const editPotenciaBtn = document.getElementById("editPotenciaBtn");
    if (editPotenciaBtn) {
      editPotenciaBtn.addEventListener("click", () => {
        const span = document.getElementById("potenciaSpan");
        // pré-popula sem sufixo
        const initial = (stationData.potencia || "").toString().replace(/\s?kW$/i, "");
        span.outerHTML = `
          <input type="text" id="editPotencia" value="${initial}">
          <button id="salvarPotencia" class="btn-salvar-inline">Salvar</button>
          <button id="cancelarPotencia" class="btn-cancelar-inline">Cancelar</button>
        `;
        const editPot = document.getElementById("editPotencia");
        // permite só dígitos e vírgula/ponto
        editPot.addEventListener("input", () => {
          editPot.value = editPot.value.replace(/[^0-9,\.]/g, "");
        });
        document.getElementById("salvarPotencia").onclick = () => {
          let val = document.getElementById("editPotencia").value.trim();
          if (val) {
            // troca vírgula por ponto e remove múltiplos pontos
            val = val.replace(",", ".").replace(/\.{2,}/g, ".");
            // se for número, mantém com sufixo kW
            const n = parseFloat(val);
            if (!isNaN(n) && n >= 0) {
              // remove trailing zeros inúteis e exibe com até 2 decimais se necessário
              stationData.potencia = (Number.isInteger(n) ? n.toString() : n.toString()) + " kW";
            } else {
              stationData.potencia = val + " kW"; // mesmo assim salva o texto digitado + kW
            }
          } else {
            stationData.potencia = "";
          }
          persistirStations(); renderPerfilEstacao();
          showMessage("✅ Potência atualizada!", "sucesso");
        };
        document.getElementById("cancelarPotencia").onclick = () => {
          renderPerfilEstacao();
          showMessage("Edição de potência cancelada.", "aviso");
        };
      });
    }

    // Preço (R$)
    const editPrecoBtn = document.getElementById("editPrecoBtn");
    if (editPrecoBtn) {
      editPrecoBtn.addEventListener("click", () => {
        const span = document.getElementById("precoSpan");
        // extrai dígitos para prefilling (centavos)
        const initialDigits = extractDigitsFromBRL(stationData.preco);
        span.outerHTML = `
          <input type="text" id="editPreco" value="${formatBRLFromDigits(initialDigits)}">
          <button id="salvarPreco" class="btn-salvar-inline">Salvar</button>
          <button id="cancelarPreco" class="btn-cancelar-inline">Cancelar</button>
        `;
        const editPreco = document.getElementById("editPreco");
        // mantém formato tipo máscara (só números lógicos)
        editPreco.addEventListener("input", () => {
          let digits = (editPreco.value || "").replace(/\D/g, "");
          if (!digits) digits = "0";
          // limita tamanho razoável
          if (digits.length > 12) digits = digits.slice(-12);
          editPreco.value = formatBRLFromDigits(digits);
        });
        document.getElementById("salvarPreco").onclick = () => {
          const digits = (document.getElementById("editPreco").value || "").replace(/\D/g, "") || "0";
          const formatted = formatBRLFromDigits(digits);
          stationData.preco = formatted;
          persistirStations(); renderPerfilEstacao();
          showMessage("✅ Preço atualizado!", "sucesso");
        };
        document.getElementById("cancelarPreco").onclick = () => {
          renderPerfilEstacao();
          showMessage("Edição de preço cancelada.", "aviso");
        };
      });
    }

    // Horário (abertura/fechamento)
    const editHorarioBtn = document.getElementById("editHorarioBtn");
    if (editHorarioBtn) {
      editHorarioBtn.addEventListener("click", () => {
        const span = document.getElementById("horarioSpan");
        span.outerHTML = `
          <input type="time" id="editAbertura" value="${stationData.abertura || ""}">
          <input type="time" id="editFechamento" value="${stationData.fechamento || ""}">
          <button id="salvarHorario" class="btn-salvar-inline">Salvar</button>
          <button id="cancelarHorario" class="btn-cancelar-inline">Cancelar</button>
        `;
        document.getElementById("salvarHorario").onclick = () => {
          stationData.abertura = document.getElementById("editAbertura").value || "";
          stationData.fechamento = document.getElementById("editFechamento").value || "";
          persistirStations(); renderPerfilEstacao();
          showMessage("✅ Horário atualizado!", "sucesso");
        };
        document.getElementById("cancelarHorario").onclick = () => {
          renderPerfilEstacao();
          showMessage("Edição de horário cancelada.", "aviso");
        };
      });
    }
  } // end renderPerfilEstacao

  // ---------- Foto (upload / remover) ----------
  if (btnUploadFoto && inputFoto) {
    btnUploadFoto.addEventListener("click", () => inputFoto.click());
    inputFoto.addEventListener("change", (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        if (fotoEl) fotoEl.src = dataUrl;
        stationData.photo = dataUrl;
        localStorage.setItem("estacaoFoto", dataUrl);
        persistirStations();
        updateSidebarNameAndPhoto();
        showMessage("✅ Foto da estação atualizada!", "sucesso");
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnRemoverFoto) {
    btnRemoverFoto.addEventListener("click", () => {
      stationData.photo = "";
      localStorage.removeItem("estacaoFoto");
      persistirStations();
      renderFoto();
      updateSidebarNameAndPhoto();
      showMessage("✅ Foto removida.", "sucesso");
    });
  }

  // inicializa UI
  renderFoto();
  renderPerfilEstacao();
  updateSidebarNameAndPhoto();
});

