import { sequelize } from './src/db/index.js';

async function addColumn() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        
        await sequelize.query('ALTER TABLE customers ADD COLUMN source VARCHAR(50) NULL AFTER updated_by');
        console.log('Column "source" added to "customers" table.');
        
        process.exit(0);
    } catch (error) {
        console.error('Error adding column:', error.message);
        process.exit(1);
    }
}

addColumn();
