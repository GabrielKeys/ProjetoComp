// ==========================================
// PERFIL ESTAÇÃO - integração com backend
// ==========================================
const API_BASE = "http://localhost:4000";

// ------------------------------------------
// Mensagens flutuantes reutilizáveis
// ------------------------------------------
function showMessage(text, tipo = "aviso") {
  const el = document.createElement("div");
  el.textContent = text;
  el.style.position = "fixed";
  el.style.right = "20px";
  el.style.top = "20px";
  el.style.padding = "10px 14px";
  el.style.zIndex = 9999;
  el.style.borderRadius = "8px";
  el.style.color = "#fff";
  el.style.background =
    tipo === "sucesso" ? "#27ae60" :
    tipo === "erro" ? "#e74c3c" :
    "#f39c12";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function formatBRL(num) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num || 0);
}

// ------------------------------------------
// Carregar estação do backend
// ------------------------------------------
async function carregarEstacao() {
  const email = localStorage.getItem("usuarioEmail");
  if (!email) return showMessage("Nenhuma estação logada", "erro");

  try {
    const res = await fetch(`${API_BASE}/stations/${email}`);
    if (!res.ok) throw new Error("Erro ao buscar dados");
    const estacao = await res.json();
    renderCampos(estacao);
  } catch (err) {
    console.error("❌ Erro ao carregar:", err);
    showMessage("Erro ao carregar dados da estação", "erro");
  }
}

// ------------------------------------------
// Renderizar campos
// ------------------------------------------
function renderCampos(estacao) {
  const container = document.getElementById("estacaoDetalhes");
  container.innerHTML = `
    <div class="field-row"><label>Email:</label><span>${estacao.email || "---"}</span></div>
    <div class="field-row"><label>Usuário:</label><span id="usuarioSpan">${estacao.full_name || "---"}</span><button class="icon-edit" id="editUsuarioBtn"><img src="../assets/icone-editar.png" width="18"></button></div>
    <div class="field-row"><label>Local:</label><span id="nomeSpan">${estacao.name || "---"}</span><button class="icon-edit" id="editNomeBtn"><img src="../assets/icone-editar.png" width="18"></button></div>
    <div class="field-row"><label>Telefone:</label><span id="telefoneSpan">${typeof formatarTelefone === "function" ? formatarTelefone(estacao.phone) : estacao.phone || "(--) ---------"}</span><button class="icon-edit" id="editTelefoneBtn"><img src="../assets/icone-editar.png" width="18"></button></div>
    <div class="field-row"><label>Potência:</label><span id="potenciaSpan">${estacao.power || "--"} kW</span><button class="icon-edit" id="editPotenciaBtn"><img src="../assets/icone-editar.png" width="18"></button></div>
    <div class="field-row"><label>Preço (R$/kWh):</label><span id="precoSpan">${formatBRL(estacao.price)}</span><button class="icon-edit" id="editPrecoBtn"><img src="../assets/icone-editar.png" width="18"></button></div>
    <div class="field-row"><label>Horário:</label><span id="horarioSpan">${estacao.open_time || "--"} - ${estacao.close_time || "--"}</span><button class="icon-edit" id="editHorarioBtn"><img src="../assets/icone-editar.png" width="18"></button></div>
  `;

  const linhaSenha = document.createElement("div");
  linhaSenha.classList.add("field-row");
  linhaSenha.innerHTML = `
    <label>Senha:</label>
    <span id="senhaSpan">********</span>
    <button class="icon-edit" id="editSenhaBtn"><img src="../assets/icone-editar.png" width="18"></button>
  `;
  container.appendChild(linhaSenha);

  addEditListeners(estacao);
}

