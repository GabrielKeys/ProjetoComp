// Converte "HH:MM" para minutos
function horaParaMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

// Verifica se horário está dentro da disponibilidade
function estaDentroDoHorario(horaVal, abertura, fechamento) {
  const hora = horaParaMinutos(horaVal);
  const ini = horaParaMinutos(abertura);
  const fim = horaParaMinutos(fechamento);

  if (ini < fim) {
    return hora >= ini && hora <= fim;
  } else {
    return hora >= ini || hora <= fim; // atravessa a meia-noite
  }
}

// Função principal de validação de disponibilidade
function validarDisponibilidade(estacao, data, hora, reservasExistentes = []) {
  if (!estaDentroDoHorario(hora, estacao.abertura, estacao.fechamento)) {
    return {
      disponivel: false,
      mensagem: `A estação ${estacao.nome} só funciona entre ${estacao.abertura} e ${estacao.fechamento}.`
    };
  }

  // ⬇️ Filtra apenas reservas ATIVAS (ignora canceladas)
  const reservasAtivas = reservasExistentes.filter(r => r.status !== "cancelada");

  const conflito = reservasAtivas.find(r =>
    r.estacao === estacao.nome &&
    r.data === data &&
    r.hora === hora
  );

  if (conflito) {
    return {
      disponivel: false,
      mensagem: `Já existe uma reserva para ${hora} em ${estacao.nome}.`
    };
  }

  return { disponivel: true, mensagem: "Horário disponível ✅" };
}


// ---- Bloqueio de datas e horas inválidas ----
document.addEventListener("DOMContentLoaded", () => {
  const formAgendamento = document.getElementById("formAgendamento");
  const inputData = document.getElementById("dataReserva");
  const inputHora = document.getElementById("horaReserva");

  if (!formAgendamento || !inputData || !inputHora) return;

  const MARGIN_MINUTES = 5;
  const pad2 = n => String(n).padStart(2, "0");

  const toDateLocalString = (d) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const toTimeLocalString = (d) =>
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

  const hoje = new Date();
  const hojeStr = toDateLocalString(hoje);
  inputData.setAttribute("min", hojeStr);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  inputData.setAttribute("max", toDateLocalString(maxDate));

  function atualizarMinHoraParaData(dateStr) {
    if (!dateStr) {
      inputHora.removeAttribute("min");
      inputHora.setCustomValidity("");
      return;
    }
    if (dateStr === hojeStr) {
      const agora = new Date();
      agora.setMinutes(agora.getMinutes() + MARGIN_MINUTES);
      const horaMin = toTimeLocalString(agora);
      inputHora.setAttribute("min", horaMin);

      if (inputHora.value && inputHora.value < horaMin) {
        inputHora.value = horaMin;
      }
    } else {
      inputHora.removeAttribute("min");
      inputHora.setCustomValidity("");
    }
  }

  atualizarMinHoraParaData(inputData.value || hojeStr);

  inputData.addEventListener("change", (e) => {
    atualizarMinHoraParaData(e.target.value);
  });

  inputHora.addEventListener("input", () => {
    const dataSelecionada = inputData.value || hojeStr;
    if (dataSelecionada === hojeStr) {
      const agora = new Date();
      agora.setMinutes(agora.getMinutes() + MARGIN_MINUTES);
      const horaMin = toTimeLocalString(agora);

      if (inputHora.value && inputHora.value < horaMin) {
        inputHora.setCustomValidity(
          `❌ Horário inválido — escolha a partir de ${horaMin} (agora + ${MARGIN_MINUTES} min).`
        );
      } else {
        inputHora.setCustomValidity("");
      }
    } else {
      inputHora.setCustomValidity("");
    }
  });

  // Corrigido: alerta ao faltar data/hora
  formAgendamento.addEventListener("submit", (e) => {
    const dataVal = inputData.value;
    const horaVal = inputHora.value;

    if (!dataVal || !horaVal) {
      e.preventDefault();
      mostrarMensagem("❌ Preencha data e hora antes de confirmar a reserva.", "erro");
      return;
    }

  });

});
// ===============================
// Carregar favoritos no painel de validação
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("listaFavoritos");
  const favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

  if (!container) return;

  container.innerHTML = "";

  if (favoritos.length === 0) {
    container.innerHTML = "<p>Nenhuma estação favoritada ainda.</p>";
    mostrarMensagem("Nenhuma estação favoritada encontrada.", "aviso");
    return;
  }

  favoritos.forEach(estacao => {
    const div = document.createElement("div");
    div.classList.add("estacao-card");
    div.style.border = "1px solid #ccc";
    div.style.padding = "10px";
    div.style.marginBottom = "8px";
    div.style.borderRadius = "8px";
    div.style.background = "#f9f9f9";

    div.innerHTML = `
      <b>${estacao.nome}</b><br>
      ${estacao.rua || ""} ${estacao.numero || ""} - ${estacao.cidade || ""} ${estacao.estado || ""}<br>
      Potência: ${estacao.potencia || "N/D"}<br>
      Tempo de espera: ${estacao.tempoEspera || "N/D"}<br>
      Horário: ${estacao.abertura || "N/D"} - ${estacao.fechamento || "N/D"}<br>
    `;

    container.appendChild(div);
  });

  mostrarMensagem(`${favoritos.length} estação(ões) favoritada(s) carregada(s).`, "sucesso");
});

