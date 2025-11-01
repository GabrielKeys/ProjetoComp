// carteira.js (versão com Google Pay TEST + input moeda formatado)
// ----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
// Sempre usar email como chave fixa da carteira
const usuarioAtual = localStorage.getItem("usuarioEmail");
if (!usuarioAtual) {
  console.error("⚠ Nenhum usuarioEmail encontrado no localStorage! A carteira não funcionará sem email.");
}

  // Carrega saldo e transações iniciais (padrão)
  let saldo = parseFloat(localStorage.getItem(`saldoCarteira_${usuarioAtual}`)) || 0;
  let transacoes = JSON.parse(localStorage.getItem(`transacoesCarteira_${usuarioAtual}`)) || [];


  // 🔄 Conversão automática para o novo formato (apenas números → { valor, tipo })
  transacoes = transacoes.map(t => {
    if (typeof t === "number") {
      return { valor: t, tipo: "Recarga" }; // padrão antigo considerado recarga
    }
    return t;
  });

  const saldoEl = document.getElementById("saldoCarteira");
  const listaTransacoes = document.getElementById("listaTransacoes");
  const btnRecarregar = document.getElementById("btnRecarregar");
  const inputValor = document.getElementById("valorRecarga");

  // ===============================
  // Helpers
  // ===============================
  function info(msg, tipo = "sucesso") {
    if (typeof mostrarMensagem === "function") {
      mostrarMensagem(msg, tipo);
    } else {
      alert(msg);
    }
  }

  // Nota: agora esta função RECARREGA os dados do localStorage antes de renderizar,
  // garantindo que atualizações feitas por outros scripts (ex.: reserva.js) apareçam.
  function atualizarCarteiraUI() {
    // recarrega valores atuais do localStorage (mantém consistência entre scripts)
    saldo = parseFloat(localStorage.getItem(`saldoCarteira_${usuarioAtual}`)) || 0;
    transacoes = JSON.parse(localStorage.getItem(`transacoesCarteira_${usuarioAtual}`)) || [];
    transacoes = transacoes.map(t => {
      if (typeof t === "number") return { valor: t, tipo: "Recarga" };
      return t;
    });

    if (saldoEl) saldoEl.innerText = `R$${saldo.toFixed(2)}`;
    if (listaTransacoes) {
      listaTransacoes.innerHTML = transacoes.length
        ? transacoes
            .slice()
            .reverse()
            .map((t) => `
        <p class="${(t.valor || 0) >= 0 ? 'pos' : 'neg'}">
          ${(t.valor || 0) >= 0 ? '+' : '-'} R$${Math.abs(t.valor || 0).toFixed(2)} (${t.tipo || 'Transação'})
        </p>
      `)
            .join("")
        : "<p>Nenhuma transação ainda.</p>";
    }
  }
  atualizarCarteiraUI();

  // Atualiza quando outra parte do sistema avisar
  window.addEventListener("carteiraAtualizada", atualizarCarteiraUI);

  function persistir() {
    localStorage.setItem(`saldoCarteira_${usuarioAtual}`, saldo);
    localStorage.setItem(`transacoesCarteira_${usuarioAtual}`, JSON.stringify(transacoes));
  }

  function recarregarLocal(valor) {
    salvarRecargaBackend(valor); // tenta reenviar se backend estiver disponível
    transacoes.push({ valor: valor, tipo: "Recarga" });
    persistir();
    atualizarCarteiraUI();
    info(`✅ Recarga de R$${valor.toFixed(2)} aplicada (modo local).`, "sucesso");
  }

  // ===============================
  // Input de moeda formatado (BRL)
  // ===============================
  if (inputValor) {
    inputValor.value = "R$ 0,00"; // inicia formatado

    inputValor.addEventListener("input", () => {
      let valor = inputValor.value.replace(/\D/g, ""); // só números
      if (!valor) valor = "0";

      // divide centavos
      valor = (parseInt(valor, 10) / 100).toFixed(2);

      // aplica formatação BRL
      inputValor.value = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(valor);
    });
  }

