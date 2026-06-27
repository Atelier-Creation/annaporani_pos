import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const BillingItem = sequelize.define("BillingItem", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  billing_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  // Dress Shop Specific Fields
  size: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Size of the dress/garment sold'
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Color of the dress/garment sold'
  },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
  unit: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'piece' },
  mrp: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: true,
    comment: 'Maximum Retail Price'
  },
  discount_percentage: { 
    type: DataTypes.DECIMAL(5, 2), 
    allowNull: true, 
    defaultValue: 0.0,
    comment: 'Discount percentage applied'
  },
  total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
  discount: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0.0 },
  tax: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0.0 },
  barcode: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Barcode scanned during billing'
  },
}, {
  tableName: "billing_items",
  timestamps: true,
});

export default BillingItem;