// ------------------------------------------
// Edição reutilizando funções do login.js
// ------------------------------------------
function addEditListeners(estacao) {
  document.getElementById("editUsuarioBtn")?.addEventListener("click", () => editarCampoTexto(estacao, "full_name", "usuarioSpan", "Usuário"));
  document.getElementById("editNomeBtn")?.addEventListener("click", () => editarCampoTexto(estacao, "name", "nomeSpan", "Local"));
  document.getElementById("editTelefoneBtn")?.addEventListener("click", () => editarTelefone(estacao));
  document.getElementById("editPotenciaBtn")?.addEventListener("click", () => editarCampoNumero(estacao, "power", "potenciaSpan", "Potência (kW)"));
  document.getElementById("editPrecoBtn")?.addEventListener("click", () => editarCampoNumero(estacao, "price", "precoSpan", "Preço (R$/kWh)"));
  document.getElementById("editHorarioBtn")?.addEventListener("click", () => editarHorario(estacao));
  document.getElementById("editSenhaBtn")?.addEventListener("click", () => editarSenha(estacao));
}

// --------------------------------------
// Edição de texto genérica
// --------------------------------------
function editarCampoTexto(estacao, campo, spanId, label) {
  document.querySelectorAll(".icon-edit").forEach(btn => btn.style.display = "none");

  const span = document.getElementById(spanId);
  span.outerHTML = `
    <input type="text" id="input${campo}" value="${estacao[campo] || ""}">
    <button id="salvar${campo}" class="btn-salvar-inline">Salvar</button>
    <button id="cancelar${campo}" class="btn-cancelar-inline">Cancelar</button>`;

  document.getElementById(`salvar${campo}`).onclick = async () => {
    estacao[campo] = document.getElementById(`input${campo}`).value.trim();
    await salvarNoBackend(estacao);
  };
  document.getElementById(`cancelar${campo}`).onclick = () => renderCampos(estacao);
}

