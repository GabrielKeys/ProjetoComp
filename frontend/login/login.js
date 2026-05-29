const API_BASE = "https://voltway-backend.onrender.com";


document.addEventListener("DOMContentLoaded", () => {
  const logado = localStorage.getItem("logado");
  const tipo = localStorage.getItem("logado_como");

  if (logado === "true") {
    if (tipo === "usuario") {
      // Usuário comum
      window.location.href = "../home/home.html";
    } else if (tipo === "estacao") {
      // Estação cadastrada
      window.location.href = "../station/home.html";
    }
  }
});

// ====================================
// Mensages de aviso, erro ou sucesso
// ====================================
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
// Atualizar Sidebar diretamente do banco
// ====================================
async function atualizarSidebar(tipoConta, email) {
  const url = tipoConta === "estacao"
    ? `${API_BASE}/stations/${email}`
    : `${API_BASE}/users/${email}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erro ao buscar dados do banco");

    const dados = await res.json();
    const nome = dados.full_name || dados.name || dados.email;
    const foto = dados.photo_url || "../assets/foto.png";

    document.querySelectorAll(".nomeUsuario").forEach((el) => {
      el.innerHTML = `
        <span class="user-photo">
          <img src="${foto.startsWith('data:image') ? foto : `${foto}?t=${Date.now()}`}" alt="Foto do usuário" />
        </span>
        ${nome}
        <button id="gearBtn" class="settings-icon" title="Configurações">
          <img src="../assets/engrenagem.png" alt="Configurações" />
        </button>
      `;
    });
  } catch (err) {
    console.error("Erro ao atualizar sidebar:", err);
  }
}

// ===============================
// Troca entre Login e Registro
// ===============================
document.getElementById("goToRegister")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("loginForm").classList.remove("active");
  document.getElementById("registerForm").classList.add("active");
});

document.getElementById("goToLogin")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("registerForm").classList.remove("active");
  document.getElementById("loginForm").classList.add("active");
});

// ===============================
// Troca para Registrar Estação
// ===============================
document.getElementById("goToRegisterStation")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("registerForm").classList.remove("active");
  document.getElementById("registerStationForm").classList.add("active");
});

document.getElementById("goToLoginFromStation")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("registerStationForm").classList.remove("active");
  document.getElementById("loginForm").classList.add("active");
});


/// ===============================
// LOGIN VIA BACKEND (USUÁRIOS E ESTAÇÕES)
// ===============================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = (document.getElementById("username").value || "").trim().toLowerCase();
    const password = (document.getElementById("password").value || "").trim();
    const errorMsg = document.getElementById("errorMsg");

    if (!email || !password) {
      errorMsg.innerText = "Preencha todos os campos!";
      errorMsg.style.color = "red";
      return;
    }

    try {
      // Tenta login de usuário
      let response = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      let data = await response.json();

      if (response.ok) {
        // Login de usuário bem-sucedido
        localStorage.setItem("logado", "true");
        localStorage.setItem("logado_como", "usuario");
        localStorage.setItem("usuarioEmail", data.email);

        // Atualiza sidebar com dados do banco (sem usar localStorage para nome/foto)
        await atualizarSidebar("usuario", data.email);

        window.location.href = "../home/home.html";
        return;
      }

      // Se não achou usuário, tenta estação
      response = await fetch(`${API_BASE}/stations/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      data = await response.json();

      if (response.ok) {
        localStorage.setItem("logado", "true");
        localStorage.setItem("logado_como", "estacao");
        localStorage.setItem("usuarioEmail", data.email);

        // Atualiza sidebar com dados do banco
        await atualizarSidebar("estacao", data.email);

        window.location.href = "../station/home.html";
        return;
      }


      // Se chegou aqui, nenhum dos dois logins funcionou
      errorMsg.innerText = "Email ou senha incorretos!";
      errorMsg.style.color = "red";

    } catch (err) {
      console.error("Erro no login:", err);
      errorMsg.innerText = "Erro de conexão com o servidor.";
      errorMsg.style.color = "red";
    }
  });
}


// ===============================
// REGISTRO DE USUÁRIO (com verificação global de email)
// ===============================
const registerForm = document.getElementById("registerForm");

