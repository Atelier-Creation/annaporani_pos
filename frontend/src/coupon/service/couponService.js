import api from "../../api/api";

const couponService = {
  // Coupon validation
  validateCoupon: (data) => api.post("/billing/coupons/validate", data),
  
  // Get customer's coupons
  getCustomerCoupons: (phone) => api.get(`/billing/coupons/customer/${phone}`),
  
  // Get customer points
  getCustomerPoints: (phone) => api.get(`/billing/points/customer/${phone}`),
  
  // Get points history
  getPointsHistory: (phone) => api.get(`/billing/points/customer/${phone}/history`),
};

export default couponService;
