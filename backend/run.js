import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import app from './src/index.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { sequelize } from './src/db/index.js';
import Role from './src/user/models/role.model.js';
import User from './src/user/models/user.model.js';
import Employee from './src/employee/models/employee.model.js';
import Attendance from './src/employee/models/attendance.model.js';
import Leave from './src/employee/models/leave.model.js';
import EmployeeDocument from './src/employee/models/document.model.js';
import Payslip from './src/employee/models/payslip.model.js';
import ShiftRule from './src/employee/models/shiftrule.model.js';
import LeavePolicy from './src/employee/models/leavepolicy.model.js';
import Advance from './src/employee/models/advance.model.js';
import './src/employee/models/associations.js';
const PORT = process.env.PORT || 10000;

// Listener
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    await sequelize.authenticate();
    console.log('Database is Connected');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.warn('Server started but DB is unreachable. Retrying queries will fail until DB is available.');
    return;
  }

  try {
    // Sync DB tables
    await sequelize.sync();
    console.log('Database synced successfully.');

    // ----- CREATE DEFAULT ROLE -----
    let superAdminRole = await Role.findOne({ where: { role_name: 'super admin' } });
    if (!superAdminRole) {
      console.log('No roles found. Creating default "super admin" role...');
      superAdminRole = await Role.create({
        id: crypto.randomUUID(),
        role_name: 'super admin',
        description: 'All access will have',
        is_active: 1,
      });
      console.log('"Super admin" role created successfully.');
    } else {
      console.log('Super admin role already exists.');
    }

    // ----- CREATE DEFAULT USER -----
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('No users found. Creating default "Atelier" user...');
      const hashedPassword = await bcrypt.hash('12345678', 10);
      await User.create({
        id: crypto.randomUUID(),
        role_id: superAdminRole.id,
        username: 'Atelier',
        email: 'atelier@gmail.com',
        password: hashedPassword,
        phone: '9876543210',
        is_active: 1,
      });
      console.log('Default user "Atelier" created successfully.');
    } else {
      console.log(`Users table already has ${userCount} record(s).`);
    }

    // ----- SEED DEFAULT LEAVE POLICIES -----
    const policyCount = await LeavePolicy.count();
    if (policyCount === 0) {
      console.log('Seeding default leave policies...');
      await LeavePolicy.bulkCreate([
        { leave_type: 'paid', label: 'Paid Leave', days_per_year: 12, carry_forward: true, max_carry_forward_days: 5, requires_approval: true, applicable_gender: 'all' },
        { leave_type: 'sick', label: 'Sick Leave', days_per_year: 6, carry_forward: false, max_carry_forward_days: 0, requires_approval: false, applicable_gender: 'all' },
        { leave_type: 'casual', label: 'Casual Leave', days_per_year: 6, carry_forward: false, max_carry_forward_days: 0, requires_approval: true, applicable_gender: 'all' },
        { leave_type: 'unpaid', label: 'Unpaid Leave', days_per_year: 0, carry_forward: false, max_carry_forward_days: 0, requires_approval: true, applicable_gender: 'all' },
        { leave_type: 'maternity', label: 'Maternity Leave', days_per_year: 90, carry_forward: false, max_carry_forward_days: 0, requires_approval: true, applicable_gender: 'female' },
        { leave_type: 'paternity', label: 'Paternity Leave', days_per_year: 5, carry_forward: false, max_carry_forward_days: 0, requires_approval: true, applicable_gender: 'male' },
      ]);
      console.log('Default leave policies seeded.');
    }

    console.log(`Server is running on port ${PORT}`);
  } catch (err) {
    console.error('Failed during DB sync/seed:', err);
  }
});