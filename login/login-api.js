// ===============================
// VoltWay Login com API - Substitui localStorage
// ===============================

// Incluir o serviço de API
const script = document.createElement('script');
script.src = '../api-service.js';
document.head.appendChild(script);

// Aguardar API carregar
script.onload = function() {
  initializeLoginAPI();
};

function initializeLoginAPI() {
  console.log('🔌 VoltWay Login API inicializado');

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

  // ===============================
  // LOGIN COM API (substitui localStorage)
  // ===============================
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const emailRaw = document.getElementById("username").value || "";
      const pass = (document.getElementById("password").value || "").trim();
      const email = emailRaw.trim().toLowerCase();

      if (!email || !pass) {
        showError("Digite email e senha!");
        return;
      }

      try {
        showLoading("Fazendo login...");

        // Tentar login como usuário normal
        const response = await api.login(email, pass);

        if (response.success) {
          // Login bem-sucedido
          const user = response.data.user;
          
          // Salvar dados para compatibilidade
          localStorage.setItem("logado", "true");
          localStorage.setItem("logado_como", "usuario");
          localStorage.setItem("usuario", user.fullName || user.email);
          localStorage.setItem("usuarioEmail", user.email);

          showSuccess("Login realizado com sucesso!");
          
          // Redirecionar
          setTimeout(() => {
            window.location.href = "../home/home.html";
          }, 1000);
        }
      } catch (error) {
        console.error('Erro no login:', error);
        showError("Email ou senha incorretos!");
      }
    });
  }

  // ===============================
  // REGISTRO COM API
  // ===============================
  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
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

      // Validações
      if (!fullName || !newEmail || !newPass) {
        showError("Nome, email e senha são obrigatórios!");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        showError("Digite um email válido!");
        return;
      }

      if (newPass.length < 8) {
        showError("A senha deve ter pelo menos 8 caracteres!");
        return;
      }

      try {
        showLoading("Criando conta...");

        // Registrar usuário
        const response = await api.register({
          fullName,
          email: newEmail,
          password: newPass,
          phone
        });

        if (response.success) {
          // Salvar dados para compatibilidade
          localStorage.setItem("logado", "true");
          localStorage.setItem("logado_como", "usuario");
          localStorage.setItem("usuario", fullName || newEmail);
          localStorage.setItem("usuarioEmail", newEmail);

          // Cadastrar veículo se fornecido
          if (carModel || carYear || carPlate || carBattery || carPower) {
            try {
              await api.createVehicle({
                model: carModel,
                year: parseInt(carYear) || null,
                plate: carPlate,
                batteryCapacity: parseFloat(carBattery) || null,
                chargingPower: parseFloat(carPower) || null
              });
            } catch (vehicleError) {
              console.warn('Erro ao cadastrar veículo:', vehicleError);
              // Não falhar o registro por causa do veículo
            }
          }

          showSuccess("Conta criada com sucesso!");
          
          setTimeout(() => {
            window.location.href = "../home/home.html";
          }, 2000);
        }
      } catch (error) {
        console.error('Erro no registro:', error);
        showError(error.message || "Erro ao criar conta!");
      }
    });
  }

  // ===============================
  // LOGIN COM GOOGLE (API)
  // ===============================
  function initGoogleLoginAPI() {
    const CLIENT_ID = "288143953215-o49d879dqorujtkpgfqg80gp7u9ai9ra.apps.googleusercontent.com";

    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponseAPI,
    });

    google.accounts.id.renderButton(
      document.getElementById("googleLoginBtn"),
      { theme: "outline", size: "large", text: "continue_with" }
    );

    google.accounts.id.prompt();
  }

  async function handleCredentialResponseAPI(response) {
    try {
      const data = parseJwt(response.credential);
      const email = data.email;
      const name = data.name || "Usuário Google";
      const picture = data.picture || "";

      showLoading("Fazendo login com Google...");

      // Login/Registro com Google via API
      const response = await api.loginWithGoogle({
        googleId: data.sub,
        email,
        fullName: name,
        photoUrl: picture
      });

      if (response.success) {
        const user = response.data.user;
        
        // Salvar dados para compatibilidade
        localStorage.setItem("logado", "true");
        localStorage.setItem("logado_como", "usuario");
        localStorage.setItem("usuario", user.fullName || user.email);
        localStorage.setItem("usuarioEmail", user.email);

        showSuccess("Login com Google realizado com sucesso!");
        
        setTimeout(() => {
          window.location.href = "../home/home.html";
        }, 1000);
      }
    } catch (error) {
      console.error('Erro no login Google:', error);
      showError("Erro ao fazer login com Google!");
    }
  }

  // Carregar Google SDK
  const googleScript = document.createElement("script");
  googleScript.src = "https://accounts.google.com/gsi/client";
  googleScript.async = true;
  googleScript.defer = true;
  googleScript.onload = initGoogleLoginAPI;
  document.head.appendChild(googleScript);

  // ===============================
  // REGISTRO DE ESTAÇÃO COM API
  // ===============================
  const registerStationForm = document.getElementById("registerStationForm");

  if (registerStationForm) {
    registerStationForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const name = document.getElementById("stationName").value.trim();
      const email = document.getElementById("stationEmail").value.trim();
      const pass = document.getElementById("stationPass").value.trim();
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
      const open = document.getElementById("stationOpen").value.trim();
      const close = document.getElementById("stationClose").value.trim();

      // Validações
      if (!name || !email || !pass) {
        showError("Nome, email e senha são obrigatórios!");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("Digite um email válido!");
        return;
      }

      if (pass.length < 8) {
        showError("A senha deve ter pelo menos 8 caracteres!");
        return;
      }

      try {
        showLoading("Registrando estação...");

        // Registrar proprietário da estação
        const ownerResponse = await api.register({
          fullName: name,
          email,
          password: pass,
          phone
        });

        if (ownerResponse.success) {
          // Criar estação
          const stationData = {
            name,
            address: `${address}, ${number}, ${district}, ${city} - ${state}`,
            street: address,
            number,
            neighborhood: district,
            city,
            state,
            zipCode: cep,
            powerKw: parseFloat(powerRaw.replace(/[^\d.,]/g, "")) || 0,
            pricePerKwh: parseFloat(priceRaw.replace(/[^\d.,]/g, "")) || null,
            waitingTimeMinutes: parseInt(waitRaw.replace(/[^\d.,]/g, "")) || null,
            openingHour: open,
            closingHour: close,
            is24h: false,
            phone
          };

          const stationResponse = await api.createStation(stationData);

          if (stationResponse.success) {
            // Salvar dados para compatibilidade
            localStorage.setItem("logado", "true");
            localStorage.setItem("logado_como", "estacao");
            localStorage.setItem("usuario", name || email);
            localStorage.setItem("usuarioEmail", email);

            showSuccess("Estação registrada com sucesso!");
            
            setTimeout(() => {
              window.location.href = "../station/home.html";
            }, 1500);
          }
        }
      } catch (error) {
        console.error('Erro no registro da estação:', error);
        showError(error.message || "Erro ao registrar estação!");
      }
    });
  }

  // ===============================
  // FUNÇÕES AUXILIARES
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
    } catch (e) {
      console.error("Erro ao decodificar token:", e);
      return {};
    }
  }

  function showError(message) {
    const errorElement = document.getElementById("errorMsg") || document.getElementById("registerMsg") || document.getElementById("stationMsg");
    if (errorElement) {
      errorElement.innerText = message;
      errorElement.style.color = "red";
    }
  }

  function showSuccess(message) {
    const successElement = document.getElementById("registerMsg") || document.getElementById("stationMsg");
    if (successElement) {
      successElement.innerText = message;
      successElement.style.color = "green";
    }
  }

  function showLoading(message) {
    const loadingElement = document.getElementById("registerMsg") || document.getElementById("stationMsg");
    if (loadingElement) {
      loadingElement.innerText = message;
      loadingElement.style.color = "blue";
    }
  }

  // ===============================
  // MIGRAÇÃO DE DADOS EXISTENTES
  // ===============================
  
  // Tentar migrar dados do localStorage na inicialização
  window.addEventListener('load', async () => {
    try {
      await api.migrateLocalData();
    } catch (error) {
      console.log('Migração de dados não necessária ou falhou:', error);
    }
  });
}

// Aplicar regras de formatação (mantém código existente)
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

// Aplicar regras quando a página carregar
document.addEventListener("DOMContentLoaded", aplicarRegrasInputs);
