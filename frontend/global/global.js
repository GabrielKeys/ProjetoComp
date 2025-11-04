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

  document.querySelectorAll(".nomeUsuario").forEach((el) => {
    el.innerHTML = `
    <span class="user-photo">
      <img src="${foto}" alt="Foto do usuário" />
    </span>
    ${usuario}
    <button id="gearBtn" class="settings-icon" title="Configurações">
      <img src="../assets/engrenagem.png" alt="Configurações" />
    </button>
  `;
  });

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
// Substituir pela versão abaixo para consultar o backend quando possível.
async function verificarCancelamentosPendentes() {
  const usuarioEmail = localStorage.getItem("usuarioEmail");
  const usuarioNome = localStorage.getItem("usuario");

  if (!usuarioEmail && !usuarioNome) return;

  // carrega notificações já mostradas
  const jaNotificados = JSON.parse(localStorage.getItem("cancelamentosNotificados")) || [];

  // 1) tenta buscar reservas do backend (se tiver email)
  let reservasBackend = [];
  if (usuarioEmail && typeof API_BASE !== "undefined") {
    try {
      const resp = await fetch(`${API_BASE}/reservas/${encodeURIComponent(usuarioEmail)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) reservasBackend = data;
      } else {
        // não depoe erro, só loga (fallback para localStorage)
        console.warn("verificarCancelamentosPendentes: fetch reservas devolveu", resp.status);
      }
    } catch (e) {
      console.warn("verificarCancelamentosPendentes: falha ao buscar backend:", e);
    }
  }

  // 2) ler reservas antigas do localStorage (mantém compatibilidade)
  const reservasEmailLocal = JSON.parse(localStorage.getItem(`reservas_${usuarioEmail}`) || "[]");
  const reservasNomeLocal = JSON.parse(localStorage.getItem(`reservas_${usuarioNome}`) || "[]");
  const reservasLocal = [...reservasEmailLocal, ...reservasNomeLocal];

  // 3) combina as listas (backend tem prioridade). Usa 'id' quando disponível, senão data+hora+estacao
  const mapa = new Map();

  function keyFor(r) {
    if (!r) return null;
    return r.id || `${r.data || ""}::${r.hora || r.inicio || ""}::${r.estacao || r.estacao_nome || r.estacaoEmail || r.estacao_email || ""}`;
  }

  // adiciona backend primeiro (prioridade)
  for (const r of reservasBackend) {
    const k = keyFor(r);
    if (k) mapa.set(k, r);
  }

  // adiciona locais se não existirem
  for (const r of reservasLocal) {
    const k = keyFor(r);
    if (k && !mapa.has(k)) mapa.set(k, r);
  }

  const todasReservas = Array.from(mapa.values());

  // 4) verifica canceladas e mostra o modal apenas se não notificado
  for (const r of todasReservas) {
    const idReserva = r.id || `${r.data || ""}_${(r.hora || r.inicio) || ""}`;

    // normaliza status (alguns registros podem ter campos diferentes)
    const status = (r.status || r.status_reserva || "").toString().toLowerCase();

    if (status === "cancelada" && !jaNotificados.includes(idReserva)) {
      // monta mensagem amigável (usa campos alternativos)
      const nomeEstacao =
        r.estacao ||
        r.estacao_nome ||
        r.estacaoName ||
        r.estacaoEmail ||
        r.estacao_email ||
        "estação";
      const data = r.data || r.date || "--/--/----";
      const hora = r.hora || r.inicio || r.time || "--:--";

      // mostra aviso visual
      mostrarCancelamentoCustomizado(
        `⚠️ Sua reserva na ${nomeEstacao} para ${data} às ${hora} foi cancelada. Um reembolso de R$10 foi aplicado.`
      );

      // ============================================================
      // REEMBOLSO FIXO DE R$10 (caso a estação tenha cancelado)
      // ============================================================
      try {
        const usuarioEmail = localStorage.getItem("usuarioEmail");
        if (!usuarioEmail) throw new Error("Usuário não autenticado.");

        const resposta = await fetch(`${API_BASE}/wallet/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: usuarioEmail,
            amount: 10,
            description: "Reembolso automático por cancelamento da estação",
          }),
        });

        const dataResp = await resposta.json();
        if (!resposta.ok) throw new Error(dataResp.error || "Falha no reembolso");

        console.log("💰 Reembolso automático aplicado:", dataResp);

        // ✅ Atualiza a carteira visualmente imediatamente
        if (window.atualizarCarteira) {
          await window.atualizarCarteira(); // chama a função que recarrega a carteira
        } else {
          // fallback caso a função não esteja no escopo global
          window.dispatchEvent(new Event("carteiraAtualizada"));
        }

      } catch (e) {
        console.error("❌ Falha ao processar reembolso automático:", e);
      }

      // marca como notificado
      jaNotificados.push(idReserva);
    }
  }

  // grava notificações já exibidas
  localStorage.setItem("cancelamentosNotificados", JSON.stringify(jaNotificados));
}
// Executa assim que abre o Home (se já não tiver isso em outro lugar)
document.addEventListener("DOMContentLoaded", verificarCancelamentosPendentes);

