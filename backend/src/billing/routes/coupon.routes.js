import express from 'express';
import couponController from '../controller/coupon.controller.js';
import { verifyToken } from '../../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Coupon validation
router.post('/coupons/validate', couponController.validateCoupon);

// Get customer's coupons
router.get('/coupons/customer/:phone', couponController.getCustomerCoupons);

// Get customer points
router.get('/points/customer/:phone', couponController.getCustomerPoints);

// Get points history
router.get('/points/customer/:phone/history', couponController.getPointsHistory);

export default router;
