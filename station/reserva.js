// ====================================
// reserva.js (estação) - versão final integrada
// ====================================

// Carregar / Salvar reservas da estação (para a estação atualmente logada)
function carregarReservasEstacao() {
  const emailEstacao = localStorage.getItem("usuarioEmail"); // salvo no login da estação
  if (!emailEstacao) return [];
  return JSON.parse(localStorage.getItem(`reservasEstacao_${emailEstacao}`)) || [];
}

function salvarReservasEstacao(reservas) {
  const emailEstacao = localStorage.getItem("usuarioEmail");
  if (!emailEstacao) return;
  localStorage.setItem(`reservasEstacao_${emailEstacao}`, JSON.stringify(reservas));
}

// Resolve nome de usuário a partir do objeto de reserva (tenta campo 'usuario', depois busca em users por email)
function resolveNomeUsuario(r) {
  if (!r) return "Usuário Desconhecido";
  if (r.usuario) return r.usuario;
  if (r.usuarioEmail) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const u = users.find(x => (x.email || "").toLowerCase() === (r.usuarioEmail || "").toLowerCase());
    if (u) return u.fullName || u.email;
    return r.usuarioEmail;
  }
  return "Usuário Desconhecido";
}

// ============================================
// Função robusta de sincronização (bidirecional)
// Assinatura: (estacaoEmail, usuarioEmail, data, hora, status)
// Atualiza a lista da estação e quaisquer listas de reservas de usuários
// ============================================
function atualizarStatusReservaEstacao(estacaoEmail, usuarioEmail, data, hora, status) {
  try {
    // 1) Atualizar a lista da estação (para a estação passada no parâmetro)
    if (estacaoEmail) {
      const chaveEstacao = `reservasEstacao_${estacaoEmail}`;
      const reservasEstacao = JSON.parse(localStorage.getItem(chaveEstacao)) || [];
      let changedEstacao = false;

      reservasEstacao.forEach(r => {
        const matchUsuario =
          usuarioEmail &&
          ((r.usuarioEmail && r.usuarioEmail === usuarioEmail) ||
            (r.usuario && r.usuario === usuarioEmail));
        if (matchUsuario && r.data === data && r.hora === hora) {
          r.status = status;
          changedEstacao = true;
        }
      });

      if (changedEstacao) {
        localStorage.setItem(chaveEstacao, JSON.stringify(reservasEstacao));
      }
    }

    // 2) Atualizar quaisquer listas de reservas de usuários / clientes no localStorage
    //    -> cobrir formatos variados: "reservas_{usuario}", "reservasUsuario_{email}", "reservas_*"
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Evitar sobrescrever arrays das estações novamente
      if (key.startsWith("reservasEstacao_")) continue;

      // Considerar apenas chaves que representam reservas
      if (!key.startsWith("reservas")) continue;

      try {
        const arr = JSON.parse(localStorage.getItem(key));
        if (!Array.isArray(arr)) continue;

        let updated = false;
        arr.forEach(item => {
          if (!item) return;
          const matchDataHora = item.data === data && item.hora === hora;

          const matchUsuario =
            usuarioEmail &&
            ((item.usuarioEmail && item.usuarioEmail === usuarioEmail) ||
              (item.usuario && item.usuario === usuarioEmail));

          const matchEstacao =
            estacaoEmail &&
            ((item.estacaoEmail && item.estacaoEmail === estacaoEmail) ||
              (item.estacao && item.estacao === estacaoEmail) ||
              (item.estacao && item.estacao === (localStorage.getItem("usuario") || ""))); // fallback

          if (matchDataHora && (matchUsuario || matchEstacao)) {
            item.status = status;
            updated = true;
          }
        });

        if (updated) {
          localStorage.setItem(key, JSON.stringify(arr));
        }
      } catch (e) {
        // se falhar ao parsear algum item, continua (não crítico)
      }
    }
  } catch (e) {
    console.error("Erro em atualizarStatusReservaEstacao:", e);
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
  // inicializar
  renderizarReservasEstacao();

  // Agendamento (se aplicável)
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

      // pega veículo do usuário atual (robusto)
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

  // Detalhes/confirm modal
  const btnDetalhes = document.getElementById("btnDetalhesReserva");
  const modalDetalhes = document.getElementById("detalhesReservaModal");
  const listaDetalhes = document.getElementById("listaDetalhesReservas");
  const closeBtn = modalDetalhes ? modalDetalhes.querySelector(".close") : null;
  const confirmarModal = document.getElementById("confirmarCancelamentoModal");
  const btnConfirmar = document.getElementById("btnCancelarConfirmar");
  const btnFechar = document.getElementById("btnCancelarFechar");
  const btnRemoverCanceladas = document.getElementById("btnRemoverCanceladas");
  let reservaIndexParaCancelar = null;

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

      // Botão Confirmar
      const btnConfirma = document.createElement("button");
      btnConfirma.className = "btn-confirmar-reserva";
      btnConfirma.textContent = "Confirmar";

      // Desativa se já estiver cancelada ou confirmada
      if (r.status === "cancelada" || r.status === "confirmada") {
        btnConfirma.disabled = true;
        btnConfirma.style.opacity = "0.5";
      } else {
        btnConfirma.addEventListener("click", () => {
          const usuarioEmail = r.usuarioEmail || r.usuario || "";
          const estacaoKey = localStorage.getItem("usuarioEmail") || "";
          atualizarStatusReservaEstacao(estacaoKey, usuarioEmail, r.data, r.hora, "confirmada");
          // atualizar UI local
          renderizarReservasEstacao();
          renderizarDetalhes();
        });
      }

      // Botão Cancelar
      const btnCancelar = document.createElement("button");
      btnCancelar.className = "btn-cancelar-reserva";
      btnCancelar.textContent = "Cancelar";

      // Só permite cancelar se ainda não estiver cancelada
      if (r.status === "cancelada") {
        btnCancelar.disabled = true;
        btnCancelar.style.opacity = "0.5";
      } else {
        btnCancelar.addEventListener("click", () => {
          reservaIndexParaCancelar = idx;
          if (confirmarModal) confirmarModal.style.display = "flex";
        });
      }

      linha.appendChild(nomeSpan);
      linha.appendChild(statusSpan);
      linha.appendChild(btnConfirma);
      linha.appendChild(btnCancelar);

      // Calcular tempo de reserva
      const detalhes = document.createElement("div");
      detalhes.className = "detalhes-reserva";

      const _horaParaMinutos = (typeof horaParaMinutos === "function")
        ? horaParaMinutos
        : (hora => {
          const [h, m] = (hora || "00:00").split(":").map(Number);
          return h * 60 + m;
        });

      const _minutosParaHora = (typeof minutosParaHora === "function")
        ? minutosParaHora
        : (min => {
          const hh = Math.floor(min / 60) % 24;
          const mm = min % 60;
          return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
        });

      function formatDuracao(totalMin) {
        if (typeof totalMin !== "number" || isNaN(totalMin)) return "--";
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        if (h === 0 && m === 0) return "0min";
        return `${h > 0 ? h + "h" : ""}${h > 0 && m > 0 ? " " : ""}${m > 0 ? m + "min" : ""}`;
      }

      let horarioFormatado = "--";
      try {
        if (r.inicio && r.fim) {
          const dur = _horaParaMinutos(r.fim) - _horaParaMinutos(r.inicio);
          horarioFormatado = `${r.inicio} - ${r.fim} (${formatDuracao(dur)})`;
        } else if (typeof r.duracaoMin === "number") {
          const inicio = r.hora || "00:00";
          const inicioMin = _horaParaMinutos(inicio);
          const fimMin = inicioMin + Number(r.duracaoMin);
          horarioFormatado = `${inicio} - ${_minutosParaHora(fimMin)} (${formatDuracao(Number(r.duracaoMin))})`;
        } else if (r.hora) {
          const inicio = r.hora;
          const inicioMin = _horaParaMinutos(inicio);
          const fimMin = inicioMin + 60;
          horarioFormatado = `${inicio} - ${_minutosParaHora(fimMin)} (${formatDuracao(60)})`;
        }
      } catch (err) {
        horarioFormatado = r.hora || "--";
        console.warn("Erro ao formatar horário:", err);
      }

      // Detalhes de cada reserva
      detalhes.innerHTML = `
  <p><strong>Data:</strong> ${r.data || "--"}</p>
  <p><strong>Horário:</strong> ${horarioFormatado}</p>
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

  // Confirmar cancelamento (botão do modal)
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", () => {
      if (reservaIndexParaCancelar !== null) {
        const reservas = carregarReservasEstacao();
        const r = reservas[reservaIndexParaCancelar];
        if (r) {
          // Atualiza o status para cancelada (na estação e sincroniza para o usuário)
          const usuarioKey = r.usuarioEmail || r.usuario || "";
          const estacaoKey = localStorage.getItem("usuarioEmail") || "";
          atualizarStatusReservaEstacao(estacaoKey, usuarioKey, r.data, r.hora, "cancelada");

          // ✅ REEMBOLSO FIXO DE R$10 PARA O EMAIL DO USUÁRIO
          try {
            const usuarioEmail = r.usuarioEmail; // sempre use e-mail
            const carteiraKey = `saldoCarteira_${usuarioEmail}`;
            const transKey = `transacoesCarteira_${usuarioEmail}`;

            let saldoAtual = parseFloat(localStorage.getItem(carteiraKey)) || 0;
            saldoAtual = +(saldoAtual + 10).toFixed(2);
            localStorage.setItem(carteiraKey, saldoAtual);

            const transacoes = JSON.parse(localStorage.getItem(transKey)) || [];
            transacoes.push({ valor: 10, tipo: "Reembolso" });
            localStorage.setItem(transKey, JSON.stringify(transacoes));

            console.log("💰 Reembolso enviado para:", carteiraKey);
            // ❌ Removido: alert("💰 Reembolso enviado para " + usuarioEmail);
            if (typeof mostrarMensagem === "function") mostrarMensagem("Reserva cancelada com sucesso.", "sucesso");
            window.dispatchEvent(new Event("carteiraAtualizada"));
          } catch (e) {
            console.error("Falha ao reembolsar usuário:", e);
          }


        }

        // Recarrega a UI local
        salvarReservasEstacao(carregarReservasEstacao());
        renderizarReservasEstacao();
        renderizarDetalhes();
        reservaIndexParaCancelar = null;
      }
      if (confirmarModal) confirmarModal.style.display = "none";
    });
  }


  // Fechar modal de confirmação (sem ação)
  if (btnFechar) {
    btnFechar.addEventListener("click", () => {
      if (confirmarModal) confirmarModal.style.display = "none";
      reservaIndexParaCancelar = null;
    });
  }

  // Remover apenas as reservas canceladas (UI + armazenamento da estação)
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


// ===============================
// Informações da estação na pagina inicial
// ===============================

  document.addEventListener("DOMContentLoaded", () => {
    const estacao = JSON.parse(localStorage.getItem("estacaoSelecionada")) || null;
    if (!estacao) return;

    // Título e descrição
    document.getElementById("stationTitle").innerText = estacao.nome || "Minha Estação";
    document.getElementById("stationMsg").innerText = (estacao.cidade && estacao.estado)
      ? `${estacao.cidade} - ${estacao.estado}`
      : "Estação de Carregamento";

    // Função para formatar o telefone
    function formatarTelefone(numero) {
      if (!numero) return "--";
      numero = numero.replace(/\D/g, ""); // remove tudo que não for número

      if (numero.length === 11) {
        // celular
        return `(${numero.substring(0, 2)}) ${numero.substring(2, 7)}-${numero.substring(7)}`;
      }
      if (numero.length === 10) {
        // fixo
        return `(${numero.substring(0, 2)}) ${numero.substring(2, 6)}-${numero.substring(6)}`;
      }
      return numero; // fallback
    }

    // Estatísticas
    const abertura = estacao.abertura || "00:00";
    const fechamento = estacao.fechamento || "23:59";

    document.getElementById("statPotencia").innerText = estacao.potencia ? estacao.potencia + " kW" : "--";
    document.getElementById("statDisponibilidade").innerText = `${abertura} - ${fechamento}`;
    document.getElementById("statPreco").innerText = estacao.preco ? `R$ ${estacao.preco}` : "--";
    document.getElementById("statTelefone").innerText = formatarTelefone(estacao.telefone);
  });
