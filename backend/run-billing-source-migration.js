import { sequelize } from './src/db/index.js';

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    await sequelize.query(`
      ALTER TABLE billing
        ADD COLUMN source VARCHAR(50) NULL COMMENT 'Customer acquisition source at time of billing' AFTER notes
    `);

    console.log('✅ Migration complete — source column added to billing table.');
  } catch (err) {
    if (err.message.includes('Duplicate column name')) {
      console.log('ℹ️  Column already exists, skipping.');
    } else {
      console.error('❌ Migration failed:', err.message);
      process.exit(1);
    }
  } finally {
    await sequelize.close();
  }
}

migrate();