if (registerForm) {

  const btnSubmit = registerForm.querySelector('button[type="submit"]');

  // 🔹 Função centralizada para mostrar erro e reativar o botão
  function mostrarErroBloqueandoBotao(msg) {
    mostrarMensagem(msg, "erro");
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Registrar";
    }
  }

  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Registrando...";

    const fullName = document.getElementById("fullName").value.trim();
    const newEmail = document.getElementById("newEmail").value.trim();
    const newPass = document.getElementById("newPass").value.trim();
    const confirmPass = document.getElementById("confirmPass").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const carModel = document.getElementById("carModel").value.trim();
    const carYear = document.getElementById("carYear").value.trim();
    const carPlate = document.getElementById("carPlate").value.trim();
    const carBattery = document.getElementById("carBattery").value.trim();
    const carPower = document.getElementById("carPower")?.value.trim() || "";

    const msg = document.getElementById("registerMsg");

    // ===============================
    // VALIDAÇÃO DE CONFIRMAÇÃO DE SENHA
    // ===============================
    if (newPass !== confirmPass) {
      msg.textContent = "As senhas não coincidem.";
      msg.style.color = "red";

      const passwordMatchMsg = document.getElementById("passwordMatchMsg");
      if (passwordMatchMsg) {
        passwordMatchMsg.textContent = "As senhas não coincidem.";
        passwordMatchMsg.classList.remove("success");
        passwordMatchMsg.classList.add("error");
      }

      const confirmPassInput = document.getElementById("confirmPass");
      if (confirmPassInput) {
        confirmPassInput.classList.add("input-error");
      }

      btnSubmit.disabled = false;
      btnSubmit.textContent = "Registrar";
      return;
    }
    // ===============================
    // Validações básicas
    // ===============================
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return mostrarErroBloqueandoBotao("Digite um email válido!", "erro");
    }

    if (newPass.length < 8) {
      return mostrarErroBloqueandoBotao("A senha deve ter pelo menos 8 caracteres!", "erro");
    }

    if (newPass !== confirmPass) {
      return mostrarErroBloqueandoBotao("As senhas não coincidem!", "erro");
    }

    try {
      // ===============================
      // 1️⃣ Checa se o email já existe em usuários ou estações
      // ===============================
      const [userCheck, stationCheck] = await Promise.all([
        fetch(`${API_BASE}/users/${encodeURIComponent(newEmail)}`),
        fetch(`${API_BASE}/stations/${encodeURIComponent(newEmail)}`)
      ]);

      if (userCheck.ok || stationCheck.ok) {
        mostrarErroBloqueandoBotao("❌ Este e-mail já está em uso! Tente outro.", "erro");
        return;
      }

      // ===============================
      // 2️⃣ Cria o novo usuário
      // ===============================
      const novoUsuario = {
        full_name: fullName,
        email: newEmail,
        password: newPass,
        phone,
        role: "user",
      };

      const response = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoUsuario),
      });

      if (!response.ok) {
        const erro = await response.text();
        msg.innerText = `Erro: ${erro}`;
        msg.style.color = "red";
        return;
      }

      const data = await response.json();
      console.log("Usuário criado:", data);

      // ===============================
      // 3️⃣ Salva veículo (opcional)
      // ===============================
      if (carModel || carYear || carPlate || carBattery || carPower) {
        await fetch(`${API_BASE}/vehicles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: newEmail,
            model: carModel,
            year: carYear,
            plate: carPlate,
            battery: carBattery,
            power: carPower,
          }),
        });
      }

      // ===============================
      // 4️⃣ Mensagem de sucesso + login automático
      // ===============================
      mostrarMensagem("Conta criada com sucesso.", "sucesso");
      msg.innerText = "✅ Conta criada com sucesso!";
      msg.style.color = "green";

      localStorage.setItem("logado", "true");
      localStorage.setItem("logado_como", "usuario");
      localStorage.setItem("usuario", fullName || newEmail);
      localStorage.setItem("usuarioEmail", newEmail);

      setTimeout(() => {
        window.location.href = "../home/home.html";
      }, 2000);

    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      msg.innerText = "Erro ao conectar com o servidor!";
      msg.style.color = "red";

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Registrar Estação";
      }

    }
  });
}


// ===============================
// LOGIN COM GOOGLE (versão completa e estável com suporte a estações)
// ===============================
function initGoogleLogin() {
  const CLIENT_ID =
    "288143953215-o49d879dqorujtkpgfqg80gp7u9ai9ra.apps.googleusercontent.com";

  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse,
  });

  google.accounts.id.renderButton(document.getElementById("googleLoginBtn"), {
    theme: "outline",
    size: "large",
    text: "continue_with",
  });

  google.accounts.id.prompt();
}

async function handleCredentialResponse(response) {
  const data = parseJwt(response.credential);
  const email = (data.email || "").toLowerCase();
  const name = data.name || "Usuário Google";
  const picture = data.picture || "";

  // Fallback em caso de erro de conexão
  const redirectToRegister = () => {
    localStorage.setItem("googleCadastro", JSON.stringify({ email, name, picture }));
    window.location.href = "../login/login.html?registerGoogle=true";
  };

  try {
    // 🔹 1. Busca usuários no backend
    const resUsers = await fetch(`${API_BASE}/users`);
    const users = resUsers.ok ? await resUsers.json() : [];
    const userFound = users.find(u => (u.email || "").toLowerCase() === email);

    if (userFound) {
      // ✅ Login como usuário
      localStorage.setItem("logado", "true");
      localStorage.setItem("logado_como", "usuario");
      localStorage.setItem("usuario", userFound.full_name || userFound.email);
      localStorage.setItem("usuarioEmail", userFound.email);
      localStorage.setItem("usuarioFoto", userFound.photo_url || picture);
      window.location.href = "../home/home.html";
      return;
    }

    // 🔹 2. Busca estações no backend
    const resStations = await fetch(`${API_BASE}/stations`);
    const stations = resStations.ok ? await resStations.json() : [];
    const stationFound = stations.find(s => (s.email || "").toLowerCase() === email);

    if (stationFound) {
      // ✅ Login como estação
      localStorage.setItem("logado", "true");
      localStorage.setItem("logado_como", "estacao");
      localStorage.setItem("usuario", stationFound.name || stationFound.full_name || stationFound.email);
      localStorage.setItem("usuarioEmail", stationFound.email);
      localStorage.setItem("estacaoSelecionada", JSON.stringify(stationFound));
      window.location.href = "../station/home.html";
      return;
    }

    // 🔹 3. Se não encontrou em nenhum dos dois → vai para registro
    redirectToRegister();
  } catch (err) {
    console.warn("⚠️ Erro ao conectar com o servidor. Redirecionando para registro...", err);
    redirectToRegister();
  }
}

// ===============================
// Decodifica o token JWT do Google
// ===============================
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

// ===============================
// Carrega SDK do Google
// ===============================
const script = document.createElement("script");
script.src = "https://accounts.google.com/gsi/client";
script.async = true;
script.defer = true;
script.onload = initGoogleLogin;
document.head.appendChild(script);

// ===============================
// Pré-preencher registro com dados do Google
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const isGoogleRegister = urlParams.get("registerGoogle");

  if (isGoogleRegister) {
    const googleData = JSON.parse(localStorage.getItem("googleCadastro") || "{}");

    if (googleData.email) {
      // Mostra aba de registro
      document.getElementById("loginForm").classList.remove("active");
      document.getElementById("registerForm").classList.add("active");

      // Preenche campos
      document.getElementById("newEmail").value = googleData.email;
      document.getElementById("newEmail").setAttribute("readonly", "true");

      if (googleData.name) {
        document.getElementById("fullName").value = googleData.name;
      }
    }
  }
});

// Se trocar para "Registrar Estação" após login do Google
document.getElementById("goToRegisterStation")?.addEventListener("click", () => {
  const googleData = JSON.parse(localStorage.getItem("googleCadastro") || "{}");

  // Se o usuário veio do Google
  if (googleData.email) {
    // Troca a aba
    document.getElementById("registerForm").classList.remove("active");
    document.getElementById("registerStationForm").classList.add("active");

    // Preenche o email da estação e trava
    document.getElementById("stationEmail").value = googleData.email;
    document.getElementById("stationEmail").setAttribute("readonly", "true");

    // Limpa o nome da estação para ele digitar novo
    document.getElementById("stationName").value = "";
  }
});


// ===============================
// Regras de formatação para os inputs do veículo (Registro)
// ===============================
function aplicarRegrasInputs() {
  const anoInput = document.getElementById("carYear");
  const placaInput = document.getElementById("carPlate");
  const batInput = document.getElementById("carBattery");
  const carInput = document.getElementById("carPower");

  if (anoInput) {
    anoInput.addEventListener("input", () => {
      anoInput.value = anoInput.value.replace(/\D/g, "").slice(0, 4);
    });
  }

  if (placaInput) {
    placaInput.addEventListener("input", () => {
      let valor = placaInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (valor.length > 3) valor = valor.slice(0, 3) + "-" + valor.slice(3, 7);
      placaInput.value = valor.slice(0, 8);
    });
  }

  function configurarCampoNumeroComSufixo(input, sufixo) {
    if (!input) return;

    input.addEventListener("input", () => {
      let valor = input.value.replace(/[^0-9,]/g, "");
      const partes = valor.split(",");
      if (partes[0].length > 4) partes[0] = partes[0].slice(0, 4);
      if (partes[1]) partes[1] = partes[1].slice(0, 2);
      input.value = partes.join(",");
    });

    input.addEventListener("blur", () => {
      if (input.value && !input.value.includes(sufixo)) {
        input.value += ` ${sufixo}`;
      }
    });

    input.addEventListener("focus", () => {
      input.value = input.value.replace(` ${sufixo}`, "");
    });

    if (input.value && !input.value.includes(sufixo)) {
      input.value += ` ${sufixo}`;
    }
  }

  configurarCampoNumeroComSufixo(batInput, "kWh");
  configurarCampoNumeroComSufixo(carInput, "kW");
}
aplicarRegrasInputs();

// ===============================
// MÁSCARA DE TELEFONE (USUÁRIO E ESTAÇÃO)
// ===============================
document.addEventListener("DOMContentLoaded", function () {

  function aplicarMascaraTelefone(input) {
    if (!input) return;

    function rawDigitsFrom(str) {
      return (str || "").replace(/\D/g, "");
    }

    function formatarTelefoneLive(valor) {
      if (valor.length < 3) return valor; // Não mostra "(" antes de 3 dígitos
      if (valor.length < 7) return `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
      return `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7, 11)}`;
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        const pos = input.selectionStart;
        const val = input.value;

        if (pos > 0 && /[\s\-\(\)]/.test(val[pos - 1])) {
          e.preventDefault();
          let raw = rawDigitsFrom(val);
          if (raw.length > 0) raw = raw.slice(0, -1);
          input.value = formatarTelefoneLive(raw);
          input.setSelectionRange(pos - 1, pos - 1);
        }
      }
    });

    input.addEventListener("input", () => {
      let raw = rawDigitsFrom(input.value);
      if (raw.length > 11) raw = raw.slice(0, 11);
      input.value = formatarTelefoneLive(raw);
    });
  }

  aplicarMascaraTelefone(document.getElementById("phone"));
  aplicarMascaraTelefone(document.getElementById("stationPhone"));

});

