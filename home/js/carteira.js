document.addEventListener("DOMContentLoaded", () => {
  const usuarioAtual = localStorage.getItem("usuario");
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
});
