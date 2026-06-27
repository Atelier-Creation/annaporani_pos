import api from "../../api/api";

const customerService = {
  // Customer CRUD
  createCustomer: (data) => api.post("/billing/customers", data),
  getAllCustomers: (params) => api.get("/billing/customers", { params }),
  getCustomerById: (id) => api.get(`/billing/customers/${id}`),
  getCustomerByPhone: (phone) => api.get(`/billing/customers/phone/${phone}`),
  updateCustomer: (id, data) => api.put(`/billing/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/billing/customers/${id}`),
  bulkUploadCustomers: (customers) => api.post("/billing/customers/bulk", { customers }),
  
  // Customer analytics
  getCustomerHistory: (id) => api.get(`/billing/customers/${id}/history`),
  getCustomerAnalytics: (id) => api.get(`/billing/customers/${id}/analytics`),
  
  // Coupons
  validateCoupon: (data) => api.post("/billing/coupons/validate", data),
  getCustomerCoupons: (phone) => api.get(`/billing/coupons/customer/${phone}`),
  
  // Points
  getCustomerPoints: (phone) => api.get(`/billing/points/customer/${phone}`),
  getPointsHistory: (phone) => api.get(`/billing/points/customer/${phone}/history`),
};

export default customerService;
