// ====================================
// reserva.js (estação)
// ====================================

let reservasCache = []; // cache global de reservas
let reservaIndexParaCancelar = null; // índice global da reserva a cancelar

// ---------------------------
// Util: Safe JSON parse
// ---------------------------
function safeJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    return null;
  }
}

// ---------------------------
// Normaliza formatos vindos do backend
// ---------------------------
function normalizeReserva(r) {
  if (!r) return null;
  return {
    // identificador 
    id: r.id || r._id || r.reservaId || null,

    // usuário
    usuario_nome: r.usuario_nome || r.usuario || r.userName || r.usuarioName || r.nome || "",
    usuario_email: r.usuario_email || r.usuarioEmail || r.usuario || r.userEmail || "",

    // estação
    estacao_email: r.estacao_email || r.estacaoEmail || r.estacao || "",
    estacao_nome: r.estacao_nome || r.estacaoNome || r.estacao || "",

    // datas/horários 
    data: r.data || r.date || r.dataReserva || "",
    hora: r.hora || r.hora_inicio || r.inicio || r.start || "",
    inicio: r.inicio || r.hora || r.hora_inicio || r.start || "",
    fim: r.fim || r.hora_fim || r.end || r.finish || "",
    hora_inicio: r.hora_inicio || r.inicio || r.hora || "",
    hora_fim: r.hora_fim || r.fim || r.hora || "",

    // status
    status: (r.status || r.situacao || "pendente").toString(),

    // veiculo 
    veiculo: (() => {
      if (r.veiculo && typeof r.veiculo === "object") {
        return {
          modelo: r.veiculo.modelo || r.veiculo.modelo || r.veiculo_modelo || "",
          ano: r.veiculo.ano || r.veiculo.ano || r.veiculo_ano || "",
          placa: r.veiculo.placa || r.veiculo.placa || r.veiculo_placa || "",
          bateria: r.veiculo.bateria || r.veiculo.bateria || r.veiculo_bateria || "",
          carga: r.veiculo.carga || r.veiculo.carga || r.veiculo_carga || "",
          telefone: r.veiculo.telefone || r.veiculo.telefone || r.veiculo_telefone || ""
        };
      }
      // fallback para campos soltos no objeto reserva
      return {
        modelo: r.veiculo_modelo || r.veiculoModelo || r.modelo || "",
        ano: r.veiculo_ano || r.veiculoAno || r.ano || "",
        placa: r.veiculo_placa || r.placa || "",
        bateria: r.veiculo_bateria || r.bateria || r.bat || "",
        carga: r.veiculo_carga || r.carga || r.carregamento || "",
        telefone: r.veiculo_telefone || r.usuario_telefone || r.usuarioTelefone || ""
      };
    })(),

    // telefone do usuário (se vier isolado)
    usuario_telefone: r.usuario_telefone || r.usuarioTelefone || r.telefone || r.usuario_telefone || ""
  };
}

// ---------------------------
// Backend-aware carregar reservas (agora atualiza reservasCache)
// ---------------------------
async function carregarReservasEstacao(force = false) {
  const emailEstacao = (localStorage.getItem("usuarioEmail") || "").toLowerCase();
  if (!emailEstacao) return [];

  // usa cache se já tiver e não pediu force
  if (reservasCache.length > 0 && !force) {
    console.log("📦 Usando reservasEstacao cache:", reservasCache.length);
    return reservasCache;
  }

  try {
    const res = await fetch(`${API_BASE}/reservas/estacao/${encodeURIComponent(emailEstacao)}`);
    if (!res.ok) {
      console.warn("Falha buscando reservas do backend:", res.status);
      return reservasCache; // devolve o que tiver
    }
    const data = await res.json();
    const mapped = (Array.isArray(data) ? data : []).map(normalizeReserva);
    reservasCache = mapped; // <- atualiza cache global
    console.log("✅ reservasCache atualizado via carregarReservasEstacao:", reservasCache.length);
    return reservasCache;
  } catch (e) {
    console.warn("Falha ao buscar reservas do backend:", e);
    return reservasCache;
  }
}


