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

  const conflito = reservasExistentes.find(r =>
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
