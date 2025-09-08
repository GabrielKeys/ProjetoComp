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
