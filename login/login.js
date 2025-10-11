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
// LOGIN LOCAL (por email) - verifica USERS e STATIONS
// ===============================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const emailRaw = document.getElementById("username").value || "";
    const pass = (document.getElementById("password").value || "").trim();

    const email = emailRaw.trim().toLowerCase();

    let users = JSON.parse(localStorage.getItem("users")) || [];
    let stations = JSON.parse(localStorage.getItem("stations")) || [];

    // procura usuário normal
    const userFound = users.find(u =>
      (u.email || "").toLowerCase() === email && (u.password || "") === pass
    );

    // procura estação (corrigido: usa 's.senha' e não 's.password')
    const stationFound = stations.find(s =>
      (s.email || "").toLowerCase() === email && (s.senha || "") === pass
    );

    if (userFound) {
      // login como usuário
      localStorage.setItem("logado", "true");
      localStorage.setItem("logado_como", "usuario"); // ✅
      localStorage.setItem("usuario", userFound.fullName || userFound.email || email);
      localStorage.setItem("usuarioEmail", userFound.email || email);
      window.location.href = "../home/home.html";
      return;
    }

    if (stationFound) {
      // login como estação
      localStorage.setItem("logado", "true");
      localStorage.setItem("logado_como", "estacao"); // ✅
      localStorage.setItem("usuario", stationFound.name || stationFound.nome || stationFound.email || email);
      localStorage.setItem("usuarioEmail", stationFound.email || email);
      localStorage.setItem("estacaoSelecionada", JSON.stringify(stationFound));
      localStorage.setItem("estacaoNome", stationFound.name || stationFound.nome || "");
      window.location.href = "../station/home.html";
      return;
    }

    // nenhum dos dois encontrou
    document.getElementById("errorMsg").innerText = "Email ou senha incorretos!";
  });
}


