// ---- Troca de abas ----
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

loginTab.addEventListener("click", () => {
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  loginForm.classList.add("active");
  registerForm.classList.remove("active");
});

registerTab.addEventListener("click", () => {
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  registerForm.classList.add("active");
  loginForm.classList.remove("active");
});

// ---- LOGIN ----
if (loginForm) {
  loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    let users = JSON.parse(localStorage.getItem("users")) || [];

    const userFound = users.find(u => u.username === user && u.password === pass);

    if (userFound) {
      localStorage.setItem("logado", "true");
      localStorage.setItem("usuario", user);
      window.location.href = "../home/home.html";
    } else {
      document.getElementById("errorMsg").innerText = "Usuário ou senha incorretos!";
    }
  });
}

// ---- REGISTRO ----
if (registerForm) {
  registerForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const newUser = document.getElementById("newUser").value;
    const newPass = document.getElementById("newPass").value;

    let users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.some(u => u.username === newUser)) {
      document.getElementById("registerMsg").innerText = "Usuário já existe!";
      document.getElementById("registerMsg").style.color = "red";
    } else {
      users.push({ username: newUser, password: newPass });
      localStorage.setItem("users", JSON.stringify(users));

      document.getElementById("registerMsg").innerText = "Conta criada com sucesso!";
      document.getElementById("registerMsg").style.color = "green";

      // Redireciona para login depois de 2s
      setTimeout(() => {
        loginTab.click(); // volta para aba de login
      }, 2000);
    }
  });
}