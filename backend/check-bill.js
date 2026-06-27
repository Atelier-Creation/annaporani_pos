import { sequelize } from './src/db/index.js';
async function check() {
  await sequelize.authenticate();
  const [rows] = await sequelize.query(`
    SELECT billing_no, subtotal_amount, discount_amount, total_amount, paid_amount, due_amount 
    FROM billing WHERE customer_phone='9878902345' ORDER BY createdAt DESC LIMIT 3
  `);
  console.table(rows);
  await sequelize.close();
}
check().catch(e => { console.error(e.message); process.exit(1); });
