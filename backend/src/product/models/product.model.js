import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const Product = sequelize.define("Product", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    product_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    product_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    category_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    sub_category_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    brand: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    // Dress Shop Specific Fields
    size: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'e.g., XS, S, M, L, XL, XXL, or numeric sizes'
    },
    color: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Dress color'
    },
    material: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'e.g., Cotton, Silk, Polyester, Chiffon'
    },
    style: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'e.g., Casual, Formal, Party Wear, Traditional'
    },
    pattern: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'e.g., Solid, Printed, Embroidered, Striped'
    },
    sleeve_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'e.g., Full Sleeve, Half Sleeve, Sleeveless'
    },
    length: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'e.g., Mini, Midi, Maxi, Knee Length'
    },
    occasion: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'e.g., Wedding, Party, Casual, Office Wear'
    },
    season: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'e.g., Summer, Winter, All Season'
    },
    gender: {
        type: DataTypes.ENUM('Women', 'Men', 'Girls', 'Boys', 'Unisex'),
        allowNull: true,
        defaultValue: 'Women'
    },
    unit: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'piece'
    },
    purchase_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
    },
    selling_price: {    
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
    },
    mrp: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Maximum Retail Price'
    },
    discount_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    care_instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Washing and care instructions'
    },
    tax_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00,
    },
    barcode: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        comment: 'Product barcode for scanning'
    },
    sku: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        comment: 'Stock Keeping Unit'
    },
    image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Product image URL'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'out_of_stock'),
        defaultValue: 'active',
        allowNull: false,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    created_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  deleted_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  created_by_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  updated_by_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  deleted_by_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_by_email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  updated_by_email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  deleted_by_email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
},

  {
    tableName: "products",
    timestamps: true,
  });


export default Product;