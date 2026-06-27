import Coupon from '../models/coupon.model.js';
import CustomerPoints from '../models/customerpoints.model.js';
import PointsTransaction from '../models/pointstransaction.model.js';
import { Op } from 'sequelize';
import { sequelize } from '../../db/index.js';

const couponService = {
    // Generate coupon code
    generateCouponCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'REF';
        for (let i = 0; i < 7; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    // Check if customer qualifies for coupon (purchase >= 2000)
    async checkAndGenerateCoupon(billingAmount, customerPhone, billingId, options = {}) {
        if (billingAmount >= 2000) {
            const queryOptions = options.transaction ? { transaction: options.transaction } : {};
            // Generate unique coupon code
            let couponCode;
            let isUnique = false;
            
            while (!isUnique) {
                couponCode = this.generateCouponCode();
                const existing = await Coupon.findOne({ where: { coupon_code: couponCode }, ...queryOptions });
                if (!existing) isUnique = true;
            }

            // Valid from 24 hours after generation
            const validFrom = new Date();
            validFrom.setHours(validFrom.getHours() + 24);

            // Valid for 30 days after that
            const validUntil = new Date(validFrom);
            validUntil.setDate(validUntil.getDate() + 30);

            const coupon = await Coupon.create({
                coupon_code: couponCode,
                owner_customer_phone: customerPhone,
                discount_type: 'percentage',
                discount_value: 10.00, // 10% discount
                min_purchase_amount: 500.00, // Minimum ₹500 purchase
                max_discount_amount: 200.00, // Max ₹200 discount
                generated_from_billing: billingId,
                generated_at: new Date(),
                valid_from: validFrom,
                valid_until: validUntil,
            }, queryOptions);

            return coupon;
        }
        return null;
    },

    // Validate coupon for use
    async validateCoupon(couponCode, customerPhone, purchaseAmount, options = {}) {
        const queryOptions = options.transaction ? { transaction: options.transaction } : {};
        const coupon = await Coupon.findOne({
            where: { 
                coupon_code: couponCode,
                is_active: true,
                is_used: false
            },
            ...queryOptions
        });

        if (!coupon) {
            return { valid: false, message: 'Invalid or expired coupon code' };
        }

        // Check if trying to use own coupon
        if (coupon.owner_customer_phone === customerPhone) {
            return { valid: false, message: 'Cannot use your own referral coupon' };
        }

        // Check if coupon is valid yet (24 hours passed)
        const now = new Date();
        if (now < coupon.valid_from) {
            const hoursLeft = Math.ceil((coupon.valid_from - now) / (1000 * 60 * 60));
            return { 
                valid: false, 
                message: `Coupon will be valid in ${hoursLeft} hours` 
            };
        }

        // Check if coupon expired
        if (coupon.valid_until && now > coupon.valid_until) {
            return { valid: false, message: 'Coupon has expired' };
        }

        // Check minimum purchase amount
        if (purchaseAmount < coupon.min_purchase_amount) {
            return { 
                valid: false, 
                message: `Minimum purchase of ₹${coupon.min_purchase_amount} required` 
            };
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discount_type === 'percentage') {
            discountAmount = (purchaseAmount * coupon.discount_value) / 100;
            if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
                discountAmount = coupon.max_discount_amount;
            }
        } else {
            discountAmount = coupon.discount_value;
        }

        return {
            valid: true,
            coupon: coupon,
            discount_amount: parseFloat(discountAmount.toFixed(2)),
            message: 'Coupon applied successfully'
        };
    },

    // Apply coupon and give points to referrer
    async applyCoupon(couponCode, customerPhone, billingId, discountAmount, options = {}) {
        const run = async (t) => {
            const coupon = await Coupon.findOne({
                where: { coupon_code: couponCode },
                transaction: t
            });

            if (!coupon) {
                throw new Error('Coupon not found');
            }

            // Mark coupon as used
            await coupon.update({
                is_used: true,
                used_by_customer_phone: customerPhone,
                used_at: new Date(),
                used_in_billing: billingId
            }, { transaction: t });

            // Award points to referrer (owner of coupon)
            const pointsToAward = 50; // 50 points per successful referral
            
            let customerPoints = await CustomerPoints.findOne({
                where: { customer_phone: coupon.owner_customer_phone },
                transaction: t
            });

            if (!customerPoints) {
                customerPoints = await CustomerPoints.create({
                    customer_phone: coupon.owner_customer_phone,
                    total_points: pointsToAward,
                    points_earned: pointsToAward,
                    referral_count: 1
                }, { transaction: t });
            } else {
                await customerPoints.update({
                    total_points: customerPoints.total_points + pointsToAward,
                    points_earned: customerPoints.points_earned + pointsToAward,
                    referral_count: customerPoints.referral_count + 1
                }, { transaction: t });
            }

            // Record points transaction
            await PointsTransaction.create({
                customer_phone: coupon.owner_customer_phone,
                transaction_type: 'referral_bonus',
                points: pointsToAward,
                description: `Referral bonus from ${customerPhone}`,
                related_billing: billingId,
                related_coupon: coupon.id,
                referral_customer_phone: customerPhone
            }, { transaction: t });

            return {
                coupon,
                points_awarded: pointsToAward,
                referrer_phone: coupon.owner_customer_phone
            };
        };

        if (options.transaction) {
            return await run(options.transaction);
        }

        return await sequelize.transaction(run);
    },

    // Get customer's coupons
    async getCustomerCoupons(customerPhone) {
        return await Coupon.findAll({
            where: { 
                owner_customer_phone: customerPhone,
                is_active: true
            },
            order: [['createdAt', 'DESC']]
        });
    },

    // Get customer points
    async getCustomerPoints(customerPhone) {
        let points = await CustomerPoints.findOne({
            where: { customer_phone: customerPhone }
        });

        if (!points) {
            points = await CustomerPoints.create({
                customer_phone: customerPhone,
                total_points: 0,
                points_earned: 0,
                points_redeemed: 0,
                referral_count: 0
            });
        }

        // Get recent transactions
        const transactions = await PointsTransaction.findAll({
            where: { customer_phone: customerPhone },
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        return {
            points: points,
            recent_transactions: transactions
        };
    },

    // Get points history
    async getPointsHistory(customerPhone) {
        return await PointsTransaction.findAll({
            where: { customer_phone: customerPhone },
            order: [['createdAt', 'DESC']]
        });
    }
};

export default couponService;