// ===============================
// Escolha de horarios padronizada
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const selectHora = document.getElementById("horaReserva");
  const wrapper = document.querySelector(".select-wrapper");
  const overlay = document.querySelector(".click-overlay");

  // Gerar opções
  for (let h = 0; h < 24; h++) {
    ["00", "30"].forEach(m => {
      const option = document.createElement("option");
      option.value = `${String(h).padStart(2, "0")}:${m}`;
      option.textContent = `${String(h).padStart(2, "0")}:${m}`;
      selectHora.appendChild(option);
    });
  }

  overlay.addEventListener("click", () => {
    wrapper.classList.add("open");
    selectHora.setAttribute("size", "6");
    selectHora.focus();
  });

  selectHora.addEventListener("change", () => {
    wrapper.classList.remove("open");
    selectHora.removeAttribute("size");
  });

  selectHora.addEventListener("blur", () => {
    wrapper.classList.remove("open");
    selectHora.removeAttribute("size");
  });
});

// ====================== helpers ======================
function pad2(n) { return String(n).padStart(2, "0"); }
function minutosParaHora(min) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}
function horaParaMinutos(hora) {
  const [hh, mm] = (hora || "00:00").split(":").map(Number);
  return hh * 60 + mm;
}

// Checa se dois intervalos [a1,a2] e [b1,b2] se sobrepõem (inclusive)
function intervalosSeSobrepoem(a1, a2, b1, b2) {
  return !(a2 < b1 || a1 > b2);
}

// Normaliza reserva antiga (compatibilidade)
// Se reserva tem inicio/fim usa eles, se tem apenas hora assume 60min de duração
function reservaToInterval(r) {
  if (!r) return null;

  // se já tem início/fim em string "HH:MM"
  if (r.inicio && r.fim) {
    return { inicioMin: horaParaMinutos(r.inicio), fimMin: horaParaMinutos(r.fim) };
  }

  // se já salvou em minutos (compatibilidade)
  if (typeof r.inicioMin === "number" && typeof r.fimMin === "number") {
    return { inicioMin: r.inicioMin, fimMin: r.fimMin };
  }

  // se salvou duracao em minutos junto com hora
  if (r.hora && typeof r.duracaoMin === "number") {
    const inicioMin = horaParaMinutos(r.hora);
    return { inicioMin, fimMin: inicioMin + Number(r.duracaoMin) };
  }

  // se só tem hora (legado) assume 60 min
  if (r.hora) {
    const inicioMin = horaParaMinutos(r.hora);
    return { inicioMin, fimMin: inicioMin + 60 };
  }

  return null;
}


