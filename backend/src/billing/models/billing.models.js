import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const Billing = sequelize.define("Billing", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  branch_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  billing_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  customer_name: { type: DataTypes.STRING(100), allowNull: true },
  type: {
    type: DataTypes.ENUM('Casier Billing','Customer Billing','other'),
    allowNull: false,
    defaultValue: 'Casier Billing',
  },
  counter_no: { type: DataTypes.ENUM('Counter 1','Counter 2','Counter 3','Counter 4','Counter 5'), allowNull: true, },
  customer_phone: { type: DataTypes.STRING(15), allowNull: false },
  billing_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  inward_id: { type: DataTypes.UUID, allowNull: true },
  total_quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  subtotal_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
  discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
  tax_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
  total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
  paid_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
  due_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
  payment_method: {
    type: DataTypes.ENUM('cash','credit_card','debit_card','UPI Current Account','UPI Normal Account','net_banking','split'),
    allowNull: false,
    defaultValue: 'cash',
  },
  payment_details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'For split payments: [{method: "cash", amount: 1000}, {method: "UPI", amount: 500}]'
  },
  status: {
    type: DataTypes.ENUM('pending','paid','partially_paid','cancelled'),
    allowNull: false,
  },
  notes: { type: DataTypes.TEXT, allowNull: true },
  source: { type: DataTypes.STRING(50), allowNull: true, comment: 'Customer acquisition source at time of billing' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: "billing",
  timestamps: true,
});

export default Billing;
