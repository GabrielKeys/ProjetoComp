document.addEventListener("DOMContentLoaded", () => {
  // ======================================
  // Verifica se há um usuário logado
  // ======================================
  const usuarioAtual = localStorage.getItem("usuarioEmail");
  if (!usuarioAtual) {
    console.error("⚠ Nenhum usuarioEmail encontrado no localStorage!");
    return;
  }

  let saldo = 0;
  let transacoes = [];

  const saldoEl = document.getElementById("saldoCarteira");
  const listaTransacoes = document.getElementById("listaTransacoes");
  const btnRecarregar = document.getElementById("btnRecarregar");
  const inputValor = document.getElementById("valorRecarga");

  // ======================================
  // Helpers
  // ======================================
  function info(msg, tipo = "sucesso") {
    if (typeof mostrarMensagem === "function") {
      mostrarMensagem(msg, tipo);
    } else {
      alert(msg);
    }
  }

// Atualiza a interface da carteira (saldo e transações)
function atualizarCarteiraUI() {
  if (saldoEl) saldoEl.innerText = `R$${saldo.toFixed(2)}`;
  if (listaTransacoes) {
    listaTransacoes.innerHTML = transacoes.length
      ? transacoes
          .map(
            (t) => `
            <p class="${(t.amount || 0) >= 0 ? 'pos' : 'neg'}">
              ${(t.amount || 0) >= 0 ? "+" : "-"} 
              R$${Math.abs(t.amount || 0).toFixed(2)} 
              (${t.type || "Transação"})
            </p>`
          )
          .join("")
      : "<p>Nenhuma transação ainda.</p>";
  }
}

  // ======================================
  // Busca saldo e transações do backend
  // ======================================
  async function obterDadosDaCarteira() {
    try {
      const res = await fetch(`${API_BASE}/wallet/${usuarioAtual}`);
      if (!res.ok) throw new Error("Falha ao obter dados da carteira");
      const data = await res.json();

      saldo = data.wallet.balance;
      transacoes = data.transactions || [];

      atualizarCarteiraUI();
    } catch (err) {
      console.error("Erro ao atualizar os dados da carteira:", err);
      info("❌ Erro ao carregar dados da carteira.", "erro");
    }
  }

  // Carrega a carteira ao iniciar
  obterDadosDaCarteira();

  // ======================================
  // Função para recarregar no banco de dados
  // ======================================
  async function recarregarBackend(valor) {
    const email = usuarioAtual;
    try {
      const res = await fetch(`${API_BASE}/wallet/recharge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, amount: valor }),
      });

      const data = await res.json();
      console.log("✅ Resposta do backend:", data);

      // Corrige o campo retornado (usa new_balance)
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Falha ao registrar recarga no backend");
      }

      saldo = data.new_balance || saldo;
      // Atualiza transações com uma nova chamada ao backend
      await obterDadosDaCarteira();

      info(`✅ Recarga de R$${valor.toFixed(2)} salva no servidor.`, "sucesso");
    } catch (err) {
      console.error("⚠️ Falha ao salvar no backend:", err);
      info(`❌ Falha ao registrar a recarga no servidor: ${err.message}`, "erro");
    }
  }

  // ======================================
  // Google Pay
  // ======================================
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
      info("Google Pay não carregou — aplicando recarga diretamente no backend.", "aviso");
      recarregarBackend(valor);
      return;
    }

    try {
      const paymentsClient = new google.payments.api.PaymentsClient({
        environment: "TEST",
      });

      const baseRequest = { apiVersion: 2, apiVersionMinor: 0 };
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
        tokenizationSpecification,
      };

      const paymentDataRequest = Object.assign({}, baseRequest, {
        allowedPaymentMethods: [cardPaymentMethod],
        transactionInfo: {
          totalPriceStatus: "FINAL",
          totalPrice: valor.toFixed(2),
          currencyCode: "BRL",
          countryCode: "BR",
        },
        merchantInfo: { merchantName: "VoltWay (Teste)" },
      });

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
      console.log("Google Pay - paymentData:", paymentData);

      await recarregarBackend(valor);
    } catch (err) {
      console.error("loadPaymentData erro:", err);
      info("❌ Pagamento cancelado ou não autorizado.", "erro");
    }
  }

  // ======================================
  // Botão Recarregar
  // ======================================
  if (btnRecarregar) {
    btnRecarregar.addEventListener("click", (ev) => {
      ev.preventDefault();
      if (!inputValor) {
        info("Campo de valor não encontrado.", "erro");
        return;
      }

      let valor = inputValor.value.replace(/\D/g, "");
      valor = parseFloat(valor) / 100;

      if (isNaN(valor) || valor <= 0) {
        info("Digite um valor válido para recarga.", "erro");
        return;
      }

      iniciarGooglePay(valor);
      inputValor.value = "R$ 0,00";
    });
  }

  // ======================================
  // Input formatado em BRL
  // ======================================
  if (inputValor) {
    inputValor.value = "R$ 0,00";

    inputValor.addEventListener("input", () => {
      let valor = inputValor.value.replace(/\D/g, "");
      if (!valor) valor = "0";
      valor = (parseInt(valor, 10) / 100).toFixed(2);
      inputValor.value = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(valor);
    });
  }
});