// --- BLOCO FINAL: atualização de horários que considera duração das reservas ---
document.addEventListener("DOMContentLoaded", () => {
  const selectHora = document.getElementById("horaReserva");
  const inputData = document.getElementById("dataReserva");
  let durHoras = document.getElementById("duracaoHoras");
  let durMin = document.getElementById("duracaoMinutos");

  if (!selectHora || !inputData) return;

  // Se os selects de duração não existirem, cria / popula aqui para garantir ordem
  if (!durHoras) {
    durHoras = document.createElement("select");
    durHoras.id = "duracaoHoras";
    // você pode inserir no DOM onde fizer sentido; aqui apenas evita quebrar a lógica
    const form = document.getElementById("formAgendamento");
    if (form) form.querySelector("div")?.prepend(durHoras);
  }
  if (!durMin) {
    durMin = document.createElement("select");
    durMin.id = "duracaoMinutos";
    const o0 = document.createElement("option"); o0.value = "0"; o0.textContent = "00";
    const o30 = document.createElement("option"); o30.value = "30"; o30.textContent = "30";
    durMin.appendChild(o0); durMin.appendChild(o30);
    const form = document.getElementById("formAgendamento");
    if (form) form.querySelector("div")?.appendChild(durMin);
  }

  // popula horas 1..8 (se estiver vazio)
  if (durHoras && durHoras.options.length === 0) {
    for (let i = 1; i <= 8; i++) {
      const o = document.createElement("option");
      o.value = String(i);
      o.textContent = `${i} h`;
      durHoras.appendChild(o);
    }
  }

  // Função que atualiza o selectHora bloqueando slots que conflitam com reservas existentes e com a duração selecionada
  function atualizarHorarios() {
    const dataSelecionada = inputData.value;
    const usuarioAtual = localStorage.getItem("usuario") || localStorage.getItem("usuarioEmail") || "";
    const estacaoSelRaw = localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`);
    const estacaoSelecionada = estacaoSelRaw ? JSON.parse(estacaoSelRaw) : {};

    const keyGlobais = `reservasGlobais_${getEstacaoKey(estacaoSelecionada)}`;
    const reservasGlobais = JSON.parse(localStorage.getItem(keyGlobais) || "[]");
    const usuarioReservas = JSON.parse(localStorage.getItem(`reservas_${usuarioAtual}`) || "[]");
    const reservasCompletas = [...reservasGlobais, ...usuarioReservas];

    // cria intervalos em minutos para a data selecionada
    const intervalos = reservasCompletas
      .filter(r => r && r.status !== "cancelada" && r.data === dataSelecionada)
      .map(r => reservaToInterval(r))
      .filter(Boolean);

    // duração selecionada (minutos)
    const durHorasSel = parseInt(durHoras?.value || "1", 10) || 1;
    const durMinSel = parseInt(durMin?.value || "0", 10) || 0;
    const durTotalSel = durHorasSel * 60 + durMinSel;

    // preserve selected value se possível
    const prevSelected = selectHora.value;

    // rebuild options (00/30)
    selectHora.innerHTML = "";
    for (let h = 0; h < 24; h++) {
      ["00", "30"].forEach(m => {
        const horario = `${String(h).padStart(2, "0")}:${m}`;
        const option = document.createElement("option");
        option.value = horario;
        option.textContent = horario;

        if (dataSelecionada && intervalos.length > 0) {
          const minHorario = horaParaMinutos(horario);
          const fimSelecao = minHorario + durTotalSel;

          // detecta sobreposição: [minHorario, fimSelecao) com [iv.inicioMin, iv.fimMin)
          const conflita = intervalos.some(iv => (fimSelecao > iv.inicioMin && minHorario < iv.fimMin));

          if (conflita) {
            option.disabled = true;
            option.style.background = "#f8d7da";
            option.style.color = "#721c24";
          }
        }

        selectHora.appendChild(option);
      });
    }

    // tenta restaurar seleção anterior — mesmo se inválida
    if (prevSelected) {
      selectHora.value = prevSelected;
      const opt = Array.from(selectHora.options).find(o => o.value === prevSelected);
      if (opt && opt.disabled) {
        mostrarMensagem(`❌ O horário ${prevSelected} não está disponível para a duração escolhida.`, "erro");
        botaoConfirmar.disabled = true;
      }
    }

  }

  // listeners
  inputData.addEventListener("change", atualizarHorarios);
  durHoras.addEventListener("change", atualizarHorarios);
  durMin.addEventListener("change", atualizarHorarios);

  // Atualiza imediatamente
  setTimeout(atualizarHorarios, 0);
});

// Referências
const botaoConfirmar = document.querySelector("#formAgendamento button[type='submit']");

// Função principal de validação de conflito em tempo real
function verificarConflito() {
  const dataVal = inputData.value;
  const horaVal = selectHora.value;
  if (!dataVal || !horaVal) {
    botaoConfirmar.disabled = true;
    return;
  }

  const usuarioAtual = localStorage.getItem("usuario") || localStorage.getItem("usuarioEmail") || "";
  const estacaoSelRaw = localStorage.getItem(`estacaoSelecionada_${usuarioAtual}`);
  const estacaoSelecionada = estacaoSelRaw ? JSON.parse(estacaoSelRaw) : {};

  const keyGlobais = `reservasGlobais_${getEstacaoKey(estacaoSelecionada)}`;
  const reservasGlobais = JSON.parse(localStorage.getItem(keyGlobais) || "[]");
  const usuarioReservas = JSON.parse(localStorage.getItem(`reservas_${usuarioAtual}`) || "[]");
  const reservasCompletas = [...reservasGlobais, ...usuarioReservas];

  const inicioMin = horaParaMinutos(horaVal);
  const durH = parseInt(durHoras?.value || "1", 10);
  const durM = parseInt(durMin?.value || "0", 10);
  const fimMin = inicioMin + (durH * 60 + durM);

  const conflitos = reservasCompletas
    .filter(r => r.data === dataVal)
    .map(r => reservaToInterval(r))
    .filter(Boolean);

  const bateComOutroHorario = conflitos.some(iv => {
    const inicioPermitido = iv.inicioMin - 30;
    return !(fimMin <= inicioPermitido || inicioMin >= iv.fimMin);
  });

  if (bateComOutroHorario) {
  botaoConfirmar.disabled = true;
  selectHora.setCustomValidity("Horário em conflito com outra reserva.");
  mostrarMensagem(`❌ A reserva não cabe nesse horário — ajuste o horário ou a duração.`, "erro");
} else {
  botaoConfirmar.disabled = false;
  selectHora.setCustomValidity("");
}
}

// 🧲 Adicionar listeners reativos
inputData.addEventListener("change", verificarConflito);
selectHora.addEventListener("change", verificarConflito);
durHoras.addEventListener("change", verificarConflito);
durMin.addEventListener("change", verificarConflito);
