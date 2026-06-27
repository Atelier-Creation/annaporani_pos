import { sequelize } from './src/db/index.js';
async function check() {
  await sequelize.authenticate();
  // Find most recent bills with any discount
  const [rows] = await sequelize.query(`
    SELECT billing_no, customer_name, subtotal_amount, discount_amount, total_amount, paid_amount, createdAt
    FROM billing 
    WHERE createdAt >= '2026-06-10 00:00:00'
    ORDER BY createdAt DESC LIMIT 5
  `);
  console.table(rows);
  await sequelize.close();
}
check().catch(e => { console.error(e.message); process.exit(1); });