// ---------------------------
// Exibição do Nome do Usuário
// ---------------------------
function resolveNomeUsuario(r) {
  if (!r) return "Usuário Desconhecido";
  if (r.usuario_nome) return r.usuario_nome;
  if (r.usuario) return r.usuario;
  const email = (r.usuario_email || r.usuarioEmail || r.usuario || "").toLowerCase();
  if (email) {
    const users = safeJSON("users") || [];
    const u = users.find(x => (x.email || "").toLowerCase() === email);
    if (u) return u.fullName || u.email;
    return email;
  }
  return "Usuário Desconhecido";
}


// ---------------------------
// Exibição das informações do veiculo 
// ---------------------------
function getVeiculoForReservation(r) {
  if (r && r.veiculo && typeof r.veiculo === "object") {
    return {
      modelo: r.veiculo.modelo || r.veiculo_modelo || "",
      ano: r.veiculo.ano || r.veiculo_ano || "",
      placa: r.veiculo.placa || r.veiculo_placa || "",
      bateria: r.veiculo.bateria || r.veiculo_bateria || "",
      carga: r.veiculo.carga || r.veiculo_carga || "",
      telefone: r.veiculo.telefone || r.veiculo_telefone || r.usuario_telefone || r.usuario_telefone || ""
    };
  }

  if (r) {
    const possible = {
      modelo: r.veiculo_modelo || r.modelo || "",
      ano: r.veiculo_ano || r.ano || "",
      placa: r.veiculo_placa || r.placa || "",
      bateria: r.veiculo_bateria || r.bateria || "",
      carga: r.veiculo_carga || r.carga || r.carregamento || "",
      telefone: r.usuario_telefone || r.usuarioTelefone || r.veiculo_telefone || ""
    };
    if (possible.modelo || possible.placa || possible.telefone) return possible;
  }

}

// ---------------------------
// Renderiza reservas na dashboard da estação 
// ---------------------------
function renderizarReservasEstacao() {
  carregarReservasEstacao().then(reservas => {
    const textoReserva = document.getElementById("textoReserva");
    const lista = document.getElementById("listaReservas");
    const btnDetalhes = document.getElementById("btnDetalhesReserva");

    if (!textoReserva || !lista || !btnDetalhes) return;

    lista.innerHTML = "";

    if (!reservas || reservas.length === 0) {
      textoReserva.innerText = "Nenhuma reserva agendada.";
      btnDetalhes.style.display = "none";
      return;
    }

    const prox = reservas[0];
    const nomeProx = resolveNomeUsuario(prox);
    textoReserva.innerHTML = `
      <strong>Usuário:</strong> ${nomeProx}<br>
      <strong>Data:</strong> ${prox.data || prox.date || "--"}<br>
      <strong>Hora:</strong> ${prox.inicio || prox.hora || "--:--"} - ${prox.fim || prox.hora_fim || "--:--"}<br>
      <strong>Status:</strong> ${prox.status || "pendente"}
    `;

    reservas.forEach(r => {
      const div = document.createElement("div");
      div.classList.add("reserva-item");

  if (r.id) div.setAttribute("data-reserva-id", r.id);

      const nome = resolveNomeUsuario(r);
      const data = r.data || r.date || "--";
      const inicio = r.inicio || r.hora || r.hora_inicio || "--:--";
      const fim = r.fim || r.hora_fim || "--:--";
      const status = r.status || "pendente";

      div.innerHTML = `
        <p><strong>Usuário:</strong> ${nome}</p>
        <p><strong>Data:</strong> ${data}</p>
        <p><strong>Hora:</strong> ${inicio} - ${fim}</p>
        <p><strong>Status:</strong> <span class="reserva-status ${status}">${status}</span></p>
      `;

      lista.appendChild(div);
    });

    btnDetalhes.style.display = "block";
  }).catch(err => {
    console.error("Erro em renderizarReservasEstacao:", err);
  });
}


