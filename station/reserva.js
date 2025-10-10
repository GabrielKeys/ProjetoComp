// ====================================
// reserva.js (estação) - versão robusta
// ====================================

// Carregar / Salvar reservas da estação
function carregarReservasEstacao() {
  const emailEstacao = localStorage.getItem("usuarioEmail"); // salvo no login da estação
  return JSON.parse(localStorage.getItem(`reservasEstacao_${emailEstacao}`)) || [];
}

function salvarReservasEstacao(reservas) {
  const emailEstacao = localStorage.getItem("usuarioEmail");
  localStorage.setItem(`reservasEstacao_${emailEstacao}`, JSON.stringify(reservas));
}

// Resolve nome de usuário a partir do objeto de reserva (tenta campo 'usuario', depois busca em users por email)
function resolveNomeUsuario(r) {
  if (r.usuario) return r.usuario;
  if (r.usuarioEmail) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const u = users.find(x => (x.email || "").toLowerCase() === (r.usuarioEmail || "").toLowerCase());
    if (u) return u.fullName || u.email;
    return r.usuarioEmail;
  }
  return "Usuário Desconhecido";
}

// Atualiza status na estação e tenta atualizar em todas as chaves de reservas de usuários
function atualizarStatusReservaEstacao(usuarioEmailOrNome, data, hora, status) {
  const emailEstacao = localStorage.getItem("usuarioEmail");

  // 1) Atualiza lista da estação
  let reservasEstacao = carregarReservasEstacao();
  let changedEstacao = false;
  reservasEstacao.forEach(r => {
    const matchUsuario =
      (r.usuarioEmail && r.usuarioEmail === usuarioEmailOrNome) ||
      (r.usuario && r.usuario === usuarioEmailOrNome);
    if (matchUsuario && r.data === data && r.hora === hora) {
      r.status = status;
      changedEstacao = true;
    }
  });
  if (changedEstacao) salvarReservasEstacao(reservasEstacao);

  // 2) Atualiza quaisquer reservas de usuários guardadas no localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (!key.startsWith("reservas_")) continue;
    if (key.startsWith("reservasEstacao_")) continue;

    try {
      const arr = JSON.parse(localStorage.getItem(key)) || [];
      let updated = false;
      arr.forEach(item => {
        const matchDataHora = item.data === data && item.hora === hora;
        const matchUsuario =
          (item.usuarioEmail && usuarioEmailOrNome && item.usuarioEmail === usuarioEmailOrNome) ||
          (item.usuario && usuarioEmailOrNome && item.usuario === usuarioEmailOrNome) ||
          false;
        const matchEstacao = (item.estacaoEmail && item.estacaoEmail === emailEstacao);

        if (matchDataHora && (matchUsuario || matchEstacao)) {
          item.status = status;
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem(key, JSON.stringify(arr));
      }
    } catch (e) {}
  }
}

// Renderiza reservas na dashboard da estação
function renderizarReservasEstacao() {
  const reservas = carregarReservasEstacao();
  const textoReserva = document.getElementById("textoReserva");
  const lista = document.getElementById("listaReservas");
  const btnDetalhes = document.getElementById("btnDetalhesReserva");

  if (!textoReserva || !lista || !btnDetalhes) return;

  lista.innerHTML = "";

  if (reservas.length === 0) {
    textoReserva.innerText = "Nenhuma reserva agendada.";
    btnDetalhes.style.display = "none";
    return;
  }

  const prox = reservas[0];
  const nomeProx = resolveNomeUsuario(prox);
  textoReserva.innerHTML = `
    <strong>Usuário:</strong> ${nomeProx}<br>
    <strong>Data:</strong> ${prox.data}<br>
    <strong>Hora:</strong> ${prox.hora}<br>
    <strong>Status:</strong> ${prox.status || "pendente"}
  `;

  reservas.forEach(r => {
    const div = document.createElement("div");
    div.classList.add("reserva-item");
    const nome = resolveNomeUsuario(r);
    div.innerHTML = `
      <p><strong>Usuário:</strong> ${nome}</p>
      <p><strong>Data:</strong> ${r.data}</p>
      <p><strong>Hora:</strong> ${r.hora}</p>
      <p><strong>Status:</strong> ${r.status || "pendente"}</p>
    `;
    lista.appendChild(div);
  });

  btnDetalhes.style.display = "block";
}

// ========== event listeners e modais ==========
document.addEventListener("DOMContentLoaded", () => {
  renderizarReservasEstacao();

  const btnAgendar = document.getElementById("btnAgendar");
  const modalAgendamento = document.getElementById("agendamentoModal");
  const closeBtns = document.querySelectorAll("#agendamentoModal .close");
  const formAgendamento = document.getElementById("formAgendamento");

  if (btnAgendar && modalAgendamento && formAgendamento) {
    btnAgendar.addEventListener("click", () => modalAgendamento.style.display = "block");
    closeBtns.forEach(btn => btn.addEventListener("click", () => modalAgendamento.style.display = "none"));
    window.addEventListener("click", (e) => { if (e.target === modalAgendamento) modalAgendamento.style.display = "none"; });

    formAgendamento.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = document.getElementById("dataReserva").value;
      const hora = document.getElementById("horaReserva").value;
      const usuario = localStorage.getItem("usuarioNome") || localStorage.getItem("usuario") || "Usuário Desconhecido";
      if (!data || !hora) { alert("Preencha todos os campos!"); return; }

      // 🔹 Pega veículo do usuário atual (robusto)
      const usuarioAtual = localStorage.getItem("usuario");
      const veiculo = {
        modelo: (localStorage.getItem(`veiculoModelo_${usuarioAtual}`) || "").trim(),
        ano: (localStorage.getItem(`veiculoAno_${usuarioAtual}`) || "").trim(),
        placa: (localStorage.getItem(`veiculoPlaca_${usuarioAtual}`) || "").trim(),
        bateria: (localStorage.getItem(`veiculoBateria_${usuarioAtual}`) || "").trim(),
        carga: (localStorage.getItem(`veiculoCarregamento_${usuarioAtual}`) || "").trim()
      };

      const reservas = carregarReservasEstacao();
      reservas.push({ 
        usuario, 
        usuarioEmail: localStorage.getItem("usuarioEmail") || "", 
        data, 
        hora, 
        status: "pendente",
        veiculo
      });
      salvarReservasEstacao(reservas);
      renderizarReservasEstacao();
      modalAgendamento.style.display = "none";
      formAgendamento.reset();
    });
  }

  const btnDetalhes = document.getElementById("btnDetalhesReserva");
  const modalDetalhes = document.getElementById("detalhesReservaModal");
  const listaDetalhes = document.getElementById("listaDetalhesReservas");
  const closeBtn = modalDetalhes ? modalDetalhes.querySelector(".close") : null;
  const confirmarModal = document.getElementById("confirmarCancelamentoModal");
  const btnConfirmar = document.getElementById("btnCancelarConfirmar");
  const btnFechar = document.getElementById("btnCancelarFechar");
  const btnRemoverCanceladas = document.getElementById("btnRemoverCanceladas");
  let reservaIndexParaCancelar = null;

  // 🔹 Atualiza status tanto na estação quanto no usuário
  function atualizarStatusReservaEstacao(usuarioEmail, data, hora, status) {
    const emailEstacao = localStorage.getItem("usuarioEmail");

    // 1) Atualiza lista da estação
    let reservasEstacao = carregarReservasEstacao();
    let changedEstacao = false;
    reservasEstacao.forEach(r => {
      const matchUsuario =
        (r.usuarioEmail && r.usuarioEmail === usuarioEmail) ||
        (r.usuario && r.usuario === usuarioEmail);
      if (matchUsuario && r.data === data && r.hora === hora) {
        r.status = status;
        changedEstacao = true;
      }
    });
    if (changedEstacao) salvarReservasEstacao(reservasEstacao);

    // 2) Tenta atualizar reservas do usuário (mantendo compatibilidade)
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (!key.startsWith("reservas_")) continue;
        if (key.startsWith("reservasEstacao_")) continue;

        const arr = JSON.parse(localStorage.getItem(key)) || [];
        let updated = false;
        arr.forEach(item => {
          const matchDataHora = item.data === data && item.hora === hora;
          const matchUsuario =
            (item.usuarioEmail && usuarioEmail && item.usuarioEmail === usuarioEmail) ||
            (item.usuario && usuarioEmail && item.usuario === usuarioEmail) || false;
          const matchEstacao = (item.estacaoEmail && item.estacaoEmail === emailEstacao);

          if (matchDataHora && (matchUsuario || matchEstacao)) {
            item.status = status;
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(key, JSON.stringify(arr));
        }
      }
    } catch (e) {
      // se falhar aqui não é crítico
      console.warn("Erro ao sincronizar reservas de usuários:", e);
    }
  }

  function renderizarDetalhes() {
    const reservas = carregarReservasEstacao();
    if (!listaDetalhes) return;
    listaDetalhes.innerHTML = "";

    if (reservas.length === 0) {
      listaDetalhes.innerHTML = "<li>Nenhuma reserva encontrada.</li>";
      return;
    }

    reservas.forEach((r, idx) => {
      const li = document.createElement("li");
      const linha = document.createElement("div");
      linha.className = "reserva-linha";

      const nomeSpan = document.createElement("span");
      nomeSpan.className = "reserva-nome";
      nomeSpan.textContent = `Usuário: ${resolveNomeUsuario(r)}`;

      const statusSpan = document.createElement("span");
      statusSpan.className = "reserva-status";
      statusSpan.textContent = r.status || "pendente";

      const btnConfirma = document.createElement("button");
      btnConfirma.className = "btn-confirmar-reserva";
      btnConfirma.textContent = "Confirmar";
      btnConfirma.addEventListener("click", () => {
        const usuarioEmail = r.usuarioEmail || r.usuario;
        atualizarStatusReservaEstacao(usuarioEmail, r.data, r.hora, "confirmada");
        renderizarReservasEstacao();
        renderizarDetalhes();
      });

      const btnCancelar = document.createElement("button");
      btnCancelar.className = "btn-cancelar-reserva";
      btnCancelar.textContent = "Cancelar";
      btnCancelar.addEventListener("click", () => {
        reservaIndexParaCancelar = idx;
        if (confirmarModal) confirmarModal.style.display = "flex";
      });

      linha.appendChild(nomeSpan);
      linha.appendChild(statusSpan);
      linha.appendChild(btnConfirma);
      linha.appendChild(btnCancelar);

      const detalhes = document.createElement("div");
      detalhes.className = "detalhes-reserva";
      detalhes.innerHTML = `
        <p><strong>Data:</strong> ${r.data}</p>
        <p><strong>Horário:</strong> ${r.hora}</p>
        <p><strong>Status:</strong> ${r.status || "pendente"}</p>
        ${r.veiculo ? `
          <p><strong>Veículo:</strong> ${r.veiculo.modelo || "----"} (${r.veiculo.ano || "----"})</p>
          <p><strong>Placa:</strong> ${r.veiculo.placa || "----"}</p>
          <p><strong>Bateria:</strong> ${r.veiculo.bateria || "----"}</p>
          <p><strong>Carga:</strong> ${r.veiculo.carga || "----"}</p>
        ` : ""}
      `;

      li.appendChild(linha);
      li.appendChild(detalhes);
      listaDetalhes.appendChild(li);
    });
  }

  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", () => {
      if (reservaIndexParaCancelar !== null) {
        const reservas = carregarReservasEstacao();
        const r = reservas[reservaIndexParaCancelar];
        if (r) {
          // atualiza ambas as fontes (estação e usuário)
          atualizarStatusReservaEstacao(r.usuarioEmail || r.usuario, r.data, r.hora, "cancelada");
        }
        salvarReservasEstacao(carregarReservasEstacao());
        renderizarReservasEstacao();
        renderizarDetalhes();
        reservaIndexParaCancelar = null;
      }
      if (confirmarModal) confirmarModal.style.display = "none";
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
      let reservas = carregarReservasEstacao();
      reservas = reservas.filter(r => r.status !== "cancelada");
      salvarReservasEstacao(reservas);
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
});
