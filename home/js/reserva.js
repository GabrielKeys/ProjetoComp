// ====================================
// Atualizar estatísticas da estação
// ====================================
function atualizarEstacao() {
  const usuarioAtual = localStorage.getItem("usuario");
  const estacao = JSON.parse(localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`));

  const statPotencia = document.getElementById("statPotencia");
  const statEspera = document.getElementById("statEspera");
  const statDisponibilidade = document.getElementById("statDisponibilidade");
  const stationMsg = document.getElementById("stationMsg");
  const btnAgendar = document.getElementById("btnAgendar");

  if (estacao) {
    if (statPotencia) statPotencia.textContent = estacao.potencia || "--";
    if (statEspera) statEspera.textContent = estacao.tempoEspera || "--";
    if (statDisponibilidade) statDisponibilidade.textContent = `${estacao.abertura} - ${estacao.fechamento}`;
    if (stationMsg) stationMsg.textContent = `Estação selecionada: ${estacao.nome}`;
    if (btnAgendar) btnAgendar.disabled = false;
  } else {
    if (statPotencia) statPotencia.textContent = "--";
    if (statEspera) statEspera.textContent = "--";
    if (statDisponibilidade) statDisponibilidade.textContent = "--";
    if (stationMsg) stationMsg.textContent = "Nenhuma estação de recarga selecionada.";
    if (btnAgendar) btnAgendar.disabled = true;
  }
}

// ====================================
// Modal de Seleção de Estação (versão final organizada)
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

  // Renderiza lista
  function renderizarLista() {
    if (!listaEstacoes) return;
    listaEstacoes.innerHTML = "";

    favoritos = carregarFavoritos();
    favoritosVisuais = favoritos.map(() => true);

    if (favoritos.length === 0) {
      listaEstacoes.innerHTML = "<li>Nenhuma estação favoritada ainda.</li>";
      return;
    }

    favoritos.forEach((estacao, idx) => {
      const li = document.createElement("li");
      li.className = "estacao-item";

      // Linha principal
      const linha = document.createElement("div");
      linha.className = "estacao-linha";

      const nome = document.createElement("span");
      nome.className = "estacao-nome";
      nome.textContent = estacao.nome;

      const acoes = document.createElement("div");
      acoes.className = "estacao-acoes";

      // Estrela
      const estrela = document.createElement("span");
      estrela.className = "estrela-modal favorita";
      estrela.title = "Clique para desfavoritar";
      estrela.style.backgroundImage = "url('../assets/estrela.png')";
      if (!favoritosVisuais[idx]) estrela.classList.remove("favorita");

      estrela.addEventListener("click", (e) => {
        e.stopPropagation();
        favoritosVisuais[idx] = !favoritosVisuais[idx];
        estrela.classList.toggle("favorita", favoritosVisuais[idx]);

        // 🔹 Mensagem igual ao mapa
        if (favoritosVisuais[idx]) {
          mostrarMensagem(`${estacao.nome} adicionada aos favoritos!`, "sucesso", true);
        } else {
          mostrarMensagem(`${estacao.nome} removida dos favoritos.`, "erro", true);
        }
      });

      // Botão Selecionar
      const btnSelect = document.createElement("button");
      btnSelect.className = "btn-selecionar-estacao";
      btnSelect.textContent = "Selecionar";
      btnSelect.addEventListener("click", (e) => {
        e.stopPropagation();
        localStorage.setItem(`estacaoSelecionada_${usuarioAtual}`, JSON.stringify(estacao));
        salvarFavoritosEFechar();
      });

      acoes.appendChild(btnSelect);
      acoes.appendChild(estrela);

      linha.appendChild(nome);
      linha.appendChild(acoes);

      // "Ver detalhes"
      const verDetalhes = document.createElement("p");
      verDetalhes.className = "ver-detalhes";
      verDetalhes.textContent = "Ver detalhes";

      const detalhes = document.createElement("div");
      detalhes.className = "detalhes-estacao";
      detalhes.innerHTML = `
        <p><strong>Endereço:</strong> ${estacao.rua || "N/D"} ${estacao.numero || ""}</p>
        <p><strong>Cidade:</strong> ${estacao.cidade || "N/D"} ${estacao.estado || ""}</p>
        <p><strong>Potência:</strong> ${estacao.potencia || "N/A"}</p>
        <p><strong>Horário:</strong> ${estacao.abertura || "?"} - ${estacao.fechamento || "?"}</p>
      `;
      verDetalhes.addEventListener("click", (e) => {
        e.stopPropagation();
        detalhes.classList.toggle("ativo");
      });

      li.appendChild(linha);
      li.appendChild(verDetalhes);
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

  renderizarLista();
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

function renderizarReservas() {
  const reservas = carregarReservas();

  // Home
  const textoReserva = document.getElementById("textoReserva");
  const lista = document.getElementById("listaReservas");

  // Mapa
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

  // Botão de detalhes (home e mapa)
  const btnDetalhes = document.getElementById("btnDetalhesReserva");
  const btnDetalhesMapa = document.getElementById("btnDetalhesReservaMapa");

  if (btnDetalhes) btnDetalhes.style.display = "inline-block";
  if (btnDetalhesMapa) btnDetalhesMapa.style.display = "inline-block";
}

// ====================================
// Confirmar Nova Reserva
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  const formAgendamento = document.getElementById("formAgendamento");
  if (!formAgendamento) return;

  formAgendamento.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = document.getElementById("dataReserva").value;
    const hora = document.getElementById("horaReserva").value;
    const usuarioAtual = localStorage.getItem("usuario");
    const estacao = JSON.parse(localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`));

    if (!data || !hora || !estacao) {
      mostrarMensagem("❌ Selecione estação, data e horário!", "erro");
      return;
    }

    const reservas = carregarReservas();

    // ✅ validar disponibilidade antes de salvar
    const resultado = validarDisponibilidade(estacao, data, hora, reservas);
    if (!resultado.disponivel) {
      mostrarMensagem("❌ " + resultado.mensagem, "erro");
      return;
    }

    reservas.push({ estacao: estacao.nome, data, hora });
    salvarReservas(reservas);
    renderizarReservas();

    const agendamentoModal = document.getElementById("agendamentoModal");
    if (agendamentoModal) agendamentoModal.style.display = "none";

    mostrarMensagem("✅ Reserva realizada com sucesso!", "sucesso");
  });
});

// ====================================
// Inicialização Automática
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  atualizarEstacao();
  renderizarReservas();
});