// ====================================
// Atualiza o status da reserva no backend (versão compatível com seu servidor atual)
// ====================================
async function atualizarStatusReservaBackend(estacaoEmail, usuarioEmail, data, hora, novoStatus) {
  try {
    // tenta obter a reserva pelo e-mail da estação
    const resBusca = await fetch(`${API_BASE}/reservas/estacao/${encodeURIComponent(estacaoEmail)}`);
    if (!resBusca.ok) throw new Error("Falha ao buscar reservas");
    const reservas = await resBusca.json();

    // procura a reserva correspondente
    const reserva = reservas.find(r =>
      (r.usuario_email === usuarioEmail || r.usuario === usuarioEmail) &&
      r.data === data &&
      (r.hora === hora || r.inicio === hora)
    );

    if (!reserva || !reserva.id) {
      console.warn("⚠️ Reserva não encontrada para atualizar status.");
      return false;
    }

    // atualiza no backend via ID
    const res = await fetch(`${API_BASE}/reservas/${reserva.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus })
    });

    if (!res.ok) {
      console.warn("❌ Falha ao atualizar status no backend:", res.status);
      return false;
    }

    const dataRes = await res.json();
    console.log("✅ Status atualizado no backend:", dataRes);
    return true;
  } catch (err) {
    console.error("❌ Erro em atualizarStatusReservaBackend:", err);
    return false;
  }
}

// ================================================
// ✅ Atualizar status da reserva (confirmação)
// ================================================
async function atualizarStatusReservaEstacao(idReserva, novoStatus) {
  try {
    if (!idReserva) {
      console.warn("⚠️ atualizarStatusReservaEstacao: idReserva inválido");
      return false;
    }

    console.log("📤 Enviando atualização de status para o backend...");
    const resp = await fetch(`${API_BASE}/reservas/${idReserva}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });

    console.log("🌐 PUT /reservas/:id/status =>", resp.status);

    if (!resp.ok) throw new Error("Falha ao atualizar reserva no backend");

    const data = await resp.json();
    console.log("✅ Status atualizado com sucesso no backend:", data);

    // 🔁 Atualiza cache local (se existir)
    if (Array.isArray(reservasCache)) {
      const item = reservasCache.find(r => String(r.id) === String(idReserva));
      if (item) item.status = novoStatus;
    }

    // 🎨 Atualiza o status visual na tela
    const statusEls = document.querySelectorAll(`[data-reserva-id="${idReserva}"] .reserva-status`);
    statusEls.forEach(el => {
      el.textContent = novoStatus;
      el.classList.remove("pendente", "confirmada", "cancelada");
      el.classList.add(novoStatus);
      el.style.transition = "background-color 0.3s";
      el.style.backgroundColor = "#c8f7c5"; // verde claro
      setTimeout(() => (el.style.backgroundColor = ""), 400);
    });

    console.log("🖥️ UI atualizada automaticamente.");

    return true;
  } catch (error) {
    console.error("❌ Erro ao atualizar status no backend:", error);
    return false;
  }
}


