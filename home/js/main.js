document.addEventListener("DOMContentLoaded", () => {
  const logado = localStorage.getItem("logado");
  const usuario = localStorage.getItem("usuario");

  if (!logado || !usuario) {
    window.location.href = "../login/login.html";
    return;
  }

  // Nome formatado do usuário
  const nomeFormatado = usuario.charAt(0).toUpperCase() + usuario.slice(1);
  const nomeUsuario = document.getElementById("nomeUsuario");
  if (nomeUsuario) {
    nomeUsuario.innerHTML = `<span class="online-dot"></span> ${nomeFormatado} <span class="settings-icon">⚙️</span>`;
  }

  // Atualizar estação na carga inicial
  atualizarEstacao();
});
