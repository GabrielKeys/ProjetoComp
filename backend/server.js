// ==========================================
// VoltWay Backend Server
// ==========================================
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { supabase } = require('./supabaseClient');

dotenv.config();

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors()); // 🔓 Libera todas as origens (temporariamente)
app.use(express.json());


// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/', (req, res) => res.json({ ok: true, version: 'voltway-backend-1' }));

// ==========================================
// USERS
// ==========================================
app.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(100);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/users', async (req, res) => {
  const payload = req.body;
  if (!payload?.email)
    return res.status(400).json({ error: 'email is required' });

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// LOGIN DE USUÁRIO
// ==========================================
app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email e senha são obrigatórios" });

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user)
      return res.status(401).json({ error: "Usuário não encontrado" });

    if (user.password !== password)
      return res.status(401).json({ error: "Senha incorreta" });

    return res.json({
      email: user.email,
      name: user.full_name,
      role: user.role || "user",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// LOGIN DE ESTAÇÃO
// ==========================================
app.post("/stations/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email e senha são obrigatórios" });

  try {
    const { data: station, error } = await supabase
      .from("stations")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !station)
      return res.status(401).json({ error: "Estação não encontrada" });

    if (station.password !== password)
      return res.status(401).json({ error: "Senha incorreta" });

    return res.json({
      email: station.email,
      name: station.name,
      role: "station",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// REGISTRO DE ESTAÇÃO
// ==========================================
app.post("/stations", async (req, res) => {
  const payload = req.body;

  if (!payload?.email || !payload?.password || !payload?.name)
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });

  try {
    const { data, error } = await supabase
      .from("stations")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("Erro ao registrar estação:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// LISTAR ESTAÇÕES
// ==========================================
app.get("/stations", async (req, res) => {
  try {
    const { data, error } = await supabase.from("stations").select("*");
    if (error) throw error;

    // 🔹 Formata os horários no backend
    const formatadas = data.map((s) => ({
      ...s,
      open_time: s.open_time ? s.open_time.slice(0, 5) : null, // transforma 22:00:00 → 22:00
      close_time: s.close_time ? s.close_time.slice(0, 5) : null,
    }));

    res.json(formatadas);
  } catch (err) {
    console.error("Erro ao buscar estações:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// WALLET ROUTES
// ==========================================
const walletRoutes = require("./routes/walletRoutes");
app.use("/wallet", walletRoutes);

// ==========================================
// ROTAS DE VEÍCULOS
// ==========================================

// Buscar veículo de um usuário
app.get("/veiculos/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const { data, error } = await supabase
      .from("veiculos")
      .select("*")
      .eq("usuario_email", email)
      .single();

    if (error) {
      console.error("❌ Erro ao buscar veículo:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Erro inesperado:", err);
    res.status(500).json({ error: err.message });
  }
});


// Inserir/atualizar veículo
app.post("/veiculos", async (req, res) => {
  const { usuario_email, modelo, ano, placa, bateria, carregamento } = req.body;

  console.log("📩 Dados recebidos do front:", req.body);

  try {
    const { data, error } = await supabase
      .from("veiculos")
      .upsert(
        [{ usuario_email, modelo, ano, placa, bateria, carregamento }],
        { onConflict: "usuario_email" }
      )
      .select()
      .single();

    if (error) {
      console.error("❌ Erro Supabase ao salvar veículo:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("✅ Veículo salvo com sucesso:", data);
    res.json(data);

  } catch (err) {
    console.error("❌ Erro inesperado no servidor:", err);
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// START SERVER (⚠️ MOVIDO PARA O FINAL)
// ==========================================
app.listen(PORT, () => {
  console.log(`⚡ VoltWay backend rodando em http://localhost:${PORT}`);
});
