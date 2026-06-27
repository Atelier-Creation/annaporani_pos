import couponService from '../service/coupon.service.js';

const couponController = {
    // Validate coupon
    async validateCoupon(req, res) {
        try {
            const { coupon_code, customer_phone, purchase_amount } = req.body;
            
            const validation = await couponService.validateCoupon(
                coupon_code,
                customer_phone,
                purchase_amount
            );

            res.status(200).json({
                success: validation.valid,
                message: validation.message,
                discount_amount: validation.discount_amount || 0,
                coupon: validation.coupon || null
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Get customer's coupons
    async getCustomerCoupons(req, res) {
        try {
            const { phone } = req.params;
            const coupons = await couponService.getCustomerCoupons(phone);
            
            res.status(200).json({
                success: true,
                data: coupons
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Get customer points
    async getCustomerPoints(req, res) {
        try {
            const { phone } = req.params;
            const pointsData = await couponService.getCustomerPoints(phone);
            
            res.status(200).json({
                success: true,
                data: pointsData
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Get points history
    async getPointsHistory(req, res) {
        try {
            const { phone } = req.params;
            const history = await couponService.getPointsHistory(phone);
            
            res.status(200).json({
                success: true,
                data: history
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

export default couponController;
