// backend/testSupabase.js
const { supabase } = require('./supabaseClient');

async function testar() {
  const { data, error } = await supabase.from('users').select('*').limit(5);
  if (error) console.error("Erro:", error);
  else console.log("Usuários:", data);
}
testar();
