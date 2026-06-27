import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const EmployeeDocument = sequelize.define("EmployeeDocument", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  document_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  document_type: {
    type: DataTypes.ENUM('id_proof', 'address_proof', 'education', 'experience', 'other'),
    defaultValue: 'other',
  },
  file_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  uploaded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'employee_documents',
  timestamps: true,
});

export default EmployeeDocument;
