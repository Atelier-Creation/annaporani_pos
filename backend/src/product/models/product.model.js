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
    // Sweet/Snack Shop Specific Fields
    portion_size: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'e.g., 250g, 500g, 1kg, 1 cup, 1 piece'
    },
    dietary_preference: {
        type: DataTypes.ENUM('Veg', 'Non-Veg', 'Vegan', 'Eggless', 'Sugar-Free'),
        allowNull: true,
        defaultValue: 'Veg'
    },
    shelf_life: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'e.g., 2 days, 1 week, 1 month'
    },
    allergen_info: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'e.g., Contains Nuts, Dairy, Gluten'
    },
    temperature: {
        type: DataTypes.ENUM('Hot', 'Cold', 'Room Temperature'),
        allowNull: true,
        comment: 'e.g., Hot (for tea/coffee), Cold (for milkshakes), Room Temperature'
    },
    preparation_time: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'e.g., 10 mins, Instant'
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