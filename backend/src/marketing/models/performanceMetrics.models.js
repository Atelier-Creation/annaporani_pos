import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';
import AdPlatformConnection from './adPlatformConnection.models.js';
import Campaign from './campaign.models.js';

const PerformanceMetric = sequelize.define("PerformanceMetric", {
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
    campaign_id: {
        type: DataTypes.UUID,
        references: {
            model: Campaign,
            key: 'id'
        },
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    impressions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    clicks: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    spend: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
    },
    conversions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    revenue: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
    },
}, {
    tableName: "performance_metrics",
    timestamps: true,
});

export default PerformanceMetric;
