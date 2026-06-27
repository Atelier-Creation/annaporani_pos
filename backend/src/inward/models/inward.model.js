import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const Inward = sequelize.define("Inward", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    branch_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    inward_no: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true, // Global unique - each inward gets unique number across all branches
    },
    supplier_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    received_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    supplier_invoice: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    total_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
        defaultValue: 'pending',
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
    tableName: "inward",
    timestamps: true,
  });


export default Inward;
