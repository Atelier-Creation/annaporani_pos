import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const Developer = sequelize.define('Developer', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:     { type: DataTypes.STRING(100), allowNull: false },
  email:    { type: DataTypes.STRING(100), allowNull: false, unique: true },
  phone:    { type: DataTypes.STRING(20),  allowNull: true },
  password: { type: DataTypes.STRING(255), allowNull: true, comment: 'Set by super admin or on first login' },
  token:    { type: DataTypes.TEXT, allowNull: true },
  skills:   { type: DataTypes.STRING(300), allowNull: true },
  is_active:{ type: DataTypes.BOOLEAN, defaultValue: true },
  created_by: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'developers',
  timestamps: true,
});

export default Developer;
