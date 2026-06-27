import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';
import Inward from '../models/inward.model.js';
import Product from '../../product/models/product.model.js'; // ✅ import product model

const InwardItem = sequelize.define(
  "InwardItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    inward_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "inward", // ✅ must match Inward.tableName
        key: "id",
      },
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "products", 
        key: "id",
      },
    },
    // Dress Shop Specific Fields
    size: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Size of the dress/garment received'
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Color of the dress/garment received'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'piece'
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    batch_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Barcode for this specific item'
    },
  },
  {
    tableName: "inward_items",
    timestamps: true,
  }
);

// ✅ Associations
Inward.hasMany(InwardItem, { foreignKey: "inward_id", as: "items" });
InwardItem.belongsTo(Inward, { foreignKey: "inward_id", as: "inward" });

Product.hasMany(InwardItem, { foreignKey: "product_id", as: "inwardItems" });
InwardItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

export default InwardItem;
