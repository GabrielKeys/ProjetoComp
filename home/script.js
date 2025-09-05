// ---- Função de logout ----
function logout() {
  localStorage.removeItem("logado");
  localStorage.removeItem("usuario");
  window.location.href = "../login/login.html";
}

// ---- Atualizar estatísticas da estação ----
function atualizarEstacao() {
  const usuarioAtual = localStorage.getItem("usuario");
  const estacao = JSON.parse(localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`));

  const statPotencia = document.getElementById("statPotencia");
  const statEspera = document.getElementById("statEspera");
  const statDisponibilidade = document.getElementById("statDisponibilidade");
  const statEnergia = document.getElementById("statEnergia");
  const stationMsg = document.getElementById("stationMsg");

  if (estacao) {
    statPotencia.textContent = estacao.potencia || "--";
    statEspera.textContent = estacao.tempoEspera || "--";
    statDisponibilidade.textContent = estacao.disponibilidade || "--";
    statEnergia.textContent = estacao.energia || "--";
    stationMsg.textContent = `Estação selecionada: ${estacao.nome}`;
  } else {
    statPotencia.textContent = "--";
    statEspera.textContent = "--";
    statDisponibilidade.textContent = "--";
    statEnergia.textContent = "--";
    stationMsg.textContent = "Nenhuma estação de recarga selecionada.";
  }
}

// ---- Inicialização geral ----
document.addEventListener("DOMContentLoaded", () => {
  const logado = localStorage.getItem("logado");
  const usuario = localStorage.getItem("usuario");

  if (!logado || !usuario) {
    window.location.href = "../login/login.html";
    return;
  }

  const usuarioAtual = usuario;

  // Nome formatado do usuário
  const nomeFormatado = usuario.charAt(0).toUpperCase() + usuario.slice(1);
  const nomeUsuario = document.getElementById("nomeUsuario");
  if (nomeUsuario) {
    nomeUsuario.innerHTML = `<span class="online-dot"></span> ${nomeFormatado} <span class="settings-icon">⚙️</span>`;
  }

  // -----------------------------
  // Veículo (dados por usuário)
  // -----------------------------
  const info = document.querySelector(".vehicle-info").querySelectorAll("p");
  info[0].innerText = "Modelo: " + (localStorage.getItem(`veiculoModelo_${usuarioAtual}`) || "Veículo Elétrico");
  info[1].innerText = "Ano: " + (localStorage.getItem(`veiculoAno_${usuarioAtual}`) || "----");
  info[2].innerText = "Bateria: " + (localStorage.getItem(`veiculoBateria_${usuarioAtual}`) || "-- kWh");
  info[3].innerText = "Carregando: " + (localStorage.getItem(`veiculoCarregamento_${usuarioAtual}`) || "---- kW");

  const modal = document.getElementById("editModal");
  const settingsIcon = document.querySelector(".settings-icon");
  const closeBtn = document.querySelector(".close");
  const editForm = document.getElementById("editForm");

  if (settingsIcon) {
    settingsIcon.addEventListener("click", () => {
      document.getElementById("editModelo").value = localStorage.getItem(`veiculoModelo_${usuarioAtual}`) || "Veículo Elétrico";
      document.getElementById("editAno").value = localStorage.getItem(`veiculoAno_${usuarioAtual}`) || "2023";
      document.getElementById("editBateria").value = localStorage.getItem(`veiculoBateria_${usuarioAtual}`) || "0,3 kWh";
      document.getElementById("editCarregamento").value = localStorage.getItem(`veiculoCarregamento_${usuarioAtual}`) || "170 kW";
      modal.style.display = "flex";
    });
  }
  if (closeBtn) closeBtn.onclick = () => (modal.style.display = "none");
  if (editForm) {
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();
      localStorage.setItem(`veiculoModelo_${usuarioAtual}`, document.getElementById("editModelo").value);
      localStorage.setItem(`veiculoAno_${usuarioAtual}`, document.getElementById("editAno").value);
      localStorage.setItem(`veiculoBateria_${usuarioAtual}`, document.getElementById("editBateria").value);
      localStorage.setItem(`veiculoCarregamento_${usuarioAtual}`, document.getElementById("editCarregamento").value);
      modal.style.display = "none";
      location.reload();
    });
  }

  // -----------------------------
  // Carteira (dados por usuário)
  // -----------------------------
  let saldo = parseFloat(localStorage.getItem(`saldoCarteira_${usuarioAtual}`)) || 0;
  let transacoes = JSON.parse(localStorage.getItem(`transacoesCarteira_${usuarioAtual}`)) || [];
  const saldoEl = document.getElementById("saldoCarteira");
  const listaTransacoes = document.getElementById("listaTransacoes");
  const btnRecarregar = document.getElementById("btnRecarregar");
  const inputValor = document.getElementById("valorRecarga");

  function atualizarCarteiraUI() {
    saldoEl.innerText = `R$${saldo.toFixed(2)}`;
    listaTransacoes.innerHTML = transacoes.length
      ? transacoes.slice().reverse().map(t => `<p class="pos">+ R$${t.toFixed(2)} (Recarga)</p>`).join("")
      : "<p>Nenhuma transação ainda.</p>";
  }
  atualizarCarteiraUI();

  if (btnRecarregar) {
    btnRecarregar.addEventListener("click", () => {
      const valor = parseFloat(inputValor.value);
      if (!isNaN(valor) && valor > 0) {
        saldo += valor;
        transacoes.push(valor);

        localStorage.setItem(`saldoCarteira_${usuarioAtual}`, saldo);
        localStorage.setItem(`transacoesCarteira_${usuarioAtual}`, JSON.stringify(transacoes));

        inputValor.value = "";
        atualizarCarteiraUI();
      } else {
        alert("Digite um valor válido para recarga!");
      }
    });
  }

  // -----------------------------
  // Estação
  // -----------------------------
  atualizarEstacao();
});

// Lista de estações fictícias
const estacoesFicticias = [
  { nome: "Estação Central", potencia: "150 kW", tempoEspera: "10 min", disponibilidade: "24/7", energia: "100% Verde" },
  { nome: "Shopping Center", potencia: "90 kW", tempoEspera: "15 min", disponibilidade: "6h - 23h", energia: "80% Verde" },
  { nome: "Posto Rodovia", potencia: "200 kW", tempoEspera: "5 min", disponibilidade: "24/7", energia: "95% Verde" }
];

// Modal e seleção de estação
document.addEventListener("DOMContentLoaded", () => {
  const usuarioAtual = localStorage.getItem("usuario");
  const btnSelecionar = document.getElementById("btnSelecionarEstacao");
  const modal = document.getElementById("stationModal");
  const closeBtn = modal ? modal.querySelector(".close") : null;
  const listaEstacoes = document.getElementById("listaEstacoes");

  if (listaEstacoes) {
    listaEstacoes.innerHTML = "";
    estacoesFicticias.forEach(estacao => {
      const li = document.createElement("li");
      li.textContent = estacao.nome;
      li.addEventListener("click", () => {
        localStorage.setItem(`estacaoSelecionada_${usuarioAtual}`, JSON.stringify(estacao));
        modal.style.display = "none";
        atualizarEstacao();
      });
      listaEstacoes.appendChild(li);
    });
  }

  if (btnSelecionar) {
    btnSelecionar.addEventListener("click", () => {
      modal.style.display = "flex";
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
});
