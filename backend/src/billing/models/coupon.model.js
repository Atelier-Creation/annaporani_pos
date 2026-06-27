import { sequelize } from '../../db/index.js';
import { DataTypes } from 'sequelize';

const Coupon = sequelize.define("Coupon", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    coupon_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    owner_customer_phone: {
        type: DataTypes.STRING(15),
        allowNull: false,
        comment: 'Customer who earned this coupon'
    },
    discount_type: {
        type: DataTypes.ENUM('percentage', 'fixed'),
        defaultValue: 'percentage',
    },
    discount_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Percentage or fixed amount'
    },
    min_purchase_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        comment: 'Minimum purchase required to use coupon'
    },
    max_discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Maximum discount cap for percentage type'
    },
    generated_from_billing: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Billing ID that generated this coupon'
    },
    generated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    valid_from: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Coupon valid after 24 hours'
    },
    valid_until: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Expiry date'
    },
    is_used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    used_by_customer_phone: {
        type: DataTypes.STRING(15),
        allowNull: true,
        comment: 'Referral customer who used this coupon'
    },
    used_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    used_in_billing: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Billing where coupon was used'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: "coupons",
    timestamps: true,
});

export default Coupon;