// ===============================
// Toggle exibição da seção de veículo
// ===============================
const toggleVehicle = document.getElementById("toggleVehicle");
const vehicleSection = document.getElementById("vehicleSection");

if (toggleVehicle && vehicleSection) {
  toggleVehicle.addEventListener("click", () => {
    const isVisible = vehicleSection.style.display === "block";
    vehicleSection.style.display = isVisible ? "none" : "block";
    toggleVehicle.innerText = isVisible
      ? "+ Adicionar Veículo (Opcional)"
      : "− Remover Veículo";
  });
}

// ===============================
// Troca entre Login e Registro de Estação
// ===============================
document.getElementById("goToRegisterStation")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("loginForm").classList.remove("active");
  document.getElementById("registerStationForm").classList.add("active");
});

document.getElementById("goToLoginFromStation")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("registerStationForm").classList.remove("active");
  document.getElementById("loginForm").classList.add("active");
});

// ===============================
// REGISTRO DE ESTAÇÃO (com validação de número e preço formatado)
// ===============================

const registerStationForm = document.getElementById("registerStationForm");

if (registerStationForm) {
  // ===============================
  // BLOQUEIOS DE ENTRADA
  // ===============================

  // Permitir apenas números no campo "Número"
  const numberInput = document.getElementById("stationNumber");
  if (numberInput) {
    numberInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "");
    });
  }

  // ===============================
  // Preenche e formata o campo de preço mantendo "R$ " visível durante a digitação
  // ===============================
  (function initPrecoComPrefixo() {
    const input = document.getElementById("stationPrice");
    if (!input) return;

    const PREFIX = "R$ ";

    function formatBRLFromDigits(digits) {
      if (!digits) return "0,00";
      digits = digits.replace(/^0+/, "");
      if (!digits) digits = "0";
      while (digits.length < 3) digits = "0" + digits;
      const cents = digits.slice(-2);
      let integer = digits.slice(0, -2);
      integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return integer + "," + cents;
    }
    function onlyDigitsFrom(str) {
      return (str || "").replace(/\D/g, "");
    }

    function setFormattedValueFromDigits(digits) {
      const formatted = formatBRLFromDigits(digits);
      input.value = PREFIX + formatted;
      try {
        input.setSelectionRange(input.value.length, input.value.length);
      } catch (e) { }
    }

    if (!input.value || !onlyDigitsFrom(input.value)) {
      setFormattedValueFromDigits("0");
    } else {
      setFormattedValueFromDigits(onlyDigitsFrom(input.value));
    }

    input.addEventListener("keydown", (ev) => {
      const selStart = input.selectionStart;
      const selEnd = input.selectionEnd;
      if (selStart <= PREFIX.length - 1 && (ev.key === "Backspace" || ev.key === "Delete")) {
        ev.preventDefault();
        try { input.setSelectionRange(PREFIX.length, PREFIX.length); } catch (e) { }
        return;
      }
      const allowed = [
        "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab", "Backspace", "Delete", "Home", "End"
      ];
      if (allowed.includes(ev.key)) return;
      if (/^[0-9]$/.test(ev.key)) return;
      if (ev.ctrlKey || ev.metaKey) return;
      ev.preventDefault();
    });

    input.addEventListener("focus", () => {
      if (!input.value.startsWith(PREFIX)) {
        const digits = onlyDigitsFrom(input.value);
        setFormattedValueFromDigits(digits || "0");
      } else {
        try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) { }
      }
    });

    input.addEventListener("input", () => {
      let digits = onlyDigitsFrom(input.value);
      if (!digits) digits = "0";
      digits = digits.replace(/^0+/, "");
      if (!digits) digits = "0";
      setFormattedValueFromDigits(digits);
    });

    input.addEventListener("blur", () => {
      if (!input.value.startsWith(PREFIX)) {
        const digits = onlyDigitsFrom(input.value) || "0";
        setFormattedValueFromDigits(digits);
      }
    });

    input.getNumericValue = function () {
      const digits = onlyDigitsFrom(input.value);
      if (!digits) return 0;
      const n = parseInt(digits, 10);
      return n / 100;
    };
  })();



  const btnSubmit = registerStationForm.querySelector('button[type="submit"]');

  // Função centralizada para exibir mensagem e reativar o botão
  function mostrarErroBloqueandoBotao(msg) {
    mostrarMensagem(msg, "erro");
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Registrar Estação";
    }
  }


  registerStationForm.addEventListener("submit", async function (event) {
    event.preventDefault();


    const btnSubmit = registerStationForm.querySelector('button[type="submit"]');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = "Registrando...";
    }

    // ===============================
    // CAPTURA DOS CAMPOS
    // ===============================
    const cepInput = document.getElementById("stationCep");
    const cep = cepInput.value.replace(/\D/g, "");

    const full_name = document.getElementById("stationFullName")?.value.trim() || "";
    const name = document.getElementById("stationName").value.trim();
    const email = document.getElementById("stationEmail").value.trim();
    const password = document.getElementById("stationPass").value.trim();
    const confirmPass = document.getElementById("confirmStationPass").value.trim();
    const phone = document.getElementById("stationPhone").value.trim();
    const address = document.getElementById("stationAddress").value.trim();
    const number = document.getElementById("stationNumber").value.trim();
    const district = document.getElementById("stationDistrict").value.trim();
    const city = document.getElementById("stationCity").value.trim();
    const state = document.getElementById("stationState").value.trim();

    const powerRaw = document.getElementById("stationPower")?.value || "";
    const priceRaw = document.getElementById("stationPrice")?.value || "";
    const waitRaw = document.getElementById("stationWait")?.value || "";
    const open_time = document.getElementById("stationOpen")?.value || "";
    const close_time = document.getElementById("stationClose")?.value || "";

    // ===============================
    // VALIDAÇÃO DE CONFIRMAÇÃO DE SENHA DA ESTAÇÃO
    // ===============================
    const stationMsg = document.getElementById("stationMsg");

    if (password !== confirmPass) {
      stationMsg.textContent = "As senhas não coincidem.";
      stationMsg.style.color = "red";

      const stationPasswordMatchMsg = document.getElementById("stationPasswordMatchMsg");
      if (stationPasswordMatchMsg) {
        stationPasswordMatchMsg.textContent = "As senhas não coincidem.";
        stationPasswordMatchMsg.classList.remove("success");
        stationPasswordMatchMsg.classList.add("error");
      }

      const confirmStationPassInput = document.getElementById("confirmStationPass");
      if (confirmStationPassInput) {
        confirmStationPassInput.classList.add("input-error");
      }

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Registrar Estação";
      }

      return;
    }
    // ===============================
    // VALIDAÇÃO DE CEP
    // ===============================
    if (!cep || cep.length !== 8) {
      mostrarErroBloqueandoBotao("Digite um CEP válido antes de continuar!", "erro");
      cepInput.focus();
      return;
    }

    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await resp.json();

      if (data.erro) {
        mostrarErroBloqueandoBotao("CEP não encontrado. Verifique e tente novamente!", "erro");
        cepInput.focus();
        return;
      }
    } catch (err) {
      console.error("❌ Erro ao validar CEP:", err);
      mostrarErroBloqueandoBotao("Erro ao validar o CEP. Tente novamente mais tarde.", "erro");
      return;
    }

    // ===============================
    // OUTRAS VALIDAÇÕES
    // ===============================
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      return mostrarErroBloqueandoBotao("Digite um email válido!", "erro");

    if (password.length < 8)
      return mostrarErroBloqueandoBotao("A senha deve ter pelo menos 8 caracteres!", "erro");

    if (password !== confirmPass)
      return mostrarErroBloqueandoBotao("As senhas não coincidem!", "erro");

    // ✅ Número
    if (!number)
      return mostrarErroBloqueandoBotao("O campo número é obrigatório!", "erro");

    if (!/^\d+$/.test(number))
      return mostrarErroBloqueandoBotao("Digite apenas números no campo número!", "erro");

    if (parseInt(number) <= 0)
      return mostrarErroBloqueandoBotao("Digite um número válido para o endereço!", "erro");

    // Preço 
    let valorStr = priceRaw.replace(/[^\d,]/g, "").replace(",", ".");
    let price = parseFloat(valorStr);

    // Se o usuário não digitou nada, assume 0.00
    if (isNaN(price)) price = 0.0;;

    // Outros valores opcionais
    const power = parseFloat(powerRaw.replace(/[^\d.,]/g, "").replace(",", ".") || 0);
    const wait_time = parseInt(waitRaw.replace(/[^\d]/g, "") || "0");

    // ===============================
    // GEOLOCALIZAÇÃO
    // ===============================
    const enderecoCompleto = `${address}, ${number}, ${district}, ${city} - ${state}, ${cep}`;
    let lat = null, lng = null;

    try {
      const geocodeURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        enderecoCompleto
      )}&key=AIzaSyDOJogDJ0oT8YsjTuQXx4k1Rkgbtw6WsxY`;

      const geoRes = await fetch(geocodeURL);
      const geoData = await geoRes.json();

      if (geoData.status === "OK" && geoData.results.length > 0) {
        lat = geoData.results[0].geometry.location.lat;
        lng = geoData.results[0].geometry.location.lng;
        console.log(`📍 Coordenadas obtidas: (${lat}, ${lng})`);
      } else {
        console.warn("⚠️ Geocoding falhou:", geoData.status);
      }
    } catch (err) {
      console.error("❌ Erro no geocoding:", err);
    }


    // ===============================
    // CHECA SE EMAIL JÁ EXISTE (em usuário OU estação)
    // ===============================
    try {
      const [userCheck, stationCheck] = await Promise.all([
        fetch(`${API_BASE}/users/${encodeURIComponent(email)}`),
        fetch(`${API_BASE}/stations/${encodeURIComponent(email)}`)
      ]);

      if (userCheck.ok || stationCheck.ok) {
        mostrarErroBloqueandoBotao("❌ Este e-mail já está em uso! Tente outro.", "erro");
        return;
      }
    } catch (err) {
      console.error("❌ Erro ao verificar e-mail:", err);
      mostrarErroBloqueandoBotao("Erro ao verificar disponibilidade do e-mail.", "erro");
      return;
    }


    // ===============================
    // MONTAGEM E ENVIO
    // ===============================
    const novaEstacao = {
      full_name,
      name,
      email,
      password,
      phone,
      cep,
      address,
      number,
      district,
      city,
      state,
      power,
      price,
      wait_time,
      open_time,
      close_time,
      lat,
      lng,
    };

    try {
      const response = await fetch(`${API_BASE}/stations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaEstacao),
      });

      if (!response.ok) {
        const erro = await response.text();
        console.error("Erro do servidor:", erro);
        mostrarErroBloqueandoBotao(`Erro ao registrar estação: ${erro}`, "erro");
        return;
      }

      const data = await response.json();
      console.log("✅ Estação registrada:", data);
      mostrarMensagem("✅ Estação registrada com sucesso!", "sucesso");

      // Armazenamento local
      localStorage.setItem("logado", "true");
      localStorage.setItem("logado_como", "estacao");
      localStorage.setItem("usuario", data.name || data.email);
      localStorage.setItem("usuarioEmail", data.email);
      localStorage.setItem("estacaoSelecionada", JSON.stringify(data));

      registerStationForm.reset();
      localStorage.removeItem("googleCadastro");

      setTimeout(() => {
        window.location.href = "../station/home.html";
      }, 1200);

    } catch (error) {
      console.error("❌ Erro ao conectar com o servidor:", error);
      mostrarMensagem("Erro ao conectar com o servidor!", "erro");
    }
  });

}



