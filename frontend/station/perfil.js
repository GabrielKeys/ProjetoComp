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
    } catch (e) { }
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
          <label>Email:</label>
          <span style="color:gray;">${stationData.email || "----"}</span>
        </div>

        <div class="field-row">
          <label>Nome:</label>
          <span id="nomeSpan">${stationData.nome || "---"}</span>
          <button class="icon-edit" id="editNomeBtn"><img src="../assets/icone-editar.png" alt="editar" width="18"></button>
        </div>

        <div class="field-row">
          <label>Telefone:</label>
          <span id="telefoneSpan">${stationData.telefone ? formatarTelefone(stationData.telefone) : "(--) ---------"}</span>
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

      <div class="field-row">
          <label>Senha:</label>
          <span id="senhaSpan">********</span>
          <button class="icon-edit" id="editSenhaBtn">
            <img src="../assets/icone-editar.png" alt="editar" width="18">
          </button>
        </div>
    `;

    // ---------- listeners inline ----------
    function toggleEditButtons(hide = true) {
      document.querySelectorAll(".btn-editar-inline").forEach(btn => {
        btn.style.display = hide ? "none" : "";
      });
    }

    // Nome
    const editNomeBtn = document.getElementById("editNomeBtn");
    if (editNomeBtn) {
      editNomeBtn.addEventListener("click", () => {

        document.querySelectorAll(".icon-edit").forEach(btn => btn.style.display = "none");

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

    editTelefoneBtn.style.display = "none";

    const span = document.getElementById("telefoneSpan");
    span.outerHTML = `
      <input type="text" id="editTelefone" value="${stationData.telefone ? formatarTelefone(stationData.telefone) : ""}" maxlength="15" autocomplete="tel">
      <button id="salvarTel" class="btn-salvar-inline">Salvar</button>
      <button id="cancelarTel" class="btn-cancelar-inline">Cancelar</button>
    `;

    const editTelefone = document.getElementById("editTelefone");

    function rawDigitsFrom(str) {
      return (str || "").replace(/\D/g, "");
    }

    function formatarTelefoneLive(valor) {
      if (valor.length < 3) return valor; // Sem formatação até 2 dígitos
      if (valor.length < 7) return `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
      return `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7, 11)}`;
    }

    editTelefone.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        const pos = editTelefone.selectionStart;
        const val = editTelefone.value;

        if (pos > 0 && /[\s\-\(\)]/.test(val[pos - 1])) {
          e.preventDefault();
          let raw = rawDigitsFrom(val);
          if (raw.length > 0) raw = raw.slice(0, -1);
          editTelefone.value = formatarTelefoneLive(raw);
          editTelefone.setSelectionRange(pos - 1, pos - 1);
        }
      }
    });

    editTelefone.addEventListener("input", () => {
      let raw = rawDigitsFrom(editTelefone.value);
      if (raw.length > 11) raw = raw.slice(0, 11);
      editTelefone.value = formatarTelefoneLive(raw);
    });

    document.getElementById("salvarTel").onclick = () => {
      const valor = rawDigitsFrom(editTelefone.value);
      if (valor.length !== 11) {
        showMessage("❌ Formato do telefone inválido. Deve ter DDD + 9 dígitos.", "erro");
        return;
      }
      stationData.telefone = valor;
      persistirStations();
      renderPerfilEstacao();
      showMessage("✅ Telefone atualizado!", "sucesso");
      editTelefoneBtn.style.display = "";
    };

    document.getElementById("cancelarTel").onclick = () => {
      renderPerfilEstacao();
      showMessage("Edição de telefone cancelada.", "aviso");
      editTelefoneBtn.style.display = "";
    };
  });
}


    // Potência (kW)
    const editPotenciaBtn = document.getElementById("editPotenciaBtn");
    if (editPotenciaBtn) {
      editPotenciaBtn.addEventListener("click", () => {

        editPotenciaBtn.style.display = "none";

        const span = document.getElementById("potenciaSpan");
        const initial = (stationData.potencia || "").toString().replace(/\s?kW$/i, "");

        span.outerHTML = `
      <input type="text" id="editPotencia" value="${initial}">
      <button id="salvarPotencia" class="btn-salvar-inline">Salvar</button>
      <button id="cancelarPotencia" class="btn-cancelar-inline">Cancelar</button>
    `;

        const editPot = document.getElementById("editPotencia");
        editPot.addEventListener("input", () => {
          editPot.value = editPot.value.replace(/[^0-9,\.]/g, "");
        });

        const finalizarEdicao = (cancelado = false) => {
          if (!cancelado) {
            let val = editPot.value.trim();
            if (val) {
              val = val.replace(",", ".").replace(/\.{2,}/g, ".");
              const n = parseFloat(val);
              stationData.potencia = (!isNaN(n) && n >= 0 ? n : val) + " kW";
            } else {
              stationData.potencia = "";
            }
            persistirStations();
          }

          renderPerfilEstacao();
          showMessage(cancelado ? "Edição de potência cancelada." : "✅ Potência atualizada!", cancelado ? "aviso" : "sucesso");
          editPotenciaBtn.style.display = "";
        };

        document.getElementById("salvarPotencia").onclick = () => finalizarEdicao(false);
        document.getElementById("cancelarPotencia").onclick = () => finalizarEdicao(true);
      });
    }


    // Preço (R$)
    const editPrecoBtn = document.getElementById("editPrecoBtn");
    if (editPrecoBtn) {
      editPrecoBtn.addEventListener("click", () => {

        editPrecoBtn.style.display = "none";

        const span = document.getElementById("precoSpan");
        const initialDigits = extractDigitsFromBRL(stationData.preco || "");

        span.outerHTML = `
      <input type="text" id="editPreco" value="${formatBRLFromDigits(initialDigits)}">
      <button id="salvarPreco" class="btn-salvar-inline">Salvar</button>
      <button id="cancelarPreco" class="btn-cancelar-inline">Cancelar</button>
    `;

        const editPreco = document.getElementById("editPreco");

        editPreco.addEventListener("input", () => {
          let digits = (editPreco.value || "").replace(/\D/g, "") || "0";
          digits = digits.slice(0, 12); // Limita a 12 dígitos
          editPreco.value = formatBRLFromDigits(digits);
        });

        const finalizarEdicao = (cancelado = false) => {
          if (!cancelado) {
            const digits = (editPreco.value || "").replace(/\D/g, "") || "0";
            stationData.preco = formatBRLFromDigits(digits);
            persistirStations();
          }

          renderPerfilEstacao();
          showMessage(cancelado ? "Edição de preço cancelada." : "✅ Preço atualizado!", cancelado ? "aviso" : "sucesso");
          editPrecoBtn.style.display = ""; // 🔹 Reexibe SEMPRE
        };

        document.getElementById("salvarPreco").onclick = () => finalizarEdicao(false);
        document.getElementById("cancelarPreco").onclick = () => finalizarEdicao(true);

      });
    }



    // Horário (abertura/fechamento)
    const editHorarioBtn = document.getElementById("editHorarioBtn");
    if (editHorarioBtn) {
      editHorarioBtn.addEventListener("click", () => {

        editHorarioBtn.style.display = "none";

        const span = document.getElementById("horarioSpan");
        span.outerHTML = `
      <input type="time" id="editAbertura" value="${stationData.abertura || ""}">
      <input type="time" id="editFechamento" value="${stationData.fechamento || ""}">
      <button id="salvarHorario" class="btn-salvar-inline">Salvar</button>
      <button id="cancelarHorario" class="btn-cancelar-inline">Cancelar</button>
    `;

        const finalizarEdicao = (cancelado = false) => {
          if (!cancelado) {
            stationData.abertura = document.getElementById("editAbertura").value || "";
            stationData.fechamento = document.getElementById("editFechamento").value || "";
            persistirStations();
          }

          renderPerfilEstacao();
          showMessage(cancelado ? "Edição de horário cancelada." : "✅ Horário atualizado!", cancelado ? "aviso" : "sucesso");
          editHorarioBtn.style.display = "";
        };

        document.getElementById("salvarHorario").onclick = () => finalizarEdicao(false);
        document.getElementById("cancelarHorario").onclick = () => finalizarEdicao(true);

      });
    }

    // Editar Senha
    const editSenhaBtn = document.getElementById("editSenhaBtn");
    if (editSenhaBtn) {
      editSenhaBtn.addEventListener("click", () => {

        document.querySelectorAll(".icon-edit").forEach(btn => btn.style.display = "none");

        const span = document.getElementById("senhaSpan");
        span.outerHTML = `
      <input type="password" id="senhaAtual" placeholder="Senha Atual">
      <input type="password" id="novaSenha" placeholder="Nova Senha">
      <button id="salvarSenha" class="btn-salvar-inline">Salvar</button>
      <button id="cancelarSenha" class="btn-cancelar-inline">Cancelar</button>
      <p id="perfilMsg" style="margin-left:10px;"></p>
    `;

        document.getElementById("salvarSenha").onclick = () => {
          const atual = document.getElementById("senhaAtual").value;
          const nova = document.getElementById("novaSenha").value;
          const msg = document.getElementById("perfilMsg");

          const senhaAtualEstacao = stationData.password || "";

          if (senhaAtualEstacao && atual !== senhaAtualEstacao) {
            msg.innerText = "❌ Senha atual incorreta.";
            msg.style.color = "red";
            return;
          }
          if (nova.length < 8) {
            msg.innerText = "❌ A nova senha deve ter pelo menos 8 caracteres.";
            msg.style.color = "red";
            return;
          }

          // Atualiza e salva
          stationData.password = nova;
          persistirStations();
          showMessage("✅ Senha atualizada!", "sucesso");
          setTimeout(renderPerfilEstacao, 1000);
        };

        document.getElementById("cancelarSenha").onclick = () => {
          renderPerfilEstacao();
          showMessage("Edição de senha cancelada.", "aviso");
        };
      });
    }

  }

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

