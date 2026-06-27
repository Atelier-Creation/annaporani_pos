import { sequelize } from "./src/db/index.js";
import Role from "./src/user/models/role.model.js";
import Permission from "./src/user/models/permission.model.js";

// First, make sure the models know about the associations
import "./src/user/models/associations.js";

const permissionsToSeed = [
    // --- User & Role Management ---
    { code: "user.view", category: "Users", description: "View user list and details" },
    { code: "user.create", category: "Users", description: "Create new users" },
    { code: "user.edit", category: "Users", description: "Edit existing users" },
    { code: "user.delete", category: "Users", description: "Delete users" },
    { code: "role.view", category: "Roles", description: "View roles and permissions" },
    { code: "role.create", category: "Roles", description: "Create new roles" },
    { code: "role.edit", category: "Roles", description: "Edit roles and assign permissions" },
    { code: "role.delete", category: "Roles", description: "Delete roles" },
    { code: "permission.view", category: "Roles", description: "View permissions" },
    { code: "permission.create", category: "Roles", description: "Create new permissions" },
    { code: "permission.edit", category: "Roles", description: "Edit permissions" },
    { code: "permission.delete", category: "Roles", description: "Delete permissions" },

    // --- Branch Management ---
    { code: "branch.view", category: "Branches", description: "View branches" },
    { code: "branch.create", category: "Branches", description: "Create new branches" },
    { code: "branch.edit", category: "Branches", description: "Edit branches" },
    { code: "branch.delete", category: "Branches", description: "Delete branches" },

    // --- Products ---
    { code: "product.view", category: "Products", description: "View products" },
    { code: "product.create", category: "Products", description: "Create products" },
    { code: "product.edit", category: "Products", description: "Edit products" },
    { code: "product.delete", category: "Products", description: "Delete products" },

    // --- Billing ---
    { code: "billing.view", category: "Billing", description: "View billing records" },
    { code: "billing.create", category: "Billing", description: "Create new bills" },
    { code: "billing.edit", category: "Billing", description: "Edit bills" },
    { code: "billing.delete", category: "Billing", description: "Delete bills" },

    // --- Stock & Inward ---
    { code: "stock.view", category: "Stock", description: "View stock levels" },
    { code: "stock.manage", category: "Stock", description: "Manage stock adjustments" },
    { code: "inward.view", category: "Inward", description: "View inward records" },
    { code: "inward.create", category: "Inward", description: "Create inward records" },

    // --- Dashboard & Reports ---
    { code: "dashboard.view", category: "Dashboard", description: "View dashboard and stats" },
    { code: "reports.view", category: "Reports", description: "View system reports" },

    // --- Marketing ---
    { code: "marketing.view", category: "Marketing", description: "View marketing campaigns" },
    { code: "marketing.manage", category: "Marketing", description: "Manage marketing tools" },
];

async function seed() {
    try {
        console.log("Connecting securely to database...");
        await sequelize.authenticate();
        console.log("Connection has been established successfully.");

        // Sync missing tables if they don't exist yet (Permissions and RolePermissions)
        await sequelize.sync({ alter: true });
        console.log("Database models synchronized.");

        // 1. Create/Find all Permissions
        console.log(`\nSeeding ${permissionsToSeed.length} permissions...`);
        const allPermissions = [];
        for (const p of permissionsToSeed) {
            const [permission] = await Permission.findOrCreate({
                where: { code: p.code },
                defaults: p
            });
            allPermissions.push(permission);
        }
        console.log("Permissions seeded successfully.");

        // 2. Map default roles ensuring they exist
        const superAdminRoleName = "super_admin";
        const adminRoleName = "admin";

        console.log(`\nEnsuring '${superAdminRoleName}' and '${adminRoleName}' roles exist...`);

        const [superAdminRole] = await Role.findOrCreate({
            where: { role_name: superAdminRoleName },
            defaults: { description: "Full system access (Bypasses checks automatically)" }
        });

        const [adminRole] = await Role.findOrCreate({
            where: { role_name: adminRoleName },
            defaults: { description: "Administrator with comprehensive access" }
        });

        // 3. Assign all permissions to BOTH Super Admin and Admin explicitly
        console.log("\nAssigning all permissions to Super Admin and Admin roles...");
        await superAdminRole.setPermissions(allPermissions);
        await adminRole.setPermissions(allPermissions);

        console.log(`\n✅ Successfully assigned all ${allPermissions.length} permissions to:`);
        console.log(`1. ${superAdminRole.role_name} (ID: ${superAdminRole.id})`);
        console.log(`2. ${adminRole.role_name} (ID: ${adminRole.id})`);

        console.log("\nDone!");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error during seeding:");
        console.error(error);
        process.exit(1);
    }
}

seed();
