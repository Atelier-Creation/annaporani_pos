import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const LeavePolicy = sequelize.define("LeavePolicy", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  leave_type: {
    type: DataTypes.ENUM('paid', 'unpaid', 'sick', 'casual', 'maternity', 'paternity'),
    allowNull: false,
    unique: true,
  },
  label: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Display name e.g. "Paid Leave"',
  },
  days_per_year: {
    type: DataTypes.DECIMAL(6, 1),
    allowNull: false,
    defaultValue: 0,
    comment: 'Total entitled days per year',
  },
  carry_forward: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether unused days carry forward to next year',
  },
  max_carry_forward_days: {
    type: DataTypes.DECIMAL(6, 1),
    defaultValue: 0,
  },
  max_consecutive_days: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Max days that can be taken at once (null = no limit)',
  },
  requires_approval: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  applicable_gender: {
    type: DataTypes.ENUM('all', 'male', 'female'),
    defaultValue: 'all',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'leave_policies',
  timestamps: true,
});

export default LeavePolicy;
