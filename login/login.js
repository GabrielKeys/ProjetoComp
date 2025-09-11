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
// LOGIN LOCAL (por email)
// ===============================
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    let users = JSON.parse(localStorage.getItem("users")) || [];
    const userFound = users.find(u => u.email === email && u.password === pass);

    if (userFound) {
      localStorage.setItem("logado", "true");
      localStorage.setItem("usuario", userFound.fullName || email);
      localStorage.setItem("usuarioEmail", email);
      window.location.href = "../home/home.html";
    } else {
      document.getElementById("errorMsg").innerText = "Email ou senha incorretos!";
    }
  });
}

// ===============================
// REGISTRO LOCAL
// ===============================
if (registerForm) {
  registerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const newEmail = document.getElementById("newEmail").value.trim();
    const newPass = document.getElementById("newPass").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const carModel = document.getElementById("carModel").value.trim();
    const carYear = document.getElementById("carYear").value.trim();
    const carPlate = document.getElementById("carPlate").value.trim();
    const carBattery = document.getElementById("carBattery").value.trim();
    const carPower = document.getElementById("carPower")?.value.trim() || "";

    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Verificações
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      document.getElementById("registerMsg").innerText = "Digite um email válido!";
      document.getElementById("registerMsg").style.color = "red";
      return;
    }

    if (newPass.length < 8) {
      document.getElementById("registerMsg").innerText = "A senha deve ter pelo menos 8 caracteres!";
      document.getElementById("registerMsg").style.color = "red";
      return;
    }

    if (users.some(u => u.email === newEmail)) {
      document.getElementById("registerMsg").innerText = "Email já registrado!";
      document.getElementById("registerMsg").style.color = "red";
      return;
    }

    // Criar usuário
    const novoUsuario = {
      fullName,
      email: newEmail,
      password: newPass,
      phone
    };

    users.push(novoUsuario);
    localStorage.setItem("users", JSON.stringify(users));

    // 🔹 Salvar informações do carro nas mesmas chaves que o home usa
    if (carModel) localStorage.setItem(`veiculoModelo_${newEmail}`, carModel);
    if (carYear) localStorage.setItem(`veiculoAno_${newEmail}`, carYear);
    if (carPlate) localStorage.setItem(`veiculoPlaca_${newEmail}`, carPlate);
    if (carBattery) localStorage.setItem(`veiculoBateria_${newEmail}`, carBattery + " kWh");
    if (carPower) localStorage.setItem(`veiculoCarregamento_${newEmail}`, carPower + " kW");

    // Exibe mensagem de sucesso
    document.getElementById("registerMsg").innerText = "✅ Conta criada com sucesso!";
    document.getElementById("registerMsg").style.color = "green";

    // 🔹 Já loga automaticamente
    localStorage.setItem("logado", "true");
    localStorage.setItem("usuario", fullName || newEmail);
    localStorage.setItem("usuarioEmail", newEmail);

    // 🔹 Aguarda 2 segundos antes de redirecionar
    setTimeout(() => {
      window.location.href = "../home/home.html";
    }, 2000);
  });
}


// ===============================
// LOGIN COM GOOGLE
// ===============================
function initGoogleLogin() {
  const CLIENT_ID = "288143953215-o49d879dqorujtkpgfqg80gp7u9ai9ra.apps.googleusercontent.com"; // substitua pelo seu

  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse,
  });

  google.accounts.id.renderButton(
    document.getElementById("googleLoginBtn"),
    { theme: "outline", size: "large", text: "continue_with" }
  );

  google.accounts.id.prompt();
}

function handleCredentialResponse(response) {
  const data = parseJwt(response.credential);
  const email = data.email;
  const name = data.name || "Usuário Google";
  const picture = data.picture || "";

  let users = JSON.parse(localStorage.getItem("users")) || [];
  const userFound = users.find(u => u.email === email);

  if (userFound) {
    // Usuário já existe → entra direto
    localStorage.setItem("logado", "true");
    localStorage.setItem("usuario", userFound.fullName || userFound.email);
    localStorage.setItem("usuarioEmail", userFound.email);
    localStorage.setItem("usuarioFoto", userFound.foto || picture);

    window.location.href = "../home/home.html";
  } else {
    // Primeira vez → redireciona para registro
    localStorage.setItem("googleCadastro", JSON.stringify({ email, name, picture }));
    window.location.href = "../login/login.html?registerGoogle=true";
  }
}

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
  } catch (e) {
    console.error("Erro ao decodificar token:", e);
    return {};
  }
}

// Carregar Google SDK
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
// Máscara de telefone
// ===============================
const phoneInput = document.getElementById("phone");

if (phoneInput) {
  phoneInput.addEventListener("input", () => {
    let valor = phoneInput.value.replace(/\D/g, "");
    valor = valor.slice(0, 11);

    if (valor.length > 2) {
      valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
    }
    if (valor.length > 9) {
      valor = `${valor.slice(0, 9)}-${valor.slice(9)}`;
    }

    phoneInput.value = valor;
  });
}

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