// ---------------------------
// Modais, formulários e detalhes 
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  // inicial render
  renderizarReservasEstacao();

  // Detalhes/confirm modal - elementos
  const btnDetalhes = document.getElementById("btnDetalhesReserva");
  const modalDetalhes = document.getElementById("detalhesReservaModal");
  const listaDetalhes = document.getElementById("listaDetalhesReservas");
  const closeBtn = modalDetalhes ? modalDetalhes.querySelector(".close") : null;
  const confirmarModal = document.getElementById("confirmarCancelamentoModal");
  const btnConfirmar = document.getElementById("btnCancelarConfirmar");
  const btnFechar = document.getElementById("btnCancelarFechar");
  const btnRemoverCanceladas = document.getElementById("btnRemoverCanceladas");
  let reservaIndexParaCancelar = null;

  // formatar telefone 
  function formatarTelefone(t) {
    if (!t) return "";
    return t.toString();
  }

  function formatDuracao(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h > 0 ? h + "h" : ""}${h > 0 && m > 0 ? " " : ""}${m > 0 ? m + "min" : ""}`.trim() || "0min";
  }

  // render detalhes 
  async function renderizarDetalhes() {
    try {
      const reservas = await carregarReservasEstacao();
      reservasCache = reservas; // ✅ atualiza o cache global com as reservas atuais
      console.log("💾 reservasCache atualizado via renderizarDetalhes:", reservasCache.length);

      if (!listaDetalhes) return;
      listaDetalhes.innerHTML = "";

      if (!reservas || reservas.length === 0) {
        listaDetalhes.innerHTML = "<li>Nenhuma reserva encontrada.</li>";
        return;
      }

      reservas.forEach((r, idx) => {
        const li = document.createElement("li");
        li.className = "reserva-item-li";

        const linhaNome = document.createElement("div");
        linhaNome.className = "reserva-linha-nome";
        linhaNome.innerHTML = `<strong>Usuário:</strong> ${resolveNomeUsuario(r)}`;
        li.appendChild(linhaNome);

        const linhaAcoes = document.createElement("div");
        linhaAcoes.className = "reserva-linha-acoes";
        linhaAcoes.style.display = "flex";
        linhaAcoes.style.alignItems = "center";
        linhaAcoes.style.gap = "8px";
        linhaAcoes.style.marginTop = "6px";

        const btnConfirma = document.createElement("button");
        btnConfirma.className = "btn-confirmar-reserva";
        btnConfirma.textContent = "Confirmar";

        if (r.status === "cancelada" || r.status === "confirmada") {
          btnConfirma.disabled = true;
          btnConfirma.style.opacity = "0.5";
        } else {
          btnConfirma.addEventListener("click", async () => {
            const usuarioEmail = r.usuario_email || r.usuarioEmail || r.usuario || "";
            const estacaoKey = localStorage.getItem("usuarioEmail") || "";
            const okBackend = await atualizarStatusReservaBackend(estacaoKey, usuarioEmail, r.data, r.inicio || r.hora, "confirmada");

            // ✅ chamada correta com o ID da reserva
            if (r.id) {
              await atualizarStatusReservaEstacao(r.id, "confirmada");
            }
            atualizarStatusReservaEstacao(estacaoKey, usuarioEmail, r.data, r.inicio || r.hora, "confirmada");
            renderizarReservasEstacao();
            await renderizarDetalhes();
            if (okBackend) {
              if (typeof mostrarMensagem === "function") mostrarMensagem("Reserva confirmada (backend).", "sucesso");
            } else {
              if (typeof mostrarMensagem === "function") mostrarMensagem("Reserva confirmada (offline).", "info");
            }
          });
        }

        const btnCancelar = document.createElement("button");
        btnCancelar.className = "btn-cancelar-reserva";
        btnCancelar.textContent = "Cancelar";

        if (r.status === "cancelada") {
          btnCancelar.disabled = true;
          btnCancelar.style.opacity = "0.5";
        } else {
          btnCancelar.addEventListener("click", () => {
            window.reservaIndexParaCancelar = idx; // ✅ usa window para manter acessível globalmente
            if (confirmarModal) confirmarModal.style.display = "flex";
            console.log("🟢 Reserva selecionada para cancelamento:", idx);
          });

        }

        const statusSpan = document.createElement("span");
        statusSpan.className = "reserva-status";
        statusSpan.textContent = r.status || "pendente";
        statusSpan.style.marginLeft = "auto";

        linhaAcoes.appendChild(btnConfirma);
        linhaAcoes.appendChild(btnCancelar);
        linhaAcoes.appendChild(statusSpan);

        li.appendChild(linhaAcoes);

        const detalhes = document.createElement("div");
        detalhes.className = "detalhes-reserva";

        // formata horário/duração 
        let horarioFormatado = "--";
        try {
          if (r.inicio && r.fim) {
            const toMin = s => {
              if (!s) return 0;
              const [hh, mm] = (s + "").split(":").map(Number);
              return hh * 60 + (isNaN(mm) ? 0 : mm);
            };
            let dur = toMin(r.fim) - toMin(r.inicio);
            if (dur < 0) dur += 24 * 60;
            horarioFormatado = `${r.inicio} - ${r.fim} (${formatDuracao(dur)})`;
          } else if (typeof r.duracaoMin === "number") {
            const inicio = r.hora || r.inicio || "00:00";
            const inicioMin = (() => { const [h, m] = inicio.split(":").map(Number); return h * 60 + (m || 0); })();
            const fimMin = inicioMin + Number(r.duracaoMin);
            const hh = Math.floor(fimMin / 60) % 24; const mm = fimMin % 60;
            const fimHora = String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
            horarioFormatado = `${inicio} - ${fimHora} (${formatDuracao(r.duracaoMin)})`;
          } else if (r.hora || r.inicio) {
            const inicio = r.hora || r.inicio;
            const [h, m] = (inicio + "").split(":").map(Number);
            const fimHora = String((h + 1) % 24).padStart(2, "0") + ":" + String(m || 0).padStart(2, "0");
            horarioFormatado = `${inicio} - ${fimHora} (1h)`;
          } else {
            horarioFormatado = r.hora || r.inicio || "--";
          }
        } catch (err) {
          horarioFormatado = r.hora || r.inicio || "--";
        }

        // detalhes do veículo
        const veiculo = getVeiculoForReservation(r) || null;

        // telefone preferencial: veiculo.telefone -> usuario_telefone -> usuarioTelefone -> usuarioTelefone in localStorage
        const telefoneExibir = (veiculo && veiculo.telefone) || r.usuario_telefone || r.usuarioTelefone || "";

        detalhes.innerHTML = `
          <p><strong>Data:</strong> ${r.data || "--"}</p>
          <p><strong>Horário:</strong> ${horarioFormatado}</p>
          <p><strong>Status:</strong> ${r.status || "pendente"}</p>
          ${veiculo ? `
            <p><strong>Veículo:</strong> ${veiculo.modelo || "----"} (${veiculo.ano || "----"})</p>
            <p><strong>Placa:</strong> ${veiculo.placa || "----"}</p>
            <p><strong>Bateria:</strong> ${veiculo.bateria ? veiculo.bateria + " kWh" : "----"}</p>
            <p><strong>Carga:</strong> ${veiculo.carga ? veiculo.carga + " kW" : "----"}</p>

          ` : ""}
          <p><strong>Telefone:</strong> ${telefoneExibir ? formatarTelefone(telefoneExibir) : "(sem telefone cadastrado)"}</p>
        `;

        li.appendChild(detalhes);
        listaDetalhes.appendChild(li);
      });
    } catch (err) {
      console.error("Erro em renderizarDetalhes:", err);
      if (listaDetalhes) listaDetalhes.innerHTML = "<li>Erro ao carregar detalhes.</li>";
    }

  }


  // confirmar cancelamento (modal)
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", async () => {
      console.log("🟡 Botão Confirmar Cancelamento clicado!");

      // índice (pode ser global ou local, depende do seu código)
      console.log("🔢 window.reservaIndexParaCancelar:", window.reservaIndexParaCancelar);

      try {
        // 1) Verifica cache completo
        console.log("📚 reservasCache (length):", Array.isArray(reservasCache) ? reservasCache.length : reservasCache);
      } catch (err) {
        console.warn("⚠️ Erro ao ler reservasCache:", err);
      }

      if (window.reservaIndexParaCancelar === null || window.reservaIndexParaCancelar === undefined) {
        console.warn("⚠️ reservaIndexParaCancelar está nulo/undefined — nada a cancelar.");
        if (confirmarModal) confirmarModal.style.display = "none";
        return;
      }

      const idx = Number(window.reservaIndexParaCancelar);
      console.log("🔎 Índice usado:", idx);

      // 2) Pega a reserva do cache
      const r = Array.isArray(reservasCache) ? reservasCache[idx] : undefined;
      console.log("📘 Reserva selecionada (r):", r);

      if (!r) {
        console.error("❌ Reserva não encontrada no reservasCache. Possíveis causas: cache não preenchido ou índice incorreto.");
        // Ajuda rápida: tentar recarregar reservas do backend para popular o cache
        try {
          console.log("⏳ Tentando recarregar reservas do backend para popular reservasCache...");
          const email = localStorage.getItem("usuarioEmail");
          if (email && typeof API_BASE !== "undefined") {
            const resp = await fetch(`${API_BASE}/reservas/estacao/${encodeURIComponent(email)}`);
            console.log("🌐 fetch /reservas response status:", resp.status);
            if (resp.ok) {
              const fetched = await resp.json();
              reservasCache = Array.isArray(fetched) ? fetched.map(item => ({
                id: item.id || null,
                data: item.data || item.date || "",
                inicio: item.inicio || item.hora || "",
                fim: item.fim || "",
                hora: item.inicio || item.hora || "",
                duracaoMin: item.duracao_minutos ?? item.duracaoMin ?? item.duracao_min ?? 0,
                estacao: item.estacao_name || item.estacao || item.estacao_nome || item.estacao_email || "",
                estacaoEmail: item.estacao_email || item.estacaoEmail || null,
                usuarioEmail: item.usuario_email || item.usuarioEmail || "",
                status: item.status || "pendente",
                __raw: item
              })) : [];
              console.log("✅ reservasCache recarregado (length):", reservasCache.length);
            } else {
              const text = await resp.text();
              console.warn("⚠️ fetch retornou não-ok. body:", text);
            }
          } else {
            console.warn("⚠️ Não foi possível recarregar: email ou API_BASE ausente.");
          }
        } catch (e) {
          console.error("❌ Erro ao tentar recarregar reservas do backend:", e);
        }

        // após recarregar, tenta novamente localizar
        const r2 = Array.isArray(reservasCache) ? reservasCache[idx] : undefined;
        console.log("🔁 Reserva após recarregamento:", r2);
        if (!r2) {
          if (confirmarModal) confirmarModal.style.display = "none";
          return;
        }
      }

      // se chegou até aqui, r existe
      const reserva = Array.isArray(reservasCache) ? reservasCache[idx] : null;
      console.log("✅ Reserva válida encontrada:", reserva);

      // 3) Log antes da chamada ao backend
      console.log("📤 Preparando PUT para atualizar status no backend:", {
        url: `${API_BASE}/reservas/${reserva.id}/status`,
        body: { status: "cancelada" }
      });

      // 4) Chamada ao backend com tratamento explícito de erros
      try {
        if (reserva && reserva.id) {
          const resposta = await fetch(`${API_BASE}/reservas/${reserva.id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "cancelada" })
          });

          console.log("🌐 fetch PUT status:", resposta.status);

          // tenta ler como texto se não for JSON válido
          const text = await resposta.text();
          let parsed;
          try {
            parsed = text ? JSON.parse(text) : null;
          } catch (parseErr) {
            console.warn("⚠️ Resposta do backend não é JSON válido. Conteúdo:", text);
          }

          console.log("📦 Conteúdo da resposta:", parsed ?? text);

          if (!resposta.ok) {
            console.error("❌ Backend respondeu com erro ao atualizar status:", resposta.status, parsed ?? text);
          } else {
            console.log("✅ Backend atualizou status com sucesso:", parsed);
          }
        } else {
          console.warn("⚠️ Reserva sem ID — pulando atualização no backend.");
        }
      } catch (e) {
        console.error("❌ Erro na fetch de atualização:", e);
      }

      // 5) Continua com o fluxo local (atualizações locais e UI)
      try {
        // atualiza localmente nos indices que você já possui (ex.: reservasGlobais, reservasEstacao)
        const rLocal = reserva;
        if (rLocal) {
          rLocal.status = "cancelada";
          console.log("🔁 Atualizando localmente status da reserva para 'cancelada' (cache).");
        }
        // executar suas rotinas de atualização/refresh aqui:
        if (typeof renderizarReservas === "function") await renderizarReservas();
        if (typeof renderizarDetalhes === "function") await renderizarDetalhes();
      } catch (e) {
        console.error("❌ Erro ao atualizar UI/local:", e);
      }

      // finaliza
      window.reservaIndexParaCancelar = null;
      if (confirmarModal) confirmarModal.style.display = "none";
      console.log("🏁 Fluxo de cancelamento finalizado.");
    });
  }

  if (btnFechar) {
    btnFechar.addEventListener("click", () => {
      if (confirmarModal) confirmarModal.style.display = "none";
      reservaIndexParaCancelar = null;
    });
  }

