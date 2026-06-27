import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const AdPlatformConnection = sequelize.define("AdPlatformConnection", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    platform: {
        type: DataTypes.STRING(50),
        allowNull: false, // 'META' or 'GOOGLE'
    },
    platform_account_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    account_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    encrypted_access_token: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    encrypted_refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    token_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(50),
        defaultValue: 'ACTIVE', // ACTIVE, EXPIRED, REVOKED
    },
    // Standard audit fields
    created_by: { type: DataTypes.UUID, allowNull: true },
    updated_by: { type: DataTypes.UUID, allowNull: true },
    deleted_by: { type: DataTypes.UUID, allowNull: true },
    created_by_name: { type: DataTypes.STRING, allowNull: true },
    updated_by_name: { type: DataTypes.STRING, allowNull: true },
    deleted_by_name: { type: DataTypes.STRING, allowNull: true },
}, {
    tableName: "ad_platform_connections",
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['platform', 'platform_account_id']
        }
    ]
});

export default AdPlatformConnection;
