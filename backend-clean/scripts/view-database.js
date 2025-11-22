// Script para visualizar dados do banco de dados
// Uso: node scripts/view-database.js

require('dotenv').config();
const { query } = require('../db');

async function viewDatabase() {
  try {
    console.log('\n📊 DADOS DO BANCO DE DADOS VOLTWAY\n');
    console.log('=' .repeat(50));
    
    // Usuários
    const users = await query('SELECT id, full_name, email, phone, is_google_user FROM users ORDER BY id');
    console.log(`\n👥 USUÁRIOS: ${users.rows.length}`);
    if (users.rows.length > 0) {
      users.rows.forEach(u => {
        const google = u.is_google_user ? ' (Google)' : '';
        console.log(`  ${u.id}. ${u.full_name} - ${u.email}${google}`);
        if (u.phone) console.log(`     📞 ${u.phone}`);
      });
    } else {
      console.log('  (Nenhum usuário cadastrado)');
    }
    
    // Estações
    const stations = await query('SELECT id, name, city, state, power_kw, price_per_kwh, is_active FROM stations ORDER BY id');
    console.log(`\n🔌 ESTAÇÕES: ${stations.rows.length}`);
    if (stations.rows.length > 0) {
      stations.rows.forEach(s => {
        const status = s.is_active ? '✅' : '❌';
        console.log(`  ${s.id}. ${s.name} ${status}`);
        console.log(`     📍 ${s.city}/${s.state} - ${s.power_kw}kW - R$ ${s.price_per_kwh}/kWh`);
      });
    } else {
      console.log('  (Nenhuma estação cadastrada)');
    }
    
    // Veículos
    const vehicles = await query(`
      SELECT v.id, v.model, v.year, v.plate, v.battery_capacity, v.charging_power, u.full_name as owner
      FROM vehicles v
      LEFT JOIN users u ON v.user_id = u.id
      ORDER BY v.id
    `);
    console.log(`\n🚗 VEÍCULOS: ${vehicles.rows.length}`);
    if (vehicles.rows.length > 0) {
      vehicles.rows.forEach(v => {
        console.log(`  ${v.id}. ${v.model} ${v.year || ''} - ${v.plate || 'Sem placa'}`);
        console.log(`     👤 ${v.owner || 'Sem dono'}`);
        if (v.battery_capacity) console.log(`     🔋 ${v.battery_capacity}kWh`);
        if (v.charging_power) console.log(`     ⚡ ${v.charging_power}kW`);
      });
    } else {
      console.log('  (Nenhum veículo cadastrado)');
    }
    
    // Reservas
    const reservations = await query(`
      SELECT r.id, r.status, r.start_time, r.end_time, 
             u.full_name as user_name, s.name as station_name
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN stations s ON r.station_id = s.id
      ORDER BY r.id DESC
      LIMIT 10
    `);
    console.log(`\n📅 RESERVAS (últimas 10): ${reservations.rows.length}`);
    if (reservations.rows.length > 0) {
      reservations.rows.forEach(r => {
        const status = r.status === 'confirmed' ? '✅' : r.status === 'cancelled' ? '❌' : '⏳';
        console.log(`  ${r.id}. ${status} ${r.status.toUpperCase()}`);
        console.log(`     👤 ${r.user_name || 'N/A'} → 🔌 ${r.station_name || 'N/A'}`);
        if (r.start_time) console.log(`     📅 ${new Date(r.start_time).toLocaleString('pt-BR')}`);
      });
    } else {
      console.log('  (Nenhuma reserva cadastrada)');
    }
    
    // Carteiras
    const wallets = await query(`
      SELECT w.id, w.balance, u.full_name as owner
      FROM wallets w
      LEFT JOIN users u ON w.user_id = u.id
      ORDER BY w.id
    `);
    console.log(`\n💰 CARTEIRAS: ${wallets.rows.length}`);
    if (wallets.rows.length > 0) {
      wallets.rows.forEach(w => {
        console.log(`  ${w.id}. ${w.owner || 'N/A'}: R$ ${parseFloat(w.balance).toFixed(2)}`);
      });
    } else {
      console.log('  (Nenhuma carteira cadastrada)');
    }
    
    // Estatísticas gerais
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM stations) as total_stations,
        (SELECT COUNT(*) FROM vehicles) as total_vehicles,
        (SELECT COUNT(*) FROM reservations) as total_reservations,
        (SELECT COUNT(*) FROM reservations WHERE status = 'confirmed') as confirmed_reservations,
        (SELECT SUM(balance) FROM wallets) as total_balance
    `);
    
    console.log('\n' + '='.repeat(50));
    console.log('\n📈 ESTATÍSTICAS GERAIS:');
    console.log(`  👥 Total de usuários: ${stats.rows[0].total_users}`);
    console.log(`  🔌 Total de estações: ${stats.rows[0].total_stations}`);
    console.log(`  🚗 Total de veículos: ${stats.rows[0].total_vehicles}`);
    console.log(`  📅 Total de reservas: ${stats.rows[0].total_reservations}`);
    console.log(`  ✅ Reservas confirmadas: ${stats.rows[0].confirmed_reservations}`);
    console.log(`  💰 Saldo total nas carteiras: R$ ${parseFloat(stats.rows[0].total_balance || 0).toFixed(2)}`);
    console.log('\n' + '='.repeat(50) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao acessar banco de dados:', error.message);
    console.error('\nVerifique:');
    console.error('  1. Se o PostgreSQL está rodando');
    console.error('  2. Se o arquivo .env está configurado corretamente');
    console.error('  3. Se as migrações foram executadas (npm run migrate)');
    process.exit(1);
  }
}

viewDatabase();

