// ====================================
// reserva.js (estação)
// ====================================

const API_BASE = "http://localhost:4000"; 

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
// Backend-aware carregar reservas
// ---------------------------
async function carregarReservasEstacao() {
  const emailEstacao = (localStorage.getItem("usuarioEmail") || "").toLowerCase();
  if (!emailEstacao) return [];
  try {
    const res = await fetch(`${API_BASE}/reservas/estacao/${encodeURIComponent(emailEstacao)}`);
    if (res.ok) {
      const data = await res.json();
      return (Array.isArray(data) ? data : []).map(normalizeReserva);
    }
  } catch (e) {
    console.warn("Falha ao buscar reservas do backend:", e);
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
            reservaIndexParaCancelar = idx;
            if (confirmarModal) confirmarModal.style.display = "flex";
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
            const inicioMin = (() => { const [h, m] = inicio.split(":").map(Number); return h*60 + (m||0); })();
            const fimMin = inicioMin + Number(r.duracaoMin);
            const hh = Math.floor(fimMin/60)%24; const mm = fimMin%60;
            const fimHora = String(hh).padStart(2,"0") + ":" + String(mm).padStart(2,"0");
            horarioFormatado = `${inicio} - ${fimHora} (${formatDuracao(r.duracaoMin)})`;
          } else if (r.hora || r.inicio) {
            const inicio = r.hora || r.inicio;
            const [h, m] = (inicio + "").split(":").map(Number);
            const fimHora = String((h+1)%24).padStart(2,"0") + ":" + String(m||0).padStart(2,"0");
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
      if (reservaIndexParaCancelar !== null) {
        // carregar reservas originais (para compatibilidade de índices com localStorage fallback)
        const reservasOriginais = JSON.parse(localStorage.getItem(`reservasEstacao_${localStorage.getItem("usuarioEmail")}`)) || [];
        const r = reservasOriginais[reservaIndexParaCancelar];
        if (r) {
          const usuarioKey = r.usuarioEmail || r.usuario || r.usuario_email || "";
          const estacaoKey = localStorage.getItem("usuarioEmail") || "";

          // tenta backend
          const okBackend = await atualizarStatusReservaBackend(estacaoKey, usuarioKey, r.data, r.hora || r.inicio, "cancelada");

          // atualiza localmente (mesma lógica original)
          atualizarStatusReservaEstacao(estacaoKey, usuarioKey, r.data, r.hora || r.inicio, "cancelada");

          // REEMBOLSO FIXO R$10 (mantive o comportamento original em localStorage)
          try {
            const usuarioEmail = usuarioKey;
            if (usuarioEmail) {
              const carteiraKey = `saldoCarteira_${usuarioEmail}`;
              const transKey = `transacoesCarteira_${usuarioEmail}`;

              let saldoAtual = parseFloat(localStorage.getItem(carteiraKey)) || 0;
              saldoAtual = +(saldoAtual + 10).toFixed(2);
              localStorage.setItem(carteiraKey, saldoAtual);

              const transacoes = JSON.parse(localStorage.getItem(transKey)) || [];
              transacoes.push({ valor: 10, tipo: "Reembolso", data: new Date().toISOString() });
              localStorage.setItem(transKey, JSON.stringify(transacoes));
              window.dispatchEvent(new Event("carteiraAtualizada"));
            }
          } catch (e) {
            console.error("Falha ao reembolsar usuário:", e);
          }

          renderizarReservasEstacao();
          await renderizarDetalhes();
          reservaIndexParaCancelar = null;

          if (okBackend) {
            if (typeof mostrarMensagem === "function") mostrarMensagem("Reserva cancelada e sincronizada (backend).", "sucesso");
          } else {
            if (typeof mostrarMensagem === "function") mostrarMensagem("Reserva cancelada (offline). Reembolso aplicado localmente.", "sucesso");
          }
        }
        if (confirmarModal) confirmarModal.style.display = "none";
      }
    });
  }

  if (btnFechar) {
    btnFechar.addEventListener("click", () => {
      if (confirmarModal) confirmarModal.style.display = "none";
      reservaIndexParaCancelar = null;
    });
  }

  if (btnRemoverCanceladas) {
    btnRemoverCanceladas.addEventListener("click", () => {
      let reservas = JSON.parse(localStorage.getItem(`reservasEstacao_${localStorage.getItem("usuarioEmail")}`)) || [];
      reservas = reservas.filter(r => r.status !== "cancelada");
      localStorage.setItem(`reservasEstacao_${localStorage.getItem("usuarioEmail")}`, JSON.stringify(reservas));
      renderizarReservasEstacao();
      renderizarDetalhes();
      if (typeof mostrarMensagem === "function") mostrarMensagem("🗑️ Reservas canceladas removidas.", "sucesso");
    });
  }

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

// ------------------------------
// Informações da estação na página inicial (mantive como antes)
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const estacao = JSON.parse(localStorage.getItem("estacaoSelecionada")) || null;
  if (!estacao) return;

  if (document.getElementById("stationTitle")) document.getElementById("stationTitle").innerText = estacao.nome || "Minha Estação";
  if (document.getElementById("stationMsg")) document.getElementById("stationMsg").innerText = (estacao.cidade && estacao.estado) ? `${estacao.cidade} - ${estacao.estado}` : "Estação de Carregamento";
  if (document.getElementById("statPotencia")) document.getElementById("statPotencia").innerText = estacao.potencia ? estacao.potencia + "" : "--";
  if (document.getElementById("statDisponibilidade")) document.getElementById("statDisponibilidade").innerText = `${estacao.abertura || "00:00"} - ${estacao.fechamento || "23:59"}`;
  if (document.getElementById("statPreco")) document.getElementById("statPreco").innerText = estacao.preco ? ` ${estacao.preco}` : "--";
  if (document.getElementById("statTelefone")) document.getElementById("statTelefone").innerText = (typeof formatarTelefone === "function") ? formatarTelefone(estacao.telefone) : (estacao.telefone || "--");
});
