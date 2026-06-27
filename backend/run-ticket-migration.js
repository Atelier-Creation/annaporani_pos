import { sequelize } from './src/db/index.js';

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // Create tickets table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id VARCHAR(36) PRIMARY KEY,
        ticket_no VARCHAR(20) NOT NULL UNIQUE,
        ticket_type ENUM('bug','feature_request','ui_issue','performance','other') NOT NULL DEFAULT 'bug',
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status ENUM('open','assigned','in_progress','completed','approved','rejected') DEFAULT 'open',
        priority ENUM('low','medium','high','critical') DEFAULT 'medium',
        raised_by VARCHAR(36) NOT NULL,
        raised_by_name VARCHAR(100),
        raised_by_email VARCHAR(100),
        assigned_to VARCHAR(36),
        assigned_to_name VARCHAR(100),
        assigned_to_email VARCHAR(100),
        assigned_at DATETIME,
        attachments JSON,
        admin_notes TEXT,
        completion_note TEXT,
        resolved_at DATETIME,
        approved_at DATETIME,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ tickets table created');

    // Create developers table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS developers (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        skills VARCHAR(300),
        is_active TINYINT(1) DEFAULT 1,
        created_by VARCHAR(36),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ developers table created');

    console.log('\n✅ Ticket migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
