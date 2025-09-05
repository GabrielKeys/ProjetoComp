// ---- Função de logout ----
function logout() {
  localStorage.removeItem("logado");
  localStorage.removeItem("usuario");
  window.location.href = "../login/login.html";
}