// Continua verificando a cada 3s (substitua o setInterval existente se já houver um)
setInterval(verificarCancelamentosPendentes, 3000);


//formatar numero de telefone
function formatarTelefone(telefone) {
  if (!telefone) return "--";
  let valor = telefone.replace(/\D/g, "");
  if (valor.length <= 10) {
    return `(${valor.slice(0, 2)}) ${valor.slice(2, 6)}-${valor.slice(6)}`;
  } else {
    return `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
  }
}




/* Global theme toggle logic (default = light)*/
(function () {
  const LS_KEY = "siteTheme";

  // Apply theme consistently
  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      document.body.classList.add("dark-mode");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.body.classList.remove("dark-mode");
    }
    // keep all toggles in sync (checked when dark)
    const toggles = document.querySelectorAll('input[type="checkbox"][data-theme-toggle], input[type="checkbox"]#darkModeSwitch');
    toggles.forEach(t => {
      t.checked = (theme === "dark");
    });
  }

  // Read saved preference (only "dark" triggers dark mode); default = light
  function getSavedTheme() {
    try {
      const v = localStorage.getItem(LS_KEY);
      if (v === "dark") return "dark";
    } catch (e) {
      // ignore storage errors (e.g. private mode)
    }
    return "light";
  }

  // Save preference
  function saveTheme(theme) {
    try {
      localStorage.setItem(LS_KEY, theme);
    } catch (e) { /* ignore */ }
  }

  // Toggle handler
  function onToggleChange(e) {
    const theme = e.target.checked ? "dark" : "light";
    applyTheme(theme);
    saveTheme(theme);
  }

  // Init after DOM ready
  function initThemeToggle() {
    const initial = getSavedTheme(); // default will be 'light' if nothing saved
    applyTheme(initial);

    // Find toggles (both id and data attribute)
    const toggles = Array.from(document.querySelectorAll('input[type="checkbox"][data-theme-toggle], input[type="checkbox"]#darkModeSwitch'));

    // Attach listeners if found, else observe for future additions
    if (toggles.length === 0) {
      const mo = new MutationObserver((mutations, obs) => {
        const found = Array.from(document.querySelectorAll('input[type="checkbox"][data-theme-toggle], input[type="checkbox"]#darkModeSwitch'));
        if (found.length > 0) {
          found.forEach(el => {
            el.checked = (initial === "dark");
            el.addEventListener("change", onToggleChange);
          });
          obs.disconnect();
        }
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    } else {
      toggles.forEach(el => {
        el.checked = (initial === "dark");
        el.addEventListener("change", onToggleChange);
      });
    }
  }

  // Wait DOMContentLoaded to ensure inputs exist
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeToggle);
  } else {
    initThemeToggle();
  }
})();
// Icone do modo escuro/claro na sidebar
document.addEventListener("DOMContentLoaded", () => {
  const themeLabel = document.getElementById("themeLabel");
  const darkSwitch = document.getElementById("darkModeSwitch");

  function updateButton() {
    if (darkSwitch.checked) {
      themeLabel.textContent = "Escuro";
    } else {
      themeLabel.textContent = "Claro";
    }
  }

  updateButton(); // define o estado inicial
  darkSwitch.addEventListener("change", updateButton);
});



// Tela de Loading
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('hidden');
    setTimeout(() => preloader.remove(), 500); // Remove após o fade-out
  }
});

