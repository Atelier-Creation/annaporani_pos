// models/rolepermission.model.js
import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const RolePermission = sequelize.define(
    "RolePermission",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        role_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        permission_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        tableName: "role_permissions",
        timestamps: true,
    }
);

export default RolePermission;
