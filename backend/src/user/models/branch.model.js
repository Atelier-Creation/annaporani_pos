import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const Branch = sequelize.define(
    "Branch",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        branch_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        branch_code: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
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
        phone: {
            type: DataTypes.STRING(15),
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
    },
    {
        tableName: "branches",
        timestamps: true,
        paranoid: true,
    }
);

export default Branch;
