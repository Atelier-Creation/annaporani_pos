import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const CustomerPoints = sequelize.define("CustomerPoints", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    customer_phone: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
    },
    total_points: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Total loyalty points earned'
    },
    points_earned: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Lifetime points earned'
    },
    points_redeemed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Points used/redeemed'
    },
    referral_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of successful referrals'
    },
}, {
    tableName: "customer_points",
    timestamps: true,
});

export default CustomerPoints;
