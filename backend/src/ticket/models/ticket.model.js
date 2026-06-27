import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const Ticket = sequelize.define('Ticket', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  ticket_no: { type: DataTypes.STRING(20), allowNull: false, unique: true, comment: 'e.g. DBT-001' },
  ticket_type: {
    type: DataTypes.ENUM('bug', 'feature_request', 'ui_issue', 'performance', 'other'),
    allowNull: false,
    defaultValue: 'bug',
  },
  title:       { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM('open', 'assigned', 'in_progress', 'completed', 'approved', 'rejected'),
    defaultValue: 'open',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
  },
  // Who raised the ticket (FK to users — stored as plain UUID, no constraint)
  raised_by:       { type: DataTypes.UUID, allowNull: false },
  raised_by_name:  { type: DataTypes.STRING(100), allowNull: true },
  raised_by_email: { type: DataTypes.STRING(100), allowNull: true },
  // Assigned developer (FK to developers table — stored as plain UUID, no constraint)
  assigned_to:       { type: DataTypes.UUID, allowNull: true },
  assigned_to_name:  { type: DataTypes.STRING(100), allowNull: true },
  assigned_to_email: { type: DataTypes.STRING(100), allowNull: true },
  assigned_at:       { type: DataTypes.DATE, allowNull: true },
  // Attachments stored as JSON array of { url, type, name }
  attachments: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  // Super admin notes
  admin_notes:     { type: DataTypes.TEXT, allowNull: true },
  completion_note: { type: DataTypes.TEXT, allowNull: true },
  resolved_at:     { type: DataTypes.DATE, allowNull: true },
  approved_at:     { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'tickets',
  timestamps: true,
});

export default Ticket;
