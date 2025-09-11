// ---- Sistema de mensagens customizadas ----
function mostrarMensagem(texto, tipo = "aviso") {
  // cria container se não existir
  let container = document.getElementById("mensagensContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "mensagensContainer";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.right = "20px";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    document.body.appendChild(container);
  }

  // cria mensagem
  const msg = document.createElement("div");
  msg.textContent = texto;
  msg.style.padding = "12px 18px";
  msg.style.borderRadius = "8px";
  msg.style.color = "#fff";
  msg.style.fontWeight = "bold";
  msg.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  msg.style.opacity = "0";
  msg.style.transition = "opacity 0.3s ease";

  // cores por tipo
  if (tipo === "erro") msg.style.background = "#e74c3c";
  else if (tipo === "sucesso") msg.style.background = "#27ae60";
  else msg.style.background = "#f39c12";

  container.appendChild(msg);

  // animação de entrada
  setTimeout(() => {
    msg.style.opacity = "1";
  }, 50);

  // remove após 3s
  setTimeout(() => {
    msg.style.opacity = "0";
    setTimeout(() => msg.remove(), 300);
  }, 3000);
}

// ====================================
// Função para atualizar a Sidebar
// ====================================
function atualizarSidebar() {
  const usuario = localStorage.getItem("usuario") || "Usuário";
  const usuarioEmail = localStorage.getItem("usuarioEmail");
  const foto = localStorage.getItem("usuarioFoto") || "../assets/foto.png";

  const nomeUsuario = document.getElementById("nomeUsuario");
  if (nomeUsuario) {
    nomeUsuario.innerHTML = `
      <span class="user-photo">
        <img src="${foto}" alt="Foto do usuário" />
      </span>
      ${usuario}
      <button id="gearBtn" class="settings-icon" title="Configurações">
        <img src="../assets/engrenagem.png" alt="Configurações" />
      </button>
    `;
  }
}

// ====================================
// Verificação de login e inicialização
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  const logado = localStorage.getItem("logado");
  const usuarioEmail = localStorage.getItem("usuarioEmail");

  if (!logado || !usuarioEmail) {
    window.location.href = "../login/login.html";
    return;
  }

  atualizarSidebar();
});

// =====================================================
// Ação do botão da engrenagem (gearBtn)
// =====================================================
document.addEventListener("click", (e) => {
  if (e.target.closest("#gearBtn")) {
    if (window.location.pathname.includes("perfil.html")) {
      // já estamos no perfil → rola direto
      const ultimaSecao = document.querySelector(".perfil-container:last-of-type");
      if (ultimaSecao) {
        smoothScrollTo(ultimaSecao, 1200);
      }
    } else {
      // salva intenção de rolar para o histórico
      localStorage.setItem("scrollToPerfilSection", "historicoReservas");
      // redireciona para perfil
      window.location.href = "../perfil/perfil.html";
    }
  }
});

// Função de rolagem suave
function smoothScrollTo(element, duration = 800) {
  const targetY = element.getBoundingClientRect().top + window.scrollY;
  const startY = window.scrollY;
  const distance = targetY - startY;
  let startTime = null;

  function animation(currentTime) {
    if (!startTime) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    window.scrollTo(0, startY + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

// ---- Função de logout ----
function logout() {
  localStorage.removeItem("logado");
  localStorage.removeItem("usuario");
  window.location.href = "../login/login.html";
}