// ===============================
// REGISTRO LOCAL (Usuário)
// ===============================
const registerForm = document.getElementById("registerForm");

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

    let stations = JSON.parse(localStorage.getItem("stations")) || [];

    // Bloqueia e-mail já usado em usuários OU estações
    if (users.some(u => u.email === newEmail) || stations.some(s => s.email === newEmail)) {
      document.getElementById("registerMsg").innerText = "Este email já está em uso!";
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
    localStorage.setItem("logado_como", "usuario");
    localStorage.setItem("usuario", fullName || newEmail);
    localStorage.setItem("usuarioEmail", newEmail);
    localStorage.removeItem("googleCadastro"); // Limpa flag do Google
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
  let stations = JSON.parse(localStorage.getItem("stations")) || [];

  // ✅ 1️⃣ PRIORIDADE: verificar se já é estação
  const stationFound = stations.find(s => (s.email || "").toLowerCase() === email.toLowerCase());
  if (stationFound) {
    localStorage.setItem("logado", "true");
    localStorage.setItem("logado_como", "estacao");
    localStorage.setItem("usuario", stationFound.nome || stationFound.email);
    localStorage.setItem("usuarioEmail", stationFound.email);
    localStorage.setItem("estacaoSelecionada", JSON.stringify(stationFound));
    window.location.href = "../station/home.html";
    return;
  }

  // ✅ 2️⃣ SENÃO, verificar se já é usuário
  const userFound = users.find(u => (u.email || "").toLowerCase() === email.toLowerCase());
  if (userFound) {
    localStorage.setItem("logado", "true");
    localStorage.setItem("logado_como", "usuario");
    localStorage.setItem("usuario", userFound.fullName || userFound.email);
    localStorage.setItem("usuarioEmail", userFound.email);
    localStorage.setItem("usuarioFoto", userFound.photo || picture);
    window.location.href = "../home/home.html";
    return;
  }

  // ✅ 3️⃣ SENÃO, é primeira vez → vai para registro
  localStorage.setItem("googleCadastro", JSON.stringify({ email, name, picture }));
  window.location.href = "../login/login.html?registerGoogle=true";
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

// 🔹 Se trocar para "Registrar Estação" após login do Google
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
// REGISTRO DE ESTAÇÃO
// ===============================
const registerStationForm = document.getElementById("registerStationForm");

if (registerStationForm) {
  registerStationForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const stationFullName = registerStationForm.querySelector("#stationFullName")?.value.trim() || "";

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

    // 🔹 Pega os valores brutos
    const powerRaw = document.getElementById("stationPower").value.trim();
    const priceRaw = document.getElementById("stationPrice")?.value.trim() || "";
    const waitRaw = document.getElementById("stationWait")?.value.trim() || "";

    const open = document.getElementById("stationOpen").value.trim();
    const close = document.getElementById("stationClose").value.trim();

    let stations = JSON.parse(localStorage.getItem("stations")) || [];

    // validações
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById("stationMsg").innerText = "Digite um email válido!";
      document.getElementById("stationMsg").style.color = "red";
      return;
    }

    if (pass.length < 8) {
      document.getElementById("stationMsg").innerText = "A senha deve ter pelo menos 8 caracteres!";
      document.getElementById("stationMsg").style.color = "red";
      return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Bloqueia e-mail já usado em estações OU usuários
    if (
      stations.some(s => (s.email || "").toLowerCase() === email.toLowerCase()) ||
      users.some(u => (u.email || "").toLowerCase() === email.toLowerCase())
    ) {
      document.getElementById("stationMsg").innerText = "Este email já está em uso!";
      document.getElementById("stationMsg").style.color = "red";
      return;
    }


    // 🔹 Remove os sufixos antes de salvar
    const power = powerRaw.replace(/[^\d.,]/g, "");
    const preco = priceRaw.replace(/[^\d.,]/g, "");
    const wait = waitRaw.replace(/[^\d.,]/g, "");

    // Criar objeto da nova estação
    const novaEstacao = {
      fullName: stationFullName,
      nome: name,
      email,
      senha: pass,
      telefone: phone,
      cep,
      rua: address,
      numero: number,
      bairro: district,
      cidade: city,
      estado: state,
      potencia: power,
      abertura: open,
      fechamento: close,

      //Extras
      preco,
      tempoEspera: wait,
    };

    stations.push(novaEstacao);
    localStorage.setItem("stations", JSON.stringify(stations));

    document.getElementById("stationMsg").innerText = "✅ Estação registrada com sucesso!";
    document.getElementById("stationMsg").style.color = "green";

    // login automático
    localStorage.setItem("logado", "true");
    localStorage.setItem("logado_como", "estacao"); 
    localStorage.setItem("usuario", novaEstacao.fullName || novaEstacao.nome || novaEstacao.email);
    localStorage.setItem("usuarioEmail", novaEstacao.email);
    localStorage.setItem("estacaoSelecionada", JSON.stringify(novaEstacao));

    registerStationForm.reset();
    localStorage.removeItem("googleCadastro");

    // Repete antes do redirecionamento só para garantir que nada trocou depois
    setTimeout(() => {
      localStorage.seztItem("logado_como", "estacao"); 
      window.location.href = "../station/home.html";
    }, 1200);

  });

  // 🔹 Preenchimento automático do endereço com CEP
  document.getElementById("stationCep")?.addEventListener("blur", function () {
    let cep = this.value.replace(/\D/g, "");
    if (cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
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
  // 🔹 Funções para aplicar sufixo/prefixo
  // ===============================
  function configurarCampoNumeroComSufixo(input, sufixo) {
    if (!input) return;
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^\d.,]/g, "");
    });
    input.addEventListener("blur", () => {
      if (input.value && !input.value.includes(sufixo)) {
        input.value = input.value + " " + sufixo;
      }
    });
    input.addEventListener("focus", () => {
      input.value = input.value.replace(" " + sufixo, "");
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

  // Aplicar nos campos
  configurarCampoNumeroComSufixo(document.getElementById("stationPower"), "kW");
  configurarCampoNumeroComSufixo(document.getElementById("stationWait"), "min");
  configurarCampoMoeda(document.getElementById("stationPrice"));
}


// ===============================
// AUTO-PREENCHER ENDEREÇO PELO CEP (ViaCEP)
// ===============================
const cepInput = document.getElementById("stationCep");

if (cepInput) {
  cepInput.addEventListener("blur", () => {
    let cep = cepInput.value.replace(/\D/g, "");
    if (cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            // Endereço
            const addressField = document.getElementById("stationAddress");
            addressField.value = data.logradouro || "";
            addressField.readOnly = !!data.logradouro;

            // Bairro
            const districtField = document.getElementById("stationDistrict");
            districtField.value = data.bairro || "";
            districtField.readOnly = !!data.bairro;

            // Cidade
            const cityField = document.getElementById("stationCity");
            cityField.value = data.localidade || "";
            cityField.readOnly = !!data.localidade;

            // Estado
            const stateField = document.getElementById("stationState");
            stateField.value = data.uf || "";
            stateField.readOnly = !!data.uf;

          } else {
            alert("CEP não encontrado!");
          }
        })
        .catch(() => alert("Erro ao buscar CEP!"));
    }
  });
}
