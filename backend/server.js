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

// 🧠 Estes devem vir antes de QUALQUER rota
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

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
    return res.status(400).json({ error: 'email é obrigatório' });

  try {
    // Usa upsert para inserir OU atualizar automaticamente
    const { data, error } = await supabase
      .from('users')
      .upsert([payload], { onConflict: 'email' }) // 🔹 evita erro de duplicidade
      .select()
      .single();

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ATUALIZAR USUÁRIO EXISTENTE
// ==========================================
app.put('/users/:email', async (req, res) => {
  const { email } = req.params;
  const payload = req.body;

  try {
    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("❌ Erro ao atualizar usuário:", err.message);
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
// Buscar estação por email
// ==========================================
app.get("/stations/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { data, error } = await supabase
      .from("stations")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Estação não encontrada" });
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Erro ao buscar estação:", err);
    res.status(500).json({ error: "Erro ao buscar dados" });
  }
});

// ==========================================
// Atualizar dados da estação
// ==========================================
app.put("/stations/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from("stations")
      .update(updates)
      .eq("email", email)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("❌ Erro ao atualizar estação:", err);
    res.status(500).json({ error: "Erro ao atualizar estação" });
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
  console.log(`🚗 Buscando veículo do usuário: ${email}`);
  try {
    const { data, error } = await supabase
      .from("veiculos")
      .select("*")
      .eq("usuario_email", email)
      .maybeSingle(); // evita erro se não existir

    if (error) {
      console.error("❌ Erro ao buscar veículo:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data || {}); // retorna objeto vazio se não houver veículo
  } catch (err) {
    console.error("❌ Erro inesperado:", err);
    res.status(500).json({ error: err.message });
  }
});

// Inserir/atualizar veículo
app.post("/veiculos", async (req, res) => {
  const { usuario_email, modelo, ano, placa, bateria, carregamento } = req.body;

  console.log("📦 Dados recebidos do front:", req.body);

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
// RESERVAS
// ==========================================
app.post("/reservas", async (req, res) => {
  try {
    console.log("📥 Dados recebidos em /reservas:", req.body);

    const {
      usuario_email,
      usuario_nome,
      usuario_telefone,
      estacao_email,
      estacao_nome,
      estacao_telefone,
      data,
      inicio,
      fim,
      duracao_horas,
      duracao_minutos,
      status,
      veiculo_modelo,
      veiculo_ano,
      veiculo_placa,
      veiculo_bateria,
      veiculo_carga,
      telefone // 🔸 antigo campo genérico (mantido por compatibilidade)
    } = req.body || {};

    if (!usuario_email || !estacao_email || !data || !inicio || !fim) {
      console.warn("⚠️ Campos obrigatórios faltando:", { usuario_email, estacao_email, data, inicio, fim });
      return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    const safeInt = (val) => (val === "" || val === undefined ? null : Number(val));
    const safeNum = (val) => (val === "" || val === undefined ? null : Number(val));

    const reservaData = {
      usuario_email,
      usuario_nome,
      usuario_telefone,
      estacao_email,
      estacao_nome,
      estacao_telefone,
      data,
      inicio,
      fim,
      duracao_horas: safeInt(duracao_horas),
      duracao_minutos: safeInt(duracao_minutos),
      status,
      veiculo_modelo,
      veiculo_ano: safeInt(veiculo_ano),
      veiculo_placa,
      veiculo_bateria: safeNum(veiculo_bateria),
      veiculo_carga: safeNum(veiculo_carga),
      telefone // mantido se ainda quiser compatibilidade
    };

    const { error } = await supabase.from("reservas").insert([reservaData]);

    if (error) {
      console.error("❌ Erro ao salvar reserva:", error);
      return res.status(500).json({
        error: "Erro ao salvar reserva",
        details: error.message
      });
    }

    console.log("✅ Nova reserva salva no banco com sucesso!");
    return res.status(201).json({ success: true, message: "Reserva criada com sucesso" });
  } catch (err) {
    console.error("❌ Erro interno no endpoint /reservas:", err);
    return res.status(500).json({
      error: "Erro interno do servidor",
      details: err.message
    });
  }
});

// ==========================================
// GET - Buscar reservas por usuário
// ==========================================
app.get("/reservas/:email", async (req, res) => {
  const { email } = req.params;
  console.log(`📦 Buscando reservas do usuário: ${email}`);

  try {
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("usuario_email", email)
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log("✅ Reservas encontradas:", data.length);
    res.json(data);
  } catch (err) {
    console.error("❌ Erro ao buscar reservas:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// GET - Buscar reservas por estação
// ==========================================
app.get("/reservas/estacao/:email", async (req, res) => {
  const { email } = req.params;
  console.log(`📦 Buscando reservas da estação: ${email}`);

  try {
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("estacao_email", email)
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log("✅ Reservas da estação encontradas:", data.length);
    res.json(data);
  } catch (err) {
    console.error("❌ Erro ao buscar reservas da estação:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// PUT - Atualizar status da reserva + reembolso
// ==========================================
app.put("/reservas/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log(`📝 Atualizando status da reserva ${id} para: ${status}`);

  if (!id || !status) {
    return res.status(400).json({ error: "ID e status são obrigatórios." });
  }

  try {
    // 1️⃣ Buscar reserva atual
    const { data: reserva, error: fetchError } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !reserva) {
      throw new Error("Reserva não encontrada.");
    }

    // 2️⃣ Atualizar status
    const { data: updated, error: updateError } = await supabase
      .from("reservas")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log("✅ Status atualizado:", updated);

    // 3️⃣ Aplicar reembolso automático se cancelada
    if (status === "cancelada") {
      const emailUsuario = reserva.usuario_email;
      const valorReembolso = 10;

      // Inserir transação de reembolso
      const { error: transError } = await supabase.from("transacoes").insert([
        {
          usuario_email: emailUsuario,
          valor: valorReembolso,
          tipo: "Reembolso",
          descricao: `Reembolso automático por cancelamento da reserva ${id}`,
          data: new Date().toISOString()
        }
      ]);

      if (transError) {
        console.error("⚠️ Falha ao registrar reembolso:", transError.message);
      } else {
        console.log(`💸 Reembolso de R$${valorReembolso} aplicado a ${emailUsuario}`);
      }
    }

    return res.json({ success: true, reserva: updated });
  } catch (err) {
    console.error("❌ Erro ao atualizar status:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// START SERVER 
// ==========================================
app.listen(PORT, () => {
  console.log(`⚡ VoltWay backend rodando em http://localhost:${PORT}`);
});
