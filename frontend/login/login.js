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

const API_BASE = "http://localhost:4000"; // ajuste se seu backend estiver hospedado em outro endereço

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
      let response = await fetch("http://localhost:4000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      let data = await response.json();

      if (response.ok) {
        // Login de usuário bem-sucedido
        localStorage.setItem("logado", "true");
        localStorage.setItem("logado_como", data.role || "usuario");
        localStorage.setItem("usuario", data.name || data.email);
        localStorage.setItem("usuarioEmail", data.email);
        window.location.href = "../home/home.html";
        return;
      }

      // Se não achou usuário, tenta estação
      response = await fetch("http://localhost:4000/stations/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      data = await response.json();

      if (response.ok) {
        // Login de estação bem-sucedido
        localStorage.setItem("logado", "true");
        localStorage.setItem("logado_como", "estacao");
        localStorage.setItem("usuario", data.name || data.email);
        localStorage.setItem("usuarioEmail", data.email);
        localStorage.setItem("estacaoSelecionada", JSON.stringify(data));
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
// REGISTRO DE USUÁRIO (com banco de dados)
// ===============================
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

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
    // Validações básicas
    // ===============================
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      msg.innerText = "Digite um email válido!";
      msg.style.color = "red";
      return;
    }

    if (newPass.length < 8) {
      msg.innerText = "A senha deve ter pelo menos 8 caracteres!";
      msg.style.color = "red";
      return;
    }

    if (newPass !== confirmPass) {
      msg.innerText = "As senhas não coincidem!";
      msg.style.color = "red";
      return;
    }

    // ===============================
    // Envia para o backend
    // ===============================
    const novoUsuario = {
      full_name: fullName,
      email: newEmail,
      password: newPass,
      phone,
      role: "user", // define que é um usuário normal
    };

    try {
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
      // (Opcional) Salva veículo, se informado
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
      // Mensagem de sucesso + login automático
      // ===============================
      msg.innerText = "✅ Conta criada com sucesso!";
      msg.style.color = "green";

      // Salva login local para manter sessão
      localStorage.setItem("logado", "true");
      localStorage.setItem("logado_como", "usuario");
      localStorage.setItem("usuario", fullName || newEmail);
      localStorage.setItem("usuarioEmail", newEmail);

      // Redireciona após 2 segundos
      setTimeout(() => {
        window.location.href = "../home/home.html";
      }, 2000);

    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      msg.innerText = "Erro ao conectar com o servidor!";
      msg.style.color = "red";
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
// REGISTRO DE ESTAÇÃO (versão corrigida)
// ===============================


const registerStationForm = document.getElementById("registerStationForm");

if (registerStationForm) {
  registerStationForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const msg = document.getElementById("stationMsg");

    // Dados do formulário
    const full_name = document.getElementById("stationFullName")?.value.trim() || "";
    const name = document.getElementById("stationName").value.trim();
    const email = document.getElementById("stationEmail").value.trim();
    const password = document.getElementById("stationPass").value.trim();
    const confirmPass = document.getElementById("confirmStationPass").value.trim();
    const phone = document.getElementById("stationPhone").value.trim();
    const cep = document.getElementById("stationCep").value.trim();
    const address = document.getElementById("stationAddress").value.trim();
    const number = document.getElementById("stationNumber").value.trim();
    const district = document.getElementById("stationDistrict").value.trim();
    const city = document.getElementById("stationCity").value.trim();
    const state = document.getElementById("stationState").value.trim();

    const powerRaw = document.getElementById("stationPower").value.trim();
    const priceRaw = document.getElementById("stationPrice")?.value.trim() || "";
    const waitRaw = document.getElementById("stationWait")?.value.trim() || "";
    const open_time = document.getElementById("stationOpen").value.trim();
    const close_time = document.getElementById("stationClose").value.trim();

    // ===============================
    // Validações
    // ===============================
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg.innerText = "Digite um email válido!";
      msg.style.color = "red";
      return;
    }
    if (password.length < 8) {
      msg.innerText = "A senha deve ter pelo menos 8 caracteres!";
      msg.style.color = "red";
      return;
    }
    if (password !== confirmPass) {
      msg.innerText = "As senhas não coincidem!";
      msg.style.color = "red";
      return;
    }

    // Converte e limpa valores numéricos
    const power = parseFloat(powerRaw.replace(/[^\d.,]/g, "").replace(",", ".") || 0);
    const price = parseFloat(priceRaw.replace(/[^\d.,]/g, "").replace(",", ".") || 0);
    const wait_time = parseInt(waitRaw.replace(/[^\d]/g, "") || "0");

    // Objeto a ser enviado
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
        msg.innerText = `Erro ao registrar estação: ${erro}`;
        msg.style.color = "red";
        return;
      }

      const data = await response.json();
      console.log("✅ Estação registrada:", data);
      msg.innerText = "✅ Estação registrada com sucesso!";
      msg.style.color = "green";

      // Login automático
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
      msg.innerText = "Erro ao conectar com o servidor!";
      msg.style.color = "red";
    }
  });
}

// ===============================
// CEP automático (ViaCEP)
// ===============================
document.getElementById("stationCep")?.addEventListener("blur", function () {
  const cep = this.value.replace(/\D/g, "");
  if (cep.length === 8) {
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(res => res.json())
      .then(data => {
        if (!data.erro) {
          document.getElementById("stationAddress").value = data.logradouro;
          document.getElementById("stationDistrict").value = data.bairro;
          document.getElementById("stationCity").value = data.localidade;
          document.getElementById("stationState").value = data.uf;
        }
      })
      .catch(() => console.log("Erro ao buscar CEP"));
  }
});

// ===============================
// Formatação de campos numéricos e monetários
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

configurarCampoNumeroComSufixo(document.getElementById("stationPower"), "kW");
configurarCampoNumeroComSufixo(document.getElementById("stationWait"), "min");
configurarCampoMoeda(document.getElementById("stationPrice"));
