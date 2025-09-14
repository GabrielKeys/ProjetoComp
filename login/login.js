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

    // procura estação
    const stationFound = stations.find(s =>
      (s.email || "").toLowerCase() === email && (s.password || "") === pass
    );

    if (userFound) {
      // login como usuário
      localStorage.setItem("logado", "true");
      localStorage.setItem("usuario", userFound.fullName || userFound.email || email);
      localStorage.setItem("usuarioEmail", userFound.email || email);
      window.location.href = "../home/home.html";
      return;
    }

    if (stationFound) {
      // login como estação
      localStorage.setItem("logado", "true");
      localStorage.setItem("usuario", stationFound.name || stationFound.email || email);
      localStorage.setItem("usuarioEmail", stationFound.email || email);
      // salva a estação inteira para uso posterior (lista, seleção, etc.)
      localStorage.setItem("estacaoSelecionada", JSON.stringify(stationFound));
      // também pode salvar só o nome se preferir:
      localStorage.setItem("estacaoNome", stationFound.name || "");
      window.location.href = "../home/home.html";
      return;
    }

    // nenhum dos dois encontrou
    document.getElementById("errorMsg").innerText = "Email ou senha incorretos!";
  });
}

// ===============================
// REGISTRO LOCAL
// ===============================
if (stationForm) {
  stationForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const nome = document.getElementById("stationName").value.trim();
    const email = document.getElementById("stationEmail").value.trim();
    const senha = document.getElementById("stationPass").value.trim();
    const telefone = document.getElementById("stationPhone").value.trim();
    const cep = document.getElementById("stationCep").value.trim();
    const rua = document.getElementById("stationAddress").value.trim();
    const numero = document.getElementById("stationNumber").value.trim();
    const bairro = document.getElementById("stationDistrict").value.trim();
    const cidade = document.getElementById("stationCity").value.trim();
    const estado = document.getElementById("stationState").value.trim();
    const potencia = document.getElementById("stationPower").value.trim();
    const abertura = document.getElementById("stationOpen").value.trim();
    const fechamento = document.getElementById("stationClose").value.trim();

    let estacoes = JSON.parse(localStorage.getItem("estacoes")) || [];

    // validações simples
    if (!nome || !email || !senha) {
      mostrarMensagem("❌ Preencha os campos obrigatórios (nome, email, senha).", "erro");
      return;
    }

    if (estacoes.some(e => e.email === email)) {
      mostrarMensagem("❌ Já existe uma estação cadastrada com este email.", "erro");
      return;
    }

    // objeto da estação com as chaves certas
    const novaEstacao = {
      nome,
      email,
      senha,
      telefone,
      cep,
      rua,
      numero,
      bairro,
      cidade,
      estado,
      potencia,
      abertura,
      fechamento
    };

    estacoes.push(novaEstacao);
    localStorage.setItem("estacoes", JSON.stringify(estacoes));

    mostrarMensagem("✅ Estação cadastrada com sucesso!", "sucesso");

    // opcional: logar a estação automaticamente
    localStorage.setItem("logadoEstacao", "true");
    localStorage.setItem("usuarioEstacao", nome);
    localStorage.setItem("usuarioEstacaoEmail", email);

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
  let userIndex = users.findIndex(u => u.email === email);

  if (userIndex !== -1) {
    let userFound = users[userIndex];

    // 🔹 Mantém a foto personalizada se já existir
    const fotoFinal = userFound.photo || picture;

    localStorage.setItem("logado", "true");
    localStorage.setItem("usuario", userFound.fullName || userFound.email);
    localStorage.setItem("usuarioEmail", userFound.email);
    localStorage.setItem("usuarioFoto", fotoFinal);

    // 🔹 Atualiza o objeto users para garantir que a foto fique salva
    if (!userFound.photo && picture) {
      userFound.photo = picture;
      users[userIndex] = userFound;
      localStorage.setItem("users", JSON.stringify(users));
    }

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

    const stationFullName = registerStationForm.querySelector("#fullName")?.value.trim() || "";

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
    const power = document.getElementById("stationPower").value.trim();
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

    if (stations.some(s => (s.email || "").toLowerCase() === email.toLowerCase())) {
      document.getElementById("stationMsg").innerText = "Já existe uma estação registrada com esse email!";
      document.getElementById("stationMsg").style.color = "red";
      return;
    }

    // Criar objeto da nova estação (mesmos nomes de estacoes.js)
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
      fechamento: close
    };

    stations.push(novaEstacao);
    localStorage.setItem("stations", JSON.stringify(stations));

    document.getElementById("stationMsg").innerText = "✅ Estação registrada com sucesso!";
    document.getElementById("stationMsg").style.color = "green";

    // login automático
    localStorage.setItem("logado", "true");
    localStorage.setItem("usuario", novaEstacao.fullName || novaEstacao.nome || novaEstacao.email);
    localStorage.setItem("usuarioEmail", novaEstacao.email);
    localStorage.setItem("estacaoSelecionada", JSON.stringify(novaEstacao));

    registerStationForm.reset();

    setTimeout(() => {
      window.location.href = "../home/home.html";
    }, 1200);
  });
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
