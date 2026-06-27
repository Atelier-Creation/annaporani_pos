import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const UserBranch = sequelize.define(
    "UserBranch",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        branch_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        role_id: {
            type: DataTypes.UUID,
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
    },
    {
        tableName: "user_branches",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'branch_id']
            }
        ]
    }
);

export default UserBranch;
