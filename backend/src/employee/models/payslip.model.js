import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const Payslip = sequelize.define("Payslip", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  month: {
    type: DataTypes.INTEGER,   // 1-12
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Earnings
  basic_salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  hra: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'House Rent Allowance',
  },
  transport_allowance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  other_allowance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  bonus: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  gross_salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  // Deductions
  pf_deduction: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Provident Fund (12% of basic)',
  },
  esi_deduction: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Employee State Insurance',
  },
  tax_deduction: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'TDS / Income Tax',
  },
  other_deduction: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total_deductions: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  // Attendance
  working_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  present_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  leave_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  absent_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Net
  net_salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  advance_deduction: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Advance payment deducted in this payslip',
  },
  status: {
    type: DataTypes.ENUM('draft', 'generated', 'paid'),
    defaultValue: 'generated',
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  generated_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'payslips',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['employee_id', 'month', 'year'] },
  ],
});

export default Payslip;
