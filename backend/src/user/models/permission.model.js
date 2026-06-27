// models/permission.model.js
import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const Permission = sequelize.define(
    "Permission",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        code: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            comment: 'Permission code e.g. billing.view, user.create',
        },
        description: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Grouping label e.g. Billing, Users, Stock',
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        created_by: { type: DataTypes.UUID, allowNull: true },
        updated_by: { type: DataTypes.UUID, allowNull: true },
        deleted_by: { type: DataTypes.UUID, allowNull: true },
        created_by_name: { type: DataTypes.STRING, allowNull: true },
        updated_by_name: { type: DataTypes.STRING, allowNull: true },
        deleted_by_name: { type: DataTypes.STRING, allowNull: true },
        created_by_email: { type: DataTypes.STRING, allowNull: true },
        updated_by_email: { type: DataTypes.STRING, allowNull: true },
        deleted_by_email: { type: DataTypes.STRING, allowNull: true },
    },
    {
        tableName: "permissions",
        timestamps: true,
        deletedAt: 'deletedAt',
        paranoid: true,
    }
);

export default Permission;