// ===============================
  // Banco de dados
  // ===============================
  async function salvarRecargaBackend(valor) {
  const email = localStorage.getItem("usuarioEmail");
  try {
    const res = await fetch(`${API_BASE}/wallet/recharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, amount: valor }),
    });

    if (!res.ok) throw new Error("Falha ao registrar recarga no backend");

    const data = await res.json();
    console.log("✅ Recarga salva no banco:", data);
    info(`✅ Recarga de R$${valor.toFixed(2)} salva no servidor.`, "sucesso");
  } catch (err) {
    console.warn("⚠️ Falha ao salvar no backend, usando localStorage:", err);
    recarregarLocal(valor); // fallback
  }
}

  // ===============================
  // Google Pay
  // ===============================
  function waitForGooglePay(timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const intervalMs = 100;
      let waited = 0;

      if (window.google && google.payments && google.payments.api) {
        resolve(true);
        return;
      }

      const iv = setInterval(() => {
        waited += intervalMs;
        if (window.google && google.payments && google.payments.api) {
          clearInterval(iv);
          resolve(true);
        } else if (waited >= timeoutMs) {
          clearInterval(iv);
          reject(new Error("Google Pay não carregou dentro do timeout."));
        }
      }, intervalMs);
    });
  }

  async function iniciarGooglePay(valor) {
    try {
      await waitForGooglePay(5000);
    } catch (err) {
      console.warn("Google Pay não disponível:", err);
      info("Google Pay não carregou — aplicando recarga local (modo teste).", "aviso");
      recarregarLocal(valor);
      return;
    }

    try {
      const paymentsClient = new google.payments.api.PaymentsClient({ environment: "TEST" });

      const baseRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
      };

      const allowedCardNetworks = ["VISA", "MASTERCARD"];
      const allowedAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];

      const tokenizationSpecification = {
        type: "PAYMENT_GATEWAY",
        parameters: {
          gateway: "example",
          gatewayMerchantId: "exampleGatewayMerchantId",
        },
      };

      const cardPaymentMethod = {
        type: "CARD",
        parameters: {
          allowedAuthMethods,
          allowedCardNetworks,
        },
        tokenizationSpecification: tokenizationSpecification,
      };

      const paymentDataRequest = Object.assign({}, baseRequest, {
        allowedPaymentMethods: [cardPaymentMethod],
        transactionInfo: {
          totalPriceStatus: "FINAL",
          totalPrice: valor.toFixed(2),
          currencyCode: "BRL",
          countryCode: "BR",
        },
        merchantInfo: {
          merchantName: "VoltWay (Teste)",
        },
      });

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
      console.log("Google Pay - paymentData:", paymentData);

      salvarRecargaBackend(valor); // tenta reenviar se backend estiver disponível
      
      transacoes.push({ valor: valor, tipo: "Recarga" }); 
      persistir();
      atualizarCarteiraUI();
      info(`✅ Recarga de R$${valor.toFixed(2)} realizada com sucesso.`, "sucesso");
    } catch (err) {
      console.error("loadPaymentData erro:", err);
      info("❌ Pagamento cancelado ou não autorizado.", "erro");
    }
  }

  // ===============================
  // Botão Recarregar
  // ===============================
  if (btnRecarregar) {
    btnRecarregar.addEventListener("click", (ev) => {
      ev.preventDefault();
      if (!inputValor) {
        info("Campo de valor não encontrado.", "erro");
        return;
      }

      // pega só dígitos e divide por 100
      let valor = inputValor.value.replace(/\D/g, "");
      valor = parseFloat(valor) / 100;

      if (isNaN(valor) || valor <= 0) {
        info("Digite um valor válido para recarga.", "erro");
        return;
      }

      iniciarGooglePay(valor);
      inputValor.value = "R$ 0,00"; // resetar
    });
  } else {
    console.warn("Botão #btnRecarregar não encontrado no DOM.");
  }
});
