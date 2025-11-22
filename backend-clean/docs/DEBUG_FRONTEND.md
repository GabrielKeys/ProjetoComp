# Debug Frontend - Problemas de Conexão

## Problema Reportado
Quando dá F5 no `login.html`, não consegue criar usuário nem registrar nem fazer nada.

## Correções Aplicadas

### 1. ✅ Adicionado config.js antes do api-service.js
**Problema:** O `api-service.js` precisa do `window.VOLTWAY_CONFIG` que é definido no `config.js`, mas o `config.js` não estava sendo carregado.

**Solução:** Adicionado `<script src="../config.js"></script>` antes de `api-service.js` no `login.html`.

### 2. ✅ Corrigido carregamento dinâmico duplicado
**Problema:** O `login-api.js` estava tentando carregar o `api-service.js` dinamicamente, mas ele já estava no HTML, causando conflito.

**Solução:** Removido o carregamento dinâmico e ajustado para aguardar o `window.api` estar disponível.

### 3. ✅ Conversão de fullName para full_name
**Problema:** O frontend envia `fullName` mas o backend espera `full_name`.

**Solução:** Adicionada conversão automática no `api-service.js` antes de enviar para o backend.

### 4. ✅ Inicialização correta do login-api.js
**Problema:** O `login-api.js` não estava aguardando os scripts carregarem.

**Solução:** Adicionada verificação para aguardar `window.api` estar disponível antes de inicializar.

## Como Verificar se Está Funcionando

### 1. Abrir o Console do Navegador (F12)
Você deve ver:
```
🔧 VoltWay Config: {API_BASE_URL: "http://localhost:3000/api", ...}
🔌 VoltWay Login API inicializado
```

### 2. Verificar se o Servidor Está Rodando
```bash
cd backend-clean
node server.refactored.js
```

Você deve ver:
```
✅ Banco de dados conectado
🚀 Servidor rodando na porta 3000
```

### 3. Testar Registro
- Preencha o formulário de registro
- Clique em "Registrar"
- Deve aparecer mensagem de sucesso e redirecionar

### 4. Verificar Erros no Console
Se ainda houver problemas, verifique:
- ❌ "Failed to fetch" → Servidor não está rodando
- ❌ "API não está disponível" → Scripts não carregaram corretamente
- ❌ "CORS error" → Problema de CORS (já corrigido)

## Arquivos Modificados

1. `login/login.html` - Adicionado `config.js`
2. `login/login-api.js` - Corrigida inicialização
3. `api-service.js` - Adicionada conversão `fullName` → `full_name`

## Status

✅ Config.js carregando antes do api-service
✅ Inicialização corrigida
✅ Conversão de campos corrigida
✅ CORS permitindo file:// em desenvolvimento

