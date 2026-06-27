import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const PointsTransaction = sequelize.define("PointsTransaction", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    customer_phone: {
        type: DataTypes.STRING(15),
        allowNull: false,
    },
    transaction_type: {
        type: DataTypes.ENUM('earned', 'redeemed', 'expired', 'referral_bonus'),
        allowNull: false,
    },
    points: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    related_billing: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    related_coupon: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    referral_customer_phone: {
        type: DataTypes.STRING(15),
        allowNull: true,
        comment: 'Phone of customer who was referred'
    },
}, {
    tableName: "points_transactions",
    timestamps: true,
});

export default PointsTransaction;
