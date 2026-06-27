import { sequelize } from './src/db/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running migration: allow_null_category_id.sql');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'allow_null_category_id.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.toLowerCase() !== 'describe products');
    
    // Execute each statement
    for (const statement of statements) {
      if (statement) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await sequelize.query(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ category_id column now allows NULL values');
    
    // Verify the change
    const [results] = await sequelize.query('DESCRIBE products');
    const categoryField = results.find(r => r.Field === 'category_id');
    console.log('\n📋 category_id column info:');
    console.log(categoryField);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
