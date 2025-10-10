// ====================================
// reserva.js (usuário) - versão robusta e defensiva
// ====================================

// ====================================
// pequenos utilitários
// ====================================
function normalizeName(n) {
  return (n || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
function namesEqual(a, b) {
  return normalizeName(a) === normalizeName(b);
}

// ====================================
// Aux: encontra qual identificador de usuário usar para os keys do veículo
// tenta: r.usuario / r.usuarioEmail / localStorage.usuarioEmail / localStorage.usuario
// retorna string (pode ser vazia se não achar)
function findUsuarioIdForVeiculo(preferredId) {
  const candidates = [];
  if (preferredId) candidates.push(preferredId);
  const fromLocalEmail = localStorage.getItem("usuarioEmail");
  const fromLocal = localStorage.getItem("usuario");
  if (fromLocalEmail && !candidates.includes(fromLocalEmail)) candidates.push(fromLocalEmail);
  if (fromLocal && !candidates.includes(fromLocal)) candidates.push(fromLocal);

  // devolve o primeiro que tenha qualquer chave de veículo presente (compatibilidade)
  for (const id of candidates) {
    if (!id) continue;
    if (localStorage.getItem(`veiculoModelo_${id}`) ||
      localStorage.getItem(`veiculoAno_${id}`) ||
      localStorage.getItem(`veiculoPlaca_${id}`)) {
      return id;
    }
  }
  // se nenhum tem dados, devolve preferido ou o primeiro candidato (p/ leitura/escrita posterior)
  return preferredId || fromLocalEmail || fromLocal || "";
}

// helper para checar se um valor do localStorage conta como "preenchido"
function isFilledValue(v) {
  if (!v && v !== 0) return false;
  const s = String(v).trim();
  if (s === "" || /^-+$/.test(s)) return false;
  if (s.toLowerCase().includes("----")) return false;
  return true;
}

// ====================================
// Atualizar estatísticas da estação
// ====================================
function atualizarEstacao() {
  const usuarioAtual = localStorage.getItem("usuario");
  const estacaoSel = JSON.parse(localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`));

  const statPotencia = document.getElementById("statPotencia");
  const statEspera = document.getElementById("statEspera");
  const statDisponibilidade = document.getElementById("statDisponibilidade");
  const stationMsg = document.getElementById("stationMsg");
  const btnAgendar = document.getElementById("btnAgendar");
  const statPreco = document.getElementById("statPreco"); // Extras

  if (estacaoSel) {
    // 🔹 tentar resolver objeto completo (stations localStorage -> window.estacoes -> fallback)
    const stations = JSON.parse(localStorage.getItem("stations")) || [];
    let estacao = stations.find(s => namesEqual(s.nome, estacaoSel.nome))
      || (window.estacoes || []).find(s => namesEqual(s.nome, estacaoSel.nome))
      || estacaoSel;

    if (statPotencia) statPotencia.textContent = estacao.potencia ? (estacao.potencia + " kW") : "--";
    if (statEspera) statEspera.textContent = estacao.tempoEspera ? (estacao.tempoEspera + " min") : "--";
    if (statDisponibilidade) statDisponibilidade.textContent = `${estacao.abertura || "?"} - ${estacao.fechamento || "?"}`;
    if (stationMsg) stationMsg.textContent = `Estação selecionada: ${estacao.nome}`;
    if (statPreco) statPreco.textContent = estacao.preco ? (estacao.preco + " R$/kWh") : "--"; // Extras
    if (btnAgendar) btnAgendar.disabled = false;
  } else {
    if (statPotencia) statPotencia.textContent = "--";
    if (statEspera) statEspera.textContent = "--";
    if (statDisponibilidade) statDisponibilidade.textContent = "--";
    if (stationMsg) stationMsg.textContent = "Nenhuma estação de recarga selecionada.";
    if (statPreco) statPreco.textContent = "--"; //Extras
    if (btnAgendar) btnAgendar.disabled = true;
  }
}

// ====================================
// Modal de Seleção de Estação
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  const usuarioAtual = localStorage.getItem("usuario");
  const btnSelecionar = document.getElementById("btnSelecionarEstacao");
  const modal = document.getElementById("stationModal");
  const closeBtn = modal ? modal.querySelector(".close") : null;
  const listaEstacoes = document.getElementById("listaEstacoes");
  const chaveFavoritos = `favoritos_${usuarioAtual}`;

  function carregarFavoritos() {
    return JSON.parse(localStorage.getItem(chaveFavoritos)) || [];
  }

  let favoritos = carregarFavoritos();
  let favoritosVisuais = favoritos.map(() => true);

  // Renderiza lista (mostra favoritos, mas resolve dados completos via stations / estacoes)
  function renderizarLista() {
    if (!listaEstacoes) return;
    listaEstacoes.innerHTML = "";

    favoritos = carregarFavoritos();
    favoritosVisuais = favoritos.map(() => true);

    if (favoritos.length === 0) {
      listaEstacoes.innerHTML = "<li>Nenhuma estação favoritada ainda.</li>";
      return;
    }

    // pega stations salvas (registradas)
    const stations = JSON.parse(localStorage.getItem("stations")) || [];

    favoritos.forEach((fav, idx) => {
      // 🔹 resolve objeto completo: primeiro stations, depois window.estacoes, enfim use fav
      const estacaoCompleta =
        stations.find(s => namesEqual(s.nome, fav.nome)) ||
        (window.estacoes || []).find(s => namesEqual(s.nome, fav.nome)) ||
        fav;

      const li = document.createElement("li");
      li.className = "estacao-item";

      // Linha principal
      const linha = document.createElement("div");
      linha.className = "estacao-linha";

      const nome = document.createElement("span");
      nome.className = "estacao-nome";
      nome.textContent = estacaoCompleta.nome;

      const acoes = document.createElement("div");
      acoes.className = "estacao-acoes";

      // Estrela (visual) - mantém a lógica anterior de favoritosVisuais
      const estrela = document.createElement("span");
      estrela.className = "estrela-modal favorita";
      estrela.title = "Clique para desfavoritar";
      estrela.style.backgroundImage = "url('../assets/estrela.png')";
      if (!favoritosVisuais[idx]) estrela.classList.remove("favorita");

      estrela.addEventListener("click", (e) => {
        e.stopPropagation();
        favoritosVisuais[idx] = !favoritosVisuais[idx];
        estrela.classList.toggle("favorita", favoritosVisuais[idx]);

        if (favoritosVisuais[idx]) {
          if (typeof mostrarMensagem === "function") mostrarMensagem(`${estacaoCompleta.nome} adicionada aos favoritos!`, "sucesso", true);
        } else {
          if (typeof mostrarMensagem === "function") mostrarMensagem(`${estacaoCompleta.nome} removida dos favoritos.`, "erro", true);
        }
      });

      // Botão Selecionar -> salva a estacao completa
      const btnSelect = document.createElement("button");
      btnSelect.className = "btn-selecionar-estacao";
      btnSelect.textContent = "Selecionar";
      btnSelect.addEventListener("click", (e) => {
        e.stopPropagation();
        localStorage.setItem(`estacaoSelecionada_${usuarioAtual}`, JSON.stringify(estacaoCompleta));
        salvarFavoritosEFechar();
      });

      acoes.appendChild(btnSelect);
      acoes.appendChild(estrela);

      linha.appendChild(nome);
      linha.appendChild(acoes);

      // Detalhes sempre visíveis (usando estacaoCompleta)
      const detalhes = document.createElement("div");
      detalhes.className = "detalhes-estacao ativo";
      detalhes.innerHTML = `
        <p><strong>Endereço:</strong> ${estacaoCompleta.rua || "N/D"} ${estacaoCompleta.numero || ""}</p>
        <p><strong>Cidade:</strong> ${estacaoCompleta.cidade || "N/D"} - ${estacaoCompleta.estado || ""}</p>
        <p><strong>Potência Máx:</strong> ${estacaoCompleta.potencia ? (estacaoCompleta.potencia + " kW") : "N/D"}</p>
        <p><strong>Disponibilidade:</strong> ${estacaoCompleta.abertura || "?"} - ${estacaoCompleta.fechamento || "?"}</p>

      <!-- Extras -->
        <p><strong>Tempo de Espera:</strong> ${estacaoCompleta.tempoEspera ? (estacaoCompleta.tempoEspera + " min") : "--"}</p>
        <p><strong>Preço:</strong> ${estacaoCompleta.preco ? (estacaoCompleta.preco + " R$/kWh") : "--"}</p>
      `;

      li.appendChild(linha);
      li.appendChild(detalhes);

      listaEstacoes.appendChild(li);
    });
  }

  function salvarFavoritos() {
    const originais = carregarFavoritos();
    const novos = originais.filter((_, i) => favoritosVisuais[i]);
    localStorage.setItem(chaveFavoritos, JSON.stringify(novos));
    favoritos = novos;
    favoritosVisuais = favoritos.map(() => true);
  }

  function salvarFavoritosEFechar() {
    salvarFavoritos();
    if (favoritos.length === 0) {
      localStorage.removeItem(`estacaoSelecionada_${usuarioAtual}`);
    }
    if (modal) modal.style.display = "none";
    if (typeof atualizarEstacao === "function") atualizarEstacao();
  }

  function abrirModal() {
    favoritos = carregarFavoritos();
    favoritosVisuais = favoritos.map(() => true);
    renderizarLista();
    if (modal) modal.style.display = "flex";
  }

  if (btnSelecionar) {
    btnSelecionar.addEventListener("click", (e) => {
      e.preventDefault();
      abrirModal();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      salvarFavoritosEFechar();
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) salvarFavoritosEFechar();
  });
});

// ====================================
// Modal de Agendamento
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  const btnAgendar = document.getElementById("btnAgendar");
  const agendamentoModal = document.getElementById("agendamentoModal");
  const closeBtns = document.querySelectorAll("#agendamentoModal .close");

  if (btnAgendar) {
    btnAgendar.addEventListener("click", () => {
      if (agendamentoModal) agendamentoModal.style.display = "flex";
    });
  }

  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (agendamentoModal) agendamentoModal.style.display = "none";
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target === agendamentoModal) agendamentoModal.style.display = "none";
  });
});

// ====================================
// Funções de Reservas
// ====================================
function carregarReservas() {
  const usuario = localStorage.getItem("usuario");
  return JSON.parse(localStorage.getItem(`reservas_${usuario}`)) || [];
}
function salvarReservas(reservas) {
  const usuario = localStorage.getItem("usuario");
  localStorage.setItem(`reservas_${usuario}`, JSON.stringify(reservas));
}

// 🔹 Função para validar dados do veículo
function dadosVeiculoPreenchidos(usuarioIdCandidate) {
  // uso findUsuarioIdForVeiculo para pegar o id correto/compatível
  const usuarioId = findUsuarioIdForVeiculo(usuarioIdCandidate);
  if (!usuarioId) return false;
  const campos = ["Modelo", "Ano", "Placa", "Bateria", "Carregamento"];
  return campos.every(campo => {
    const valor = localStorage.getItem(`veiculo${campo}_${usuarioId}`);
    return isFilledValue(valor);
  });
}

function renderizarReservas() {
  const reservas = carregarReservas();
  const textoReserva = document.getElementById("textoReserva");
  const lista = document.getElementById("listaReservas");
  const textoReservaMapa = document.getElementById("textoReservaMapa");
  const listaMapa = document.getElementById("listaReservasMapa");

  if (reservas.length === 0) {
    if (textoReserva) textoReserva.textContent = "Nenhuma reserva agendada.";
    if (lista) lista.innerHTML = "";
    if (textoReservaMapa) textoReservaMapa.textContent = "Nenhuma reserva agendada.";
    if (listaMapa) listaMapa.innerHTML = "";
    return;
  }

  const primeira = reservas[0];
  const reservaHtml = `
    <strong>Próxima Reserva</strong>
    <p>Estação: ${primeira.estacao}</p>
    <p>Data: ${primeira.data}</p>
    <p>Horário: ${primeira.hora}</p>
  `;

  if (textoReserva) textoReserva.innerHTML = reservaHtml;
  if (textoReservaMapa) textoReservaMapa.innerHTML = reservaHtml;

  if (lista) {
    lista.innerHTML = "";
    reservas.slice(1).forEach(r => {
      const div = document.createElement("div");
      div.classList.add("reserva-item");
      div.innerHTML = `<p><strong>${r.estacao}</strong> - ${r.data} ${r.hora}</p>`;
      lista.appendChild(div);
    });
  }

  if (listaMapa) {
    listaMapa.innerHTML = "";
    reservas.slice(1).forEach(r => {
      const div = document.createElement("div");
      div.classList.add("reserva-item");
      div.innerHTML = `<p><strong>${r.estacao}</strong> - ${r.data} ${r.hora}</p>`;
      listaMapa.appendChild(div);
    });
  }

  const btnDetalhes = document.getElementById("btnDetalhesReserva");
  const btnDetalhesMapa = document.getElementById("btnDetalhesReservaMapa");
  if (btnDetalhes) btnDetalhes.style.display = "inline-block";
  if (btnDetalhesMapa) btnDetalhesMapa.style.display = "inline-block";
}

// ====================================
// Modal de Detalhes da Reserva + Cancelamento
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  const btnDetalhes = document.getElementById("btnDetalhesReserva");
  const btnDetalhesMapa = document.getElementById("btnDetalhesReservaMapa");
  const modalDetalhes = document.getElementById("detalhesReservaModal");
  const listaDetalhes = document.getElementById("listaDetalhesReservas");
  const closeBtn = modalDetalhes ? modalDetalhes.querySelector(".close") : null;

  const confirmarModal = document.getElementById("confirmarCancelamentoModal");
  const btnConfirmar = document.getElementById("btnCancelarConfirmar");
  const btnFechar = document.getElementById("btnCancelarFechar");
  const btnRemoverCanceladas = document.getElementById("btnRemoverCanceladas");

  let reservaIndexParaCancelar = null;

  // 🔹 Atualiza status tanto no usuário quanto na estação (função usada mais abaixo)
  const atualizarStatus = typeof atualizarStatusReservaEstacao === "function"
    ? atualizarStatusReservaEstacao
    : atualizarStatusReserva; // compatibilidade com código antigo

  // 🔹 Função que atualiza no usuário e na estação
  function atualizarStatusReservaEstacao(estacaoEmail, usuarioEmail, data, hora, status) {
    // Atualiza no usuário (mantive sua lógica original)
    const reservasUsuario = JSON.parse(localStorage.getItem(`reservasUsuario_${usuarioEmail}`)) || [];
    const reservaU = reservasUsuario.find(r => r.data === data && r.hora === hora && r.estacaoEmail === estacaoEmail);
    if (reservaU) reservaU.status = status;
    localStorage.setItem(`reservasUsuario_${usuarioEmail}`, JSON.stringify(reservasUsuario));

    // Atualiza na estação
    const reservasEstacao = JSON.parse(localStorage.getItem(`reservasEstacao_${estacaoEmail}`)) || [];
    const reservaE = reservasEstacao.find(r => r.data === data && r.hora === hora && r.usuarioEmail === usuarioEmail);
    if (reservaE) reservaE.status = status;
    localStorage.setItem(`reservasEstacao_${estacaoEmail}`, JSON.stringify(reservasEstacao));
  }

  // utilitário robusto para recuperar dados do veículo
  function getVeiculoForReservation(r) {
    // 1) se já vier na própria reserva, usa direto
    if (r && r.veiculo && typeof r.veiculo === "object") return r.veiculo;

    // 2) tenta vários ids possíveis (prioriza campos da reserva, depois o usuário logado)
    const ids = [];
    if (r) {
      if (r.usuarioEmail) ids.push(r.usuarioEmail);
      if (r.usuario) ids.push(r.usuario);
    }
    const usuarioAtual = localStorage.getItem("usuario");
    const usuarioEmailAtual = localStorage.getItem("usuarioEmail");
    if (usuarioAtual) ids.push(usuarioAtual);
    if (usuarioEmailAtual) ids.push(usuarioEmailAtual);
    const uniqueIds = [...new Set(ids.filter(Boolean))];

    for (const id of uniqueIds) {
      const modelo = localStorage.getItem(`veiculoModelo_${id}`);
      if (modelo && modelo.toString().trim() !== "") {
        return {
          modelo: modelo,
          ano: localStorage.getItem(`veiculoAno_${id}`) || "",
          placa: localStorage.getItem(`veiculoPlaca_${id}`) || "",
          bateria: localStorage.getItem(`veiculoBateria_${id}`) || "",
          carga: localStorage.getItem(`veiculoCarregamento_${id}`) || ""
        };
      }
    }
    return null;
  }

  function renderizarDetalhes() {
    try {
      const reservas = carregarReservas();
      const usuarioAtual = localStorage.getItem("usuario");
      if (!listaDetalhes) return;
      listaDetalhes.innerHTML = "";

      if (reservas.length === 0) {
        listaDetalhes.innerHTML = "<li>Nenhuma reserva encontrada.</li>";
        return;
      }

      const stations = JSON.parse(localStorage.getItem("stations")) || [];
      const favoritos = JSON.parse(localStorage.getItem(`favoritos_${usuarioAtual}`)) || [];

      reservas.forEach((r, idx) => {
        const li = document.createElement("li");

        const linha = document.createElement("div");
        linha.className = "reserva-linha";

        const nome = document.createElement("span");
        nome.className = "reserva-nome";
        nome.textContent = r.estacao;

        const statusSpan = document.createElement("span");
        statusSpan.className = "reserva-status";
        statusSpan.textContent = r.status ? r.status : "pendente";

        const btnCancelar = document.createElement("button");
        btnCancelar.className = "btn-cancelar-reserva";
        btnCancelar.textContent = "Cancelar";
        btnCancelar.dataset.index = idx;

        // ❌ Se já estiver cancelada ou outro status inválido → desativa
        if (r.status && r.status !== "pendente" && r.status !== "confirmada") {
          btnCancelar.disabled = true;
          btnCancelar.textContent = "Indisponível";
        } else {
          btnCancelar.addEventListener("click", () => {
            reservaIndexParaCancelar = idx;
            if (confirmarModal) confirmarModal.style.display = "flex";
          });
        }

        linha.appendChild(nome);
        linha.appendChild(statusSpan);
        linha.appendChild(btnCancelar);

        // 🔹 Busca dados completos
        let estacaoDados = stations.find(e => namesEqual(e.nome, r.estacao))
          || favoritos.find(e => namesEqual(e.nome, r.estacao))
          || (window.estacoes || []).find(e => namesEqual(e.nome, r.estacao))
          || {};

        // 🔹 Pega dados do veículo
        const veiculoObj = getVeiculoForReservation(r);
        let veiculoHtml = "";
        if (veiculoObj) {
          veiculoHtml = `
            <p><strong>Usuário:</strong> ${r.usuario || r.usuarioEmail || localStorage.getItem("usuario")}</p>
            <p><strong>Modelo:</strong> ${veiculoObj.modelo || "N/D"} ${veiculoObj.ano ? `(${veiculoObj.ano})` : ""}</p>
            <p><strong>Placa:</strong> ${veiculoObj.placa || "N/D"}</p>
            <p><strong>Bateria:</strong> ${veiculoObj.bateria || "N/D"}</p>
            <p><strong>Carga:</strong> ${veiculoObj.carga || "N/D"}</p>
          `;
        }

        const detalhes = document.createElement("div");
        detalhes.className = "detalhes-reserva";
        detalhes.innerHTML = `
          <p><strong>Data:</strong> ${r.data}</p>
          <p><strong>Horário:</strong> ${r.hora}</p>
          <p><strong>Status:</strong> ${r.status || "pendente"}</p>
          <p><strong>Endereço:</strong> ${estacaoDados?.rua || "N/D"} ${estacaoDados?.numero || ""}</p>
          <p><strong>Cidade:</strong> ${estacaoDados?.cidade || "N/D"} - ${estacaoDados?.estado || ""}</p>
          <p><strong>Potência Máx:</strong> ${estacaoDados?.potencia ? (estacaoDados.potencia + " kW") : "N/D"}</p>
          <p><strong>Disponibilidade:</strong> ${estacaoDados?.abertura || "?"} - ${estacaoDados?.fechamento || "?"}</p>
          <p><strong>Tempo de Espera:</strong> ${estacaoDados?.tempoEspera ? (estacaoDados.tempoEspera + " min") : "--"}</p>
          <p><strong>Preço:</strong> ${estacaoDados?.preco ? (estacaoDados.preco + " R$/kWh") : "--"}</p>
          ${veiculoHtml}
        `;

        li.appendChild(linha);
        li.appendChild(detalhes);

        listaDetalhes.appendChild(li);
      });
    } catch (err) {
      console.error("Erro em renderizarDetalhes:", err);
      if (listaDetalhes) listaDetalhes.innerHTML = "<li>Erro ao carregar detalhes — veja console.</li>";
    }
  }

  // Confirmar cancelamento (status → cancelada)
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", () => {
      if (reservaIndexParaCancelar !== null) {
        const reservas = carregarReservas();
        const r = reservas[reservaIndexParaCancelar];

        if (r) {
          r.status = "cancelada";
          salvarReservas(reservas);

          // Atualiza também na key da estação (se possível)
          try {
            atualizarStatusReservaEstacao(
              r.estacaoEmail || r.estacao,  // primeiro SEMPRE estação
              r.usuarioEmail || r.usuario,  // segundo SEMPRE usuário
              r.data,
              r.hora,
              "cancelada"
            );
          } catch (e) { /* não crítico */ }

          // ✅ REEMBOLSO FIXO DE R$10
          try {
            const usuarioAtual = localStorage.getItem("usuarioEmail") || "default";
            const carteiraKey = `saldoCarteira_${usuarioAtual}`;
            const transKey = `transacoesCarteira_${usuarioAtual}`;
            let saldoAtual = parseFloat(localStorage.getItem(carteiraKey)) || 0;
            saldoAtual = +(saldoAtual + 10).toFixed(2);
            localStorage.setItem(carteiraKey, saldoAtual);

            const transacoes = JSON.parse(localStorage.getItem(transKey)) || [];
            transacoes.push({ valor: 10, tipo: "Reembolso" }); // ✅ AGORA FICA CORRETO!
            localStorage.setItem(transKey, JSON.stringify(transacoes));

            // 🔔 Atualiza carteira em tempo real
            window.dispatchEvent(new Event("carteiraAtualizada"));

          } catch (e) {
            console.error("Falha ao reembolsar:", e);
          }


          renderizarReservas();
          renderizarDetalhes();
          if (typeof mostrarMensagem === "function") mostrarMensagem("❌ Reserva cancelada. R$10 reembolsados.", "sucesso");
        }
        reservaIndexParaCancelar = null;
      }
      if (confirmarModal) confirmarModal.style.display = "none";
    });
  }

  // Fechar modal de confirmação
  if (btnFechar) {
    btnFechar.addEventListener("click", () => {
      if (confirmarModal) confirmarModal.style.display = "none";
      reservaIndexParaCancelar = null;
    });
  }

  // Remover apenas as reservas canceladas
  if (btnRemoverCanceladas) {
    btnRemoverCanceladas.addEventListener("click", () => {
      let reservas = carregarReservas();
      reservas = reservas.filter(r => r.status !== "cancelada");
      salvarReservas(reservas);
      renderizarReservas();
      renderizarDetalhes();
      if (typeof mostrarMensagem === "function") mostrarMensagem("🗑️ Reservas canceladas removidas.", "sucesso");
    });
  }

  function abrirModal() {
    renderizarDetalhes();
    if (modalDetalhes) modalDetalhes.style.display = "flex";
  }

  if (btnDetalhes) btnDetalhes.addEventListener("click", abrirModal);
  if (btnDetalhesMapa) btnDetalhesMapa.addEventListener("click", abrirModal);

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (modalDetalhes) modalDetalhes.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modalDetalhes) modalDetalhes.style.display = "none";
    if (e.target === confirmarModal) confirmarModal.style.display = "none";
  });
});

// ====================================
// Confirmar Nova Reserva
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  const formAgendamento = document.getElementById("formAgendamento");
  if (!formAgendamento) return;

  formAgendamento.addEventListener("submit", (e) => {
    e.preventDefault();

    try {
      const data = document.getElementById("dataReserva").value;
      const hora = document.getElementById("horaReserva").value;
      const usuarioAtual = localStorage.getItem("usuario");
      const estacaoSel = JSON.parse(localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`));

      if (!data || !hora || !estacaoSel) {
        if (typeof mostrarMensagem === "function") mostrarMensagem("❌ Selecione estação, data e horário!", "erro");
        return;
      }

      // 🔹 garanto usar objeto completo para validar disponibilidade
      const stations = JSON.parse(localStorage.getItem("stations")) || [];
      const estacao = stations.find(s => namesEqual(s.nome, estacaoSel.nome))
        || (window.estacoes || []).find(s => namesEqual(s.nome, estacaoSel.nome))
        || estacaoSel;

      const reservas = carregarReservas();

      // chamar validarDisponibilidade se existir (proteção caso esteja em outro arquivo)
      if (typeof validarDisponibilidade === "function") {
        const resultado = validarDisponibilidade(estacao, data, hora, reservas);
        if (!resultado.disponivel) {
          if (typeof mostrarMensagem === "function") mostrarMensagem("❌ " + resultado.mensagem, "erro");
          return;
        }
      } else {
        console.warn("validarDisponibilidade não encontrada — pulando validação de disponibilidade.");
      }

      // 🔹 Verificação — só deixa reservar se o veículo estiver preenchido
      const usuarioIdParaVeiculo = findUsuarioIdForVeiculo(localStorage.getItem("usuarioEmail") || usuarioAtual);
      if (!dadosVeiculoPreenchidos(usuarioIdParaVeiculo)) {
        if (typeof mostrarMensagem === "function") mostrarMensagem("❌ Preencha as informações do veículo antes de reservar!", "erro");
        return;
      }

// ===========================
// DÉBITO FIXO: R$10,00 (Reserva)
// ===========================
const custoReserva = 10.00;

// ✅ Sempre usar email como chave fixa
const usuarioEmail = localStorage.getItem("usuarioEmail");
const carteiraKey = `saldoCarteira_${usuarioEmail}`;
let saldoAtual = parseFloat(localStorage.getItem(carteiraKey)) || 0;

if (saldoAtual < custoReserva) {
  if (typeof mostrarMensagem === "function") {
    mostrarMensagem("❌ Saldo insuficiente! Recarregue sua carteira com pelo menos R$10.", "erro");
  }
  return;
}

// realiza débito e persiste
saldoAtual = +(saldoAtual - custoReserva).toFixed(2);
localStorage.setItem(carteiraKey, saldoAtual);

const transKey = `transacoesCarteira_${usuarioEmail}`;
const transacoes = JSON.parse(localStorage.getItem(transKey)) || [];
// registra transação negativa com label para reserva (será renderizada pela UI)
transacoes.push({ valor: -custoReserva, tipo: "Reserva" });
localStorage.setItem(transKey, JSON.stringify(transacoes));

// Atualiza imediatamente a UI da carteira, se os elementos existirem na página
try {
  const saldoEl = document.getElementById("saldoCarteira");
  if (saldoEl) saldoEl.innerText = `R$${saldoAtual.toFixed(2)}`;

  const listaTransacoes = document.getElementById("listaTransacoes");
  if (listaTransacoes) {
    listaTransacoes.innerHTML = transacoes.length
      ? transacoes
          .slice()
          .reverse()
          .map((t) => `
    <p class="${t.valor >= 0 ? 'pos' : 'neg'}">
      ${t.valor >= 0 ? '+' : '-'} R$${Math.abs(t.valor).toFixed(2)} (${t.tipo})
    </p>
  `)
          .join("")
      : "<p>Nenhuma transação ainda.</p>";
  }

} catch (e) {
  console.warn("Não foi possível atualizar UI da carteira imediatamente:", e);
}

if (typeof mostrarMensagem === "function") {
  mostrarMensagem(`R$${custoReserva.toFixed(2)} debitados da carteira (Reserva).`, "aviso");
}

      // 🔹 Pega o veículo do usuário atual
      const veiculo = {
        modelo: localStorage.getItem(`veiculoModelo_${usuarioIdParaVeiculo}`) || "",
        ano: localStorage.getItem(`veiculoAno_${usuarioIdParaVeiculo}`) || "",
        placa: localStorage.getItem(`veiculoPlaca_${usuarioIdParaVeiculo}`) || "",
        bateria: localStorage.getItem(`veiculoBateria_${usuarioIdParaVeiculo}`) || "",
        carga: localStorage.getItem(`veiculoCarregamento_${usuarioIdParaVeiculo}`) || ""
      };

      // 📌 Salva reserva normalmente
      reservas.push({
        estacao: estacao.nome,
        estacaoEmail: estacao.email,
        usuario: usuarioAtual,
        usuarioEmail: localStorage.getItem("usuarioEmail") || usuarioAtual,
        data,
        hora,
        status: "pendente",
        veiculo: {
          modelo: localStorage.getItem(`veiculoModelo_${usuarioAtual}`) || "",
          ano: localStorage.getItem(`veiculoAno_${usuarioAtual}`) || "",
          placa: localStorage.getItem(`veiculoPlaca_${usuarioAtual}`) || "",
          bateria: localStorage.getItem(`veiculoBateria_${usuarioAtual}`) || "",
          carga: localStorage.getItem(`veiculoCarregamento_${usuarioAtual}`) || ""
        }
      });
      salvarReservas(reservas);

      // 🔹 Salva também na estação
      let reservasEstacao = JSON.parse(localStorage.getItem(`reservasEstacao_${estacao.email}`)) || [];
      reservasEstacao.push({
        usuarioEmail: usuarioIdParaVeiculo || usuarioAtual,
        data,
        hora,
        status: "pendente",
        veiculo
      });
      localStorage.setItem(`reservasEstacao_${estacao.email}`, JSON.stringify(reservasEstacao));

      renderizarReservas();

      const agendamentoModal = document.getElementById("agendamentoModal");
      if (agendamentoModal) agendamentoModal.style.display = "none";

    } catch (err) {
      console.error("Erro no submit de agendamento:", err);
      if (typeof mostrarMensagem === "function") mostrarMensagem("❌ Erro ao processar a reserva. Veja console.", "erro");
    }
  });
});

// ====================================
// Inicialização Automática
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  try {
    atualizarEstacao();
    renderizarReservas();
  } catch (err) {
    console.error("Erro inicializando reservas:", err);
  }
});