// ===============================
// CEP automático + Gaveta animada + Validação no registro
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const cepInput = document.getElementById("stationCep");
  const endereco = document.getElementById("stationAddress");
  const bairro = document.getElementById("stationDistrict");
  const cidade = document.getElementById("stationCity");
  const estado = document.getElementById("stationState");
  const gaveta = document.getElementById("enderecoGaveta");
  const toggleEndereco = document.getElementById("toggleEndereco");
  const formEstacao = document.getElementById("registerStationForm");
  const erroSpan = document.getElementById("cepErro");

  let cepValido = false;
  let ultimoCepBuscado = ""; // último CEP validado com sucesso

  // 🔹 Verifica se os elementos existem
  if (!cepInput || !gaveta || !toggleEndereco || !erroSpan) {
    console.warn("⚠️ Elementos de endereço não encontrados no DOM.");
    return;
  }

  // ---------- Funções auxiliares ----------
  const mostrarErro = (mensagem) => {
    erroSpan.textContent = mensagem;
    erroSpan.classList.add("visivel");
  };

  const limparErro = () => {
    erroSpan.textContent = "";
    erroSpan.classList.remove("visivel");
  };

  // ---------- Abre/fecha a gaveta ----------
  toggleEndereco.addEventListener("click", () => {
    gaveta.classList.toggle("ativa");
    toggleEndereco.classList.toggle("ativo");

    toggleEndereco.textContent = toggleEndereco.classList.contains("ativo")
      ? "- Ocultar Informações"
      : "+ Informações do Endereço";
  });

  // ---------- Busca automática de CEP ----------
  async function validarCep(cepDigitado) {
    const cep = cepDigitado.replace(/\D/g, "");
    cepValido = false;

    if (cep.length !== 8) {
      mostrarErro("CEP deve ter 8 dígitos.");
      return false;
    }

    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await resp.json();

      if (!data.erro) {
        limparErro();
        endereco.value = data.logradouro || "";
        bairro.value = data.bairro || "";
        cidade.value = data.localidade || "";
        estado.value = data.uf || "";

        gaveta.classList.add("ativa");
        toggleEndereco.classList.add("ativo");
        toggleEndereco.textContent = "- Ocultar Endereço";

        cepValido = true;
        ultimoCepBuscado = cep;
        return true;
      } else {
        endereco.value = bairro.value = cidade.value = estado.value = "";
        mostrarErro("CEP não encontrado.");
        return false;
      }
    } catch (err) {
      console.error("❌ Erro ao buscar CEP:", err);
      mostrarErro("Erro ao buscar o CEP. Tente novamente mais tarde.");
      return false;
    }
  }

  // ---------- Validação ao sair do campo ----------
  cepInput.addEventListener("blur", async () => {
    const cep = cepInput.value.trim();
    if (!cep) return;
    await validarCep(cep);
  });

  // ---------- Validação antes de enviar o formulário ----------
  formEstacao.addEventListener("submit", async (e) => {
    const cep = cepInput.value.replace(/\D/g, "");

    // Se o CEP mudou desde a última validação, revalida antes de enviar
    if (cep !== ultimoCepBuscado) {
      const ok = await validarCep(cep);
      if (!ok) {
        e.preventDefault();
        cepInput.focus();
        return;
      }
    }

    if (!cepValido) {
      e.preventDefault();
      cepInput.focus();
      return;
    }

    limparErro(); // ✅ tudo certo, prossegue
  });
});