// ============================================================
// Remover reservas canceladas (banco + local) — lado da estação
// ============================================================
if (btnRemoverCanceladas) {
  btnRemoverCanceladas.addEventListener("click", async () => {
    const estacaoEmail = localStorage.getItem("usuarioEmail");
    if (!estacaoEmail) {
      console.error("⚠️ Nenhum e-mail de estação encontrado.");
      return;
    }

    btnRemoverCanceladas.disabled = true;

    try {
      // 1️⃣ Remover no backend
      const resp = await fetch(`${API_BASE}/reservas/estacao/limpar-canceladas/${encodeURIComponent(estacaoEmail)}`, {
        method: "DELETE",
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || data.message || "Erro ao remover no backend");

      console.log("🗑️ Canceladas removidas no banco:", data);

      // 2️⃣ Atualizar cache local
      if (Array.isArray(window.reservasEstacaoCache)) {
        window.reservasEstacaoCache = window.reservasEstacaoCache.filter(
          (r) => (r.status || "").toLowerCase() !== "cancelada"
        );
      } else {
        window.reservasEstacaoCache = [];
      }

      localStorage.setItem(
        `reservasEstacao_${estacaoEmail}`,
        JSON.stringify(window.reservasEstacaoCache || [])
      );

      // 3️⃣ Recarregar reservas atualizadas do backend
      async function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
      let attempts = 0;
      let backendReservas = [];
      while (attempts < 5) {
        attempts++;
        backendReservas = await carregarReservasEstacao(true).catch(() => []);
        const temCanceladas = (backendReservas || []).some(r => (r.status || "").toLowerCase() === "cancelada");
        if (!temCanceladas) break;
        await sleep(250);
      }

      window.reservasEstacaoCache = Array.isArray(backendReservas) && backendReservas.length
        ? backendReservas
        : (window.reservasEstacaoCache || []);

      // 4️⃣ Atualizar visualização
      if (typeof renderizarReservasEstacao === "function") await renderizarReservasEstacao();
      if (typeof renderizarDetalhes === "function") await renderizarDetalhes();

      if (typeof mostrarMensagem === "function")
        mostrarMensagem("Reservas canceladas removidas com sucesso.", "sucesso");

    } catch (err) {
      console.error("❌ Falha ao remover reservas canceladas (estação):", err);
      if (typeof mostrarMensagem === "function")
        mostrarMensagem("Erro ao remover canceladas.", "erro");
    } finally {
      btnRemoverCanceladas.disabled = false;
    }
  });
}


  // abrir modal detalhes
  function abrirModal() {
    renderizarDetalhes();
    if (modalDetalhes) modalDetalhes.style.display = "flex";
  }

  if (btnDetalhes) btnDetalhes.addEventListener("click", abrirModal);
  if (closeBtn) closeBtn.addEventListener("click", () => { if (modalDetalhes) modalDetalhes.style.display = "none"; });

  window.addEventListener("click", (e) => {
    if (e.target === modalDetalhes) modalDetalhes.style.display = "none";
    if (e.target === confirmarModal) confirmarModal.style.display = "none";
  });

  // botões de atualizar/nova reserva (caso existam no DOM)
  const btnAtualizar = document.getElementById("btnAtualizarReservas");
  const btnNova = document.getElementById("btnNovaReservaEstacao");
  if (btnAtualizar) btnAtualizar.addEventListener("click", renderizarReservasEstacao);
  if (btnNova) btnNova.addEventListener("click", criarReservaEstacao);
});

