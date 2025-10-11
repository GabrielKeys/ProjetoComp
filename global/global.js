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
  const tipo = localStorage.getItem("logado_como"); // "usuario" ou "estacao"
  const path = window.location.pathname; // Caminho atual

  // SE NÃO ESTÁ LOGADO → REDIRECIONA
  if (!logado || !tipo) {
    window.location.href = "../login/login.html";
    return;
  }

  // ===== BLOQUEAR ESTAÇÃO EM PÁGINAS DE USUÁRIO =====
  if (tipo === "estacao" && (
      path.includes("/home/") || 
      path.includes("/mapa/") || 
      path.includes("/perfil/") || 
      path.includes("/assinatura/")
  )) {
    window.location.href = "../station/home.html";
    return;
  }

  // ===== BLOQUEAR USUÁRIO EM PÁGINAS DE ESTAÇÃO =====
  if (tipo === "usuario" && (
      path.includes("/station/home") || 
      path.includes("/station/perfil")
  )) {
    window.location.href = "../home/home.html";
    return;
  }

  atualizarSidebar && atualizarSidebar();
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

// Script para alternar sidebar estilo gaveta com persistência
const sidebar = document.getElementById("sidebar");
const overlay = document.querySelector(".sidebar-overlay");
const toggleBtn = document.getElementById("toggleSidebar");

// 🔹 Abre/fecha no botão
toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");

  // Salva o estado atual
  localStorage.setItem("sidebarOpen", sidebar.classList.contains("open"));
});

// 🔹 Fecha se clicar no overlay
overlay.addEventListener("click", () => {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");

  // Atualiza o estado salvo
  localStorage.setItem("sidebarOpen", "false");
});

// ✅ Verifica automaticamente se há reservas canceladas pela estação (com modal customizado)
// ✅ Função que abre o modal customizado de cancelamento
function mostrarCancelamentoCustomizado(mensagem) {
  const modal = document.getElementById("cancelamentoAvisoModal");
  const msgEl = document.getElementById("cancelamentoMensagem");
  const btnFechar = document.getElementById("btnFecharCancelamentoAviso");

  msgEl.textContent = mensagem || "Sua reserva foi cancelada.";
  modal.style.display = "flex";

  btnFechar.onclick = () => {
    modal.style.display = "none";
  };
}

// ✅ Verifica automaticamente se há reservas canceladas pela estação (com modal customizado)
function verificarCancelamentosPendentes() {
  const usuarioEmail = localStorage.getItem("usuarioEmail");
  const usuarioNome = localStorage.getItem("usuario");

  if (!usuarioEmail && !usuarioNome) return;

  // Buscar reservas tanto por email quanto por nome
  const reservasEmail = JSON.parse(localStorage.getItem(`reservas_${usuarioEmail}`)) || [];
  const reservasNome = JSON.parse(localStorage.getItem(`reservas_${usuarioNome}`)) || [];
  const reservas = [...reservasEmail, ...reservasNome];

  const jaNotificados = JSON.parse(localStorage.getItem("cancelamentosNotificados")) || [];

  reservas.forEach(r => {
    const idReserva = r.data + r.hora;

    if (r.status === "cancelada" && !jaNotificados.includes(idReserva)) {
      mostrarCancelamentoCustomizado(`⚠️ Sua reserva em ${r.estacao} para ${r.data} às ${r.hora} foi cancelada. Foram reembolsados R$10`);
      jaNotificados.push(idReserva);
    }
  });

  localStorage.setItem("cancelamentosNotificados", JSON.stringify(jaNotificados));
}

// ✅ Executa assim que abre o Home
document.addEventListener("DOMContentLoaded", verificarCancelamentosPendentes);

// ✅ Continua verificando a cada 3s
setInterval(verificarCancelamentosPendentes, 3000);









