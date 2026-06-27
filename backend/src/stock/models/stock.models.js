import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';
import Product from '../../product/models/product.model.js'; 
import Branch from '../../user/models/branch.model.js'; 

const Stock = sequelize.define("Stock", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    branch_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    product_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    // Dress Shop Specific Fields
    size: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Size of the dress/garment in stock'
    },
    color: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Color of the dress/garment in stock'
    },
    warehouse_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Can be negative if sold before stock arrival'
    },
    unit: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'piece'
    },
    cost_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    selling_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    mrp: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Maximum Retail Price'
    },
    inward_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
    },
    return_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
    },
    billing_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
    },
    customer_billing_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
    },
    barcode: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Barcode for this specific size-color combination'
    },
    sku: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'SKU for this specific size-color combination'
    },
    supplier: { type: DataTypes.STRING(100), allowNull: true },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    tableName: "stock",
    timestamps: true,
});

// Define the foreign key relationships
Stock.belongsTo(Product, {
    foreignKey: "product_id",
    as: "product",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});

Stock.belongsTo(Branch, {
    foreignKey: "branch_id",
    as: "branch",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});

export default Stock;
