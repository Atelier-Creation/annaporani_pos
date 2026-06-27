import { sequelize } from './src/db/index.js';

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    await sequelize.query(`
      ALTER TABLE attendance
        ADD COLUMN selfie_url VARCHAR(500) NULL COMMENT 'Relative path to selfie image, deleted after 3 days' AFTER notes,
        ADD COLUMN latitude DECIMAL(10,7) NULL AFTER selfie_url,
        ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude,
        ADD COLUMN location_address VARCHAR(500) NULL COMMENT 'Reverse-geocoded address string' AFTER longitude,
        ADD COLUMN selfie_expires_at DATETIME NULL COMMENT 'Selfie file deleted after this timestamp (3 days from sign-in)' AFTER location_address
    `);

    console.log('✅ Migration complete — selfie_url, latitude, longitude, location_address, selfie_expires_at added to attendance table.');
  } catch (err) {
    if (err.message.includes('Duplicate column name')) {
      console.log('ℹ️  Columns already exist, skipping migration.');
    } else {
      console.error('❌ Migration failed:', err.message);
      process.exit(1);
    }
  } finally {
    await sequelize.close();
  }
}

migrate();
