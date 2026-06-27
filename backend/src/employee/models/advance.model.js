import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const Advance = sequelize.define("Advance", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  requested_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid', 'deducted'),
    defaultValue: 'pending',
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paid_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  deduct_month: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Month (1-12) in which to deduct from payslip',
  },
  deduct_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  deducted_in_payslip_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Payslip ID where this was deducted',
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'employee_advances',
  timestamps: true,
});

export default Advance;
