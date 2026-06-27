import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';
import AdPlatformConnection from './adPlatformConnection.models.js';

const Campaign = sequelize.define("Campaign", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    connection_id: {
        type: DataTypes.UUID,
        references: {
            model: AdPlatformConnection,
            key: 'id'
        },
        allowNull: false
    },
    platform_campaign_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING(50), // ACTIVE, PAUSED, ARCHIVED
        allowNull: true,
    },
    objective: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    budget_type: {
        type: DataTypes.STRING(50), // DAILY or LIFETIME
        allowNull: true,
    },
    budget_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    // Standard audit fields
    created_by: { type: DataTypes.UUID, allowNull: true },
    updated_by: { type: DataTypes.UUID, allowNull: true },
    deleted_by: { type: DataTypes.UUID, allowNull: true },
    created_by_name: { type: DataTypes.STRING, allowNull: true },
    updated_by_name: { type: DataTypes.STRING, allowNull: true },
    deleted_by_name: { type: DataTypes.STRING, allowNull: true },
}, {
    tableName: "campaigns",
    timestamps: true,
});

export default Campaign;
