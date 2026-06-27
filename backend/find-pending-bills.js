import { sequelize } from './src/db/index.js';

async function find() {
  await sequelize.authenticate();
  const [rows] = await sequelize.query(`
    SELECT billing_no, customer_name, total_amount, paid_amount, due_amount, status, payment_method, billing_date
    FROM billing
    WHERE due_amount > 0
      AND status IN ('paid','partially_paid')
      AND is_active = 1
    ORDER BY billing_date DESC
    LIMIT 20
  `);
  console.table(rows);
  await sequelize.close();
}
find().catch(e => { console.error(e.message); process.exit(1); });
