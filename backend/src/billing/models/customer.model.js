import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const Customer = sequelize.define("Customer", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    customer_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    customer_phone: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
    },
    customer_email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: { isEmail: true },
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    city: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    state: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    pincode: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: true,
    },
    date_of_birth: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    anniversary_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
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
    source: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
}, {
    tableName: "customers",
    timestamps: true,
    paranoid: true,
});

export default Customer;