// ==========================================
// MÁSCARA DE TELEFONE (igual ao login.js)
// ==========================================
function aplicarMascaraTelefone(input) {
  if (!input) return;

  function rawDigitsFrom(str) {
    return (str || "").replace(/\D/g, "");
  }

  function formatarTelefoneLive(valor) {
    if (valor.length < 3) return valor; // Não mostra "(" antes de 3 dígitos
    if (valor.length < 7) return `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
    return `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7, 11)}`;
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      const pos = input.selectionStart;
      const val = input.value;

      if (pos > 0 && /[\s\-\(\)]/.test(val[pos - 1])) {
        e.preventDefault();
        let raw = rawDigitsFrom(val);
        if (raw.length > 0) raw = raw.slice(0, -1);
        input.value = formatarTelefoneLive(raw);
        input.setSelectionRange(pos - 1, pos - 1);
      }
    }
  });

  input.addEventListener("input", () => {
    let raw = rawDigitsFrom(input.value);
    if (raw.length > 11) raw = raw.slice(0, 11);
    input.value = formatarTelefoneLive(raw);
  });
}


// ==========================================
// EDITAR TELEFONE (reutilizando formatarTelefone global)
// ==========================================
function editarTelefone(estacao) {
  // esconde outros botões de editar (mesmo comportamento do perfil do usuário)
  document.querySelectorAll(".icon-edit").forEach(btn => btn.style.display = "none");

  const span = document.getElementById("telefoneSpan");
  // usa a sua função global formatarTelefone (se existir) para pré-preencher
  const valorPreenchido = (typeof formatarTelefone === "function" && estacao.phone)
    ? formatarTelefone(estacao.phone)
    : (estacao.phone || "");

  span.outerHTML = `
    <input type="text" id="editTelefone" value="${valorPreenchido}">
    <button id="salvarTel" class="btn-salvar-inline">Salvar</button>
    <button id="cancelarTel" class="btn-cancelar-inline">Cancelar</button>
    <p id="msgTel" style="margin-left:10px;"></p>
  `;

  const inputTel = document.getElementById("editTelefone");
  aplicarMascaraTelefone(inputTel); // aplica máscara dinâmica igual ao login.js

  document.getElementById("salvarTel").onclick = async () => {
    const valorFormatado = inputTel.value.trim();
    const numeroLimpo = valorFormatado.replace(/\D/g, "");

    // aceita 10 (fixo) ou 11 (celular com 9 dígitos). Ajuste se quiser forçar 11.
    if (numeroLimpo.length !== 10 && numeroLimpo.length !== 11) {
      document.getElementById("msgTel").innerText = "❌ Número inválido (esperado DDD + 8/9 dígitos).";
      document.getElementById("msgTel").style.color = "red";
      return;
    }

    estacao.phone = numeroLimpo;
    await salvarNoBackend(estacao);
  };

  document.getElementById("cancelarTel").onclick = () => renderCampos(estacao);
}
// --------------------------------------
// Edição de campos numéricos
// --------------------------------------
function editarCampoNumero(estacao, campo, spanId, label) {
  document.querySelectorAll(".icon-edit").forEach(btn => btn.style.display = "none");

  const span = document.getElementById(spanId);

  // ==========================
  // Caso seja o campo de preço
  // ==========================
  if (campo === "price") {
    span.outerHTML = `
      <input type="text" id="input${campo}" value="${formatBRL(estacao[campo] || 0)}" style="width:120px;">
      <button id="salvar${campo}" class="btn-salvar-inline">Salvar</button>
      <button id="cancelar${campo}" class="btn-cancelar-inline">Cancelar</button>
    `;

    const input = document.getElementById(`input${campo}`);
    input.addEventListener("input", () => {
      let valor = input.value.replace(/\D/g, "");
      if (!valor) valor = "0";
      valor = (parseInt(valor, 10) / 100).toFixed(2);
      input.value = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(valor);
    });

    document.getElementById(`salvar${campo}`).onclick = async () => {
      const valorStr = input.value.replace(/[^\d,]/g, "").replace(",", ".");
      const valor = parseFloat(valorStr);
      if (isNaN(valor)) {
        showMessage("❌ Valor inválido.", "erro");
        return;
      }
      estacao[campo] = valor;
      await salvarNoBackend(estacao);
    };

    document.getElementById(`cancelar${campo}`).onclick = () => renderCampos(estacao);
    return;
  }

  // ==========================
  // Caso seja o campo de potência
  // ==========================
  if (campo === "power") {
    span.outerHTML = `
      <input type="text" id="input${campo}" value="${estacao[campo] ? estacao[campo] + ' kW' : ''}" style="width:100px;">
      <button id="salvar${campo}" class="btn-salvar-inline">Salvar</button>
      <button id="cancelar${campo}" class="btn-cancelar-inline">Cancelar</button>
    `;

    const input = document.getElementById(`input${campo}`);

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

    configurarCampoNumeroComSufixo(input, "kW");

    document.getElementById(`salvar${campo}`).onclick = async () => {
      const valorStr = input.value.replace(/[^\d,]/g, "").replace(",", ".");
      const valor = parseFloat(valorStr);
      if (isNaN(valor)) {
        showMessage("❌ Valor inválido.", "erro");
        return;
      }
      estacao[campo] = valor;
      await salvarNoBackend(estacao);
    };

    document.getElementById(`cancelar${campo}`).onclick = () => renderCampos(estacao);
    return;
  }

  // ==========================
  // Caso padrão (outros numéricos)
  // ==========================
  span.outerHTML = `
    <input type="number" step="0.01" id="input${campo}" value="${estacao[campo] || ""}">
    <button id="salvar${campo}" class="btn-salvar-inline">Salvar</button>
    <button id="cancelar${campo}" class="btn-cancelar-inline">Cancelar</button>
  `;

  document.getElementById(`salvar${campo}`).onclick = async () => {
    const valor = parseFloat(document.getElementById(`input${campo}`).value);
    if (isNaN(valor)) {
      showMessage("❌ Valor inválido.", "erro");
      return;
    }
    estacao[campo] = valor;
    await salvarNoBackend(estacao);
  };

  document.getElementById(`cancelar${campo}`).onclick = () => renderCampos(estacao);
}


// ------------------------------------------
// Editar horário
// ------------------------------------------
function editarHorario(estacao) {
  const span = document.getElementById("horarioSpan");
  span.outerHTML = `
    <input type="time" id="inputAbertura" value="${estacao.open_time || ""}">
    <input type="time" id="inputFechamento" value="${estacao.close_time || ""}">
    <button id="salvarHorario" class="btn-salvar-inline">Salvar</button>
    <button id="cancelarHorario" class="btn-cancelar-inline">Cancelar</button>
  `;
  document.getElementById("salvarHorario").onclick = async () => {
    estacao.open_time = document.getElementById("inputAbertura").value;
    estacao.close_time = document.getElementById("inputFechamento").value;
    await salvarNoBackend(estacao);
  };
  document.getElementById("cancelarHorario").onclick = () => renderCampos(estacao);
}

// ------------------------------------------
// Editar senha
// ------------------------------------------
function editarSenha(estacao) {
  const span = document.getElementById("senhaSpan");
  span.outerHTML = `
    <input type="password" id="senhaAtual" placeholder="Senha Atual">
    <input type="password" id="novaSenha" placeholder="Nova Senha">
    <button id="salvarSenha" class="btn-salvar-inline">Salvar</button>
    <button id="cancelarSenha" class="btn-cancelar-inline">Cancelar</button>
    <p id="perfilMsg" style="margin-left:10px;"></p>
  `;
  document.getElementById("salvarSenha").onclick = async () => {
    const atual = document.getElementById("senhaAtual").value;
    const nova = document.getElementById("novaSenha").value;
    const msg = document.getElementById("perfilMsg");

    if (estacao.password && atual !== estacao.password) {
      msg.innerText = "❌ Senha atual incorreta.";
      msg.style.color = "red";
      return;
    }
    if (nova.length < 8) {
      msg.innerText = "❌ A nova senha deve ter pelo menos 8 caracteres.";
      msg.style.color = "red";
      return;
    }

    estacao.password = nova;
    await salvarNoBackend(estacao);
    msg.innerText = "✅ Senha atualizada!";
    msg.style.color = "green";
    setTimeout(() => renderCampos(estacao), 1000);
  };
  document.getElementById("cancelarSenha").onclick = () => renderCampos(estacao);
}

// ------------------------------------------
// Salvar no backend
// ------------------------------------------
async function salvarNoBackend(estacao) {
  try {
    const res = await fetch(`${API_BASE}/stations/${estacao.email}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(estacao),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Falha ao salvar");
    showMessage("✅ Dados atualizados!", "sucesso");
    renderCampos(estacao);
  } catch (err) {
    console.error("❌ Erro ao salvar:", err);
    showMessage("Erro ao salvar", "erro");
  }
}

