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
