import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const Attendance = sequelize.define("Attendance", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  sign_in: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  sign_out: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  hours_worked: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'half_day', 'holiday', 'leave', 'late', 'permission'),
    defaultValue: 'present',
  },
  is_late: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  late_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Minutes late from shift start',
  },
  is_permission: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Employee took permission leave (short leave)',
  },
  permission_hours: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // ── Sign-in proof (selfie + location, auto-deleted after 3 days) ──────────
  selfie_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Relative path to selfie image, deleted after 3 days',
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  location_address: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Reverse-geocoded address string',
  },
  selfie_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Selfie file is deleted after this timestamp (3 days from sign-in)',
  },
}, {
  tableName: 'attendance',
  timestamps: true,
});

export default Attendance;
