import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const ShiftRule = sequelize.define("ShiftRule", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'e.g. "General Shift", "Morning Shift"',
  },
  // Shift timing
  shift_start: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: 'Expected sign-in time e.g. 09:00:00',
  },
  shift_end: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: 'Expected sign-out time e.g. 18:00:00',
  },
  shift_hours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 8,
    comment: 'Total expected working hours',
  },
  // Work week
  work_days_per_week: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    comment: '5 = Mon-Fri, 6 = Mon-Sat',
  },
  working_days: {
    type: DataTypes.JSON,
    defaultValue: [1, 2, 3, 4, 5],
    comment: 'Array of day numbers: 0=Sun,1=Mon,...,6=Sat',
  },
  // Grace period
  grace_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: 'Minutes allowed late before marking late',
  },
  // Late rules
  late_mark_after_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: 'After this many minutes late, mark as late arrival',
  },
  half_day_after_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 120,
    comment: 'After this many minutes late, mark as half day',
  },
  absent_after_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 240,
    comment: 'After this many minutes late, mark as absent',
  },
  // Permission / short leave
  permission_allowed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether permission leave is allowed',
  },
  permission_max_hours: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 2,
    comment: 'Max hours allowed for permission leave per day',
  },
  permission_per_month: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
    comment: 'Max number of permission leaves per month',
  },
  // Minimum hours for full day
  min_hours_full_day: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 7,
    comment: 'Minimum hours to count as full day present',
  },
  min_hours_half_day: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 4,
    comment: 'Minimum hours to count as half day',
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Default shift applied to all employees without specific shift',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'shift_rules',
  timestamps: true,
});

export default ShiftRule;