// ===============================
// Formatação
// ===============================
function configurarCampoNumeroComSufixo(input, sufixo) {
  if (!input) return;
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^\d.,]/g, "");
  });
  input.addEventListener("blur", () => {
    if (input.value && !input.value.includes(sufixo)) {
      input.value += ` ${sufixo}`;
    }
  });
  input.addEventListener("focus", () => {
    input.value = input.value.replace(` ${sufixo}`, "");
  });
}

function configurarCampoMoeda(input) {
  if (!input) return;
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^\d.,]/g, "");
  });
  input.addEventListener("blur", () => {
    if (input.value && !input.value.startsWith("R$")) {
      input.value = "R$ " + input.value;
    }
  });
  input.addEventListener("focus", () => {
    input.value = input.value.replace("R$ ", "");
  });
}

// ===============================
// Erro Confirmação de senha
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  configurarValidacaoSenhaTempoReal({
    senhaId: "newPass",
    confirmacaoId: "confirmPass",
    mensagemId: "passwordMatchMsg"
  });

  configurarValidacaoSenhaTempoReal({
    senhaId: "stationPass",
    confirmacaoId: "confirmStationPass",
    mensagemId: "stationPasswordMatchMsg"
  });
});

function configurarValidacaoSenhaTempoReal({ senhaId, confirmacaoId, mensagemId }) {
  const senhaInput = document.getElementById(senhaId);
  const confirmacaoInput = document.getElementById(confirmacaoId);
  const mensagem = document.getElementById(mensagemId);

  if (!senhaInput || !confirmacaoInput || !mensagem) return;

  function validar() {
    const senha = senhaInput.value;
    const confirmacao = confirmacaoInput.value;

    mensagem.classList.remove("error", "success");
    confirmacaoInput.classList.remove("input-error");

    if (confirmacao.length === 0) {
      mensagem.textContent = "";
      return;
    }

    if (senha !== confirmacao) {
      mensagem.textContent = "As senhas não coincidem.";
      mensagem.classList.add("error");
      confirmacaoInput.classList.add("input-error");
    } else {
      mensagem.textContent = "As senhas coincidem.";
      mensagem.classList.add("success");
    }
  }

  senhaInput.addEventListener("input", validar);
  confirmacaoInput.addEventListener("input", validar);
}

configurarCampoNumeroComSufixo(document.getElementById("stationPower"), "kW");
configurarCampoNumeroComSufixo(document.getElementById("stationWait"), "min");
configurarCampoMoeda(document.getElementById("stationPrice"));

