import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const Leave = sequelize.define("Leave", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  leave_type: {
    type: DataTypes.ENUM('paid', 'unpaid', 'sick', 'casual', 'maternity', 'paternity'),
    allowNull: false,
    defaultValue: 'casual',
  },
  from_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  to_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  days: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false,
    defaultValue: 1,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
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
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'leaves',
  timestamps: true,
});

export default Leave;
