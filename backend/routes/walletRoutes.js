// backend/routes/walletRoutes.js
const express = require("express");
const router = express.Router();
const { supabase } = require("../supabaseClient");

// ===============================
// GET /wallet/:email  → obtém saldo e transações
// ===============================
router.get("/:email", async (req, res) => {
  const { email } = req.params;

  try {
    // busca carteira
    const { data: wallet, error: walletErr } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_email", email)
      .single();

    if (walletErr && walletErr.code !== "PGRST116") throw walletErr;

    // ⚠️ Só busca transações da carteira do usuário
    let transactions = [];
    if (wallet) {
      const { data, error: transErr } = await supabase
        .from("transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false });

      if (transErr) throw transErr;
      transactions = data;
    }

    res.json({
      wallet: wallet || { user_email: email, balance: 0 },
      transactions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// POST /wallet/recharge  → adiciona saldo (recarga)
// ===============================
router.post("/recharge", async (req, res) => {
  const { email, amount, description } = req.body;
  if (!email || !amount)
    return res.status(400).json({ error: "Email e valor são obrigatórios." });

  try {
    // garante que a carteira existe
    const { data: wallet, error: findErr } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_email", email)
      .single();

    if (findErr && findErr.code !== "PGRST116") throw findErr;

    let walletId;
    let newBalance;

    if (!wallet) {
      // cria uma nova carteira
      const { data: newWallet, error: createErr } = await supabase
        .from("wallets")
        .insert([{ user_email: email, balance: amount }])
        .select()
        .single();

      if (createErr) throw createErr;
      walletId = newWallet.id;
      newBalance = amount;
    } else {
      // atualiza saldo existente
      newBalance = Number(wallet.balance) + Number(amount);
      const { error: updateErr } = await supabase
        .from("wallets")
        .update({ balance: newBalance, updated_at: new Date() })
        .eq("id", wallet.id);
      if (updateErr) throw updateErr;
      walletId = wallet.id;
    }

    // registra a transação
    const { error: transErr } = await supabase.from("transactions").insert([
      {
        wallet_id: walletId,
        amount: amount,
        type: "Recarga",
        description: description || "Recarga de saldo",
      },
    ]);
    if (transErr) throw transErr;

    res.status(200).json({
      success: true,
      message: "Recarga aplicada com sucesso!",
      new_balance: newBalance,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
