import { sequelize } from "./src/db/index.js";
import User from "./src/user/models/user.model.js";
import Role from "./src/user/models/role.model.js";
import bcrypt from "bcrypt";

// Load associations
import "./src/user/models/associations.js";

async function createOrUpdateAdmin() {
    try {
        console.log("Connecting securely to database...");
        await sequelize.authenticate();

        // Find super_admin role
        const superAdminRole = await Role.findOne({ where: { role_name: "super_admin" } });

        if (!superAdminRole) {
            console.error("Super admin role not found! Run seed-permissions.js first.");
            process.exit(1);
        }

        const email = "admin@example.com";
        const password = "password123";
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user exists
        let user = await User.findOne({ where: { email } });

        if (user) {
            console.log(`User ${email} already exists. Updating password and role...`);
            await user.update({
                password: hashedPassword,
                role_id: superAdminRole.id,
                is_active: true
            });
            console.log("User updated successfully!");
        } else {
            console.log(`Creating new user ${email}...`);
            user = await User.create({
                username: "Super Admin",
                email: email,
                password: hashedPassword,
                phone: "1234567890",
                role_id: superAdminRole.id,
                is_active: true
            });
            console.log("User created successfully!");
        }

        console.log("\n✅ Admin Credentials:");
        console.log("------------------------");
        console.log(`Email / User ID: ${email}`);
        console.log(`Password:        ${password}`);
        console.log(`Role:            ${superAdminRole.role_name}`);
        console.log("------------------------\n");

        process.exit(0);
    } catch (error) {
        console.error("Error setting up admin:");
        console.error(error);
        process.exit(1);
    }
}

createOrUpdateAdmin();
