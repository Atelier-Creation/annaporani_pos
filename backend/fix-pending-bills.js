import { sequelize } from './src/db/index.js';

async function fix() {
  await sequelize.authenticate();

  // Fix all paid bills that have due_amount > 0
  const [result] = await sequelize.query(`
    UPDATE billing
    SET paid_amount = total_amount, due_amount = 0
    WHERE due_amount > 0
      AND status = 'paid'
      AND is_active = 1
  `);

  console.log(`✅ Fixed ${result.affectedRows} bill(s) — due_amount set to 0`);
  await sequelize.close();
}
fix().catch(e => { console.error(e.message); process.exit(1); });
