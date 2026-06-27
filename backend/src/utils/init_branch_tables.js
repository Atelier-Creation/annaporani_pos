import { sequelize } from '../db/index.js';
import { User, Role, Branch, UserBranch } from '../user/models/associations.js';

/**
 * Initialize branch-related tables
 * Run this once to create the tables in your database
 */
async function initBranchTables() {
    try {
        console.log('🔄 Initializing branch tables...');

        // Sync models (creates tables if they don't exist)
        await Branch.sync({ alter: true });
        console.log('✅ Branch table created/updated');

        await UserBranch.sync({ alter: true });
        console.log('✅ UserBranch table created/updated');

        console.log('✅ Branch tables initialized successfully!');
        
        return true;
    } catch (error) {
        console.error('❌ Error initializing branch tables:', error);
        throw error;
    }
}

/**
 * Create sample branches for testing
 */
async function createSampleBranches() {
    try {
        console.log('🔄 Creating sample branches...');

        const branches = [
            {
                branch_name: 'Main Branch',
                branch_code: 'MAIN001',
                address: '123 Main Street',
                city: 'New York',
                state: 'NY',
                phone: '555-0100'
            },
            {
                branch_name: 'Downtown Branch',
                branch_code: 'DT001',
                address: '456 Downtown Ave',
                city: 'New York',
                state: 'NY',
                phone: '555-0200'
            },
            {
                branch_name: 'Uptown Branch',
                branch_code: 'UT001',
                address: '789 Uptown Blvd',
                city: 'New York',
                state: 'NY',
                phone: '555-0300'
            }
        ];

        for (const branchData of branches) {
            const existing = await Branch.findOne({ 
                where: { branch_code: branchData.branch_code } 
            });

            if (!existing) {
                await Branch.create(branchData);
                console.log(`✅ Created branch: ${branchData.branch_name}`);
            } else {
                console.log(`⏭️  Branch already exists: ${branchData.branch_name}`);
            }
        }

        console.log('✅ Sample branches created successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error creating sample branches:', error);
        throw error;
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    (async () => {
        try {
            await initBranchTables();
            
            // Optionally create sample data
            const createSamples = process.argv.includes('--samples');
            if (createSamples) {
                await createSampleBranches();
            }

            console.log('✅ All done!');
            process.exit(0);
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            process.exit(1);
        }
    })();
}

export { initBranchTables, createSampleBranches };
