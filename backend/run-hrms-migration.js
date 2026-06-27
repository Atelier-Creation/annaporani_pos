import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from './src/db/index.js';

const migrate = async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const q = sequelize.getQueryInterface();

    // ── attendance new columns ────────────────────────────────────────────────
    const attCols = await q.describeTable('attendance');

    if (!attCols.is_late) {
      await q.addColumn('attendance', 'is_late', { type: 'TINYINT(1)', defaultValue: 0 });
      console.log('Added attendance.is_late');
    }
    if (!attCols.late_minutes) {
      await q.addColumn('attendance', 'late_minutes', { type: 'INT', defaultValue: 0 });
      console.log('Added attendance.late_minutes');
    }
    if (!attCols.is_permission) {
      await q.addColumn('attendance', 'is_permission', { type: 'TINYINT(1)', defaultValue: 0 });
      console.log('Added attendance.is_permission');
    }
    if (!attCols.permission_hours) {
      await q.addColumn('attendance', 'permission_hours', { type: 'DECIMAL(4,2)', defaultValue: 0 });
      console.log('Added attendance.permission_hours');
    }

    // Update attendance status ENUM
    await sequelize.query(`
      ALTER TABLE \`attendance\`
      MODIFY COLUMN \`status\`
      ENUM('present','absent','half_day','holiday','leave','late','permission')
      DEFAULT 'present'
    `);
    console.log('Updated attendance.status ENUM');

    // ── payslips new columns ──────────────────────────────────────────────────
    const payslipCols = await q.describeTable('payslips').catch(() => null);
    if (payslipCols && !payslipCols.advance_deduction) {
      await q.addColumn('payslips', 'advance_deduction', { type: 'DECIMAL(10,2)', defaultValue: 0 });
      console.log('Added payslips.advance_deduction');
    }

    // ── create new tables ─────────────────────────────────────────────────────
    // Import models so sequelize knows about them
    await import('./src/employee/models/associations.js');
    await import('./src/employee/models/shiftrule.model.js');
    await import('./src/employee/models/leavepolicy.model.js');
    await import('./src/employee/models/advance.model.js');

    const ShiftRule    = (await import('./src/employee/models/shiftrule.model.js')).default;
    const LeavePolicy  = (await import('./src/employee/models/leavepolicy.model.js')).default;
    const Advance      = (await import('./src/employee/models/advance.model.js')).default;

    await ShiftRule.sync();
    console.log('shift_rules table ready');

    await LeavePolicy.sync();
    console.log('leave_policies table ready');

    await Advance.sync();
    console.log('employee_advances table ready');

    // Seed default leave policies if empty
    const count = await LeavePolicy.count();
    if (count === 0) {
      await LeavePolicy.bulkCreate([
        { leave_type: 'paid',      label: 'Paid Leave',      days_per_year: 12, carry_forward: true,  max_carry_forward_days: 5,  requires_approval: true,  applicable_gender: 'all' },
        { leave_type: 'sick',      label: 'Sick Leave',      days_per_year: 6,  carry_forward: false, max_carry_forward_days: 0,  requires_approval: false, applicable_gender: 'all' },
        { leave_type: 'casual',    label: 'Casual Leave',    days_per_year: 6,  carry_forward: false, max_carry_forward_days: 0,  requires_approval: true,  applicable_gender: 'all' },
        { leave_type: 'unpaid',    label: 'Unpaid Leave',    days_per_year: 0,  carry_forward: false, max_carry_forward_days: 0,  requires_approval: true,  applicable_gender: 'all' },
        { leave_type: 'maternity', label: 'Maternity Leave', days_per_year: 90, carry_forward: false, max_carry_forward_days: 0,  requires_approval: true,  applicable_gender: 'female' },
        { leave_type: 'paternity', label: 'Paternity Leave', days_per_year: 5,  carry_forward: false, max_carry_forward_days: 0,  requires_approval: true,  applicable_gender: 'male' },
      ]);
      console.log('Default leave policies seeded');
    }

    console.log('\nMigration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
};

migrate();