// ====================================
// 🔄 Buscar informações da estação no backend
// ====================================
document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("usuarioEmail");
  if (!email) return console.warn("⚠️ Nenhum email de estação encontrado.");

  try {
    const res = await fetch(`${API_BASE}/stations/${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error("Erro ao buscar estação no backend.");

    const estacao = await res.json();
    console.log("✅ Dados da estação recebidos do backend:", estacao);

    // Nome e localização
    if (document.getElementById("stationTitle"))
      document.getElementById("stationTitle").innerText = estacao.nome || "Minha Estação";

    if (document.getElementById("stationMsg"))
      document.getElementById("stationMsg").innerText =
        estacao.cidade && estacao.estado
          ? `${estacao.cidade} - ${estacao.estado}`
          : "Estação de Carregamento";

    // Potência
    if (document.getElementById("statPotencia"))
      document.getElementById("statPotencia").innerText =
        estacao.potencia || estacao.power ? `${estacao.potencia || estacao.power} kW` : "--";

    // 🕓 Disponibilidade (com base em open_time e close_time)
    if (document.getElementById("statDisponibilidade")) {
      const abertura = estacao.open_time || estacao.abertura;
      const fechamento = estacao.close_time || estacao.fechamento;

      if (abertura && fechamento) {
        document.getElementById("statDisponibilidade").innerText =
          `${abertura.slice(0, 5)} - ${fechamento.slice(0, 5)}`;
      } else {
        document.getElementById("statDisponibilidade").innerText = "--";
      }
    }

    // Preço
    if (document.getElementById("statPreco"))
      document.getElementById("statPreco").innerText =
        estacao.preco || estacao.price
          ? `R$ ${(estacao.preco || estacao.price).toFixed(2)}`
          : "--";

    // Telefone
    if (document.getElementById("statTelefone"))
      document.getElementById("statTelefone").innerText =
        estacao.telefone || estacao.phone
          ? formatarTelefone(estacao.telefone || estacao.phone)
          : "--";

  } catch (err) {
    console.error("❌ Erro ao carregar informações da estação:", err);
  }
});