// ------------------------------------------
// Upload / remover foto
// ------------------------------------------
async function salvarFotoEstacao(file) {
  const email = localStorage.getItem("usuarioEmail");
  if (!email || !file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result;
    try {
      const res = await fetch(`${API_BASE}/stations/${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: base64 }),
      });
      if (!res.ok) throw new Error("Falha no upload");
      document.getElementById("fotoEstacao").src = base64;
      showMessage("✅ Foto atualizada!", "sucesso");
    } catch (err) {
      console.error("❌ Erro ao enviar foto:", err);
      showMessage("Erro ao salvar foto", "erro");
    }
  };
  reader.readAsDataURL(file);
}

// ------------------------------------------
// Inicialização
// ------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  carregarEstacao();

  const btnUpload = document.getElementById("btnUploadFotoEstacao");
  const inputFoto = document.getElementById("inputFotoEstacao");
  const btnRemover = document.getElementById("btnRemoverFotoEstacao");

  if (btnUpload && inputFoto) btnUpload.addEventListener("click", () => inputFoto.click());
  if (inputFoto) inputFoto.addEventListener("change", (e) => salvarFotoEstacao(e.target.files[0]));
  if (btnRemover)
    btnRemover.addEventListener("click", async () => {
      const email = localStorage.getItem("usuarioEmail");
      if (!email) return;
      await fetch(`${API_BASE}/stations/${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: null }),
      });
      document.getElementById("fotoEstacao").src = "../assets/foto.png";
      showMessage("✅ Foto removida!", "sucesso");
    });
});
