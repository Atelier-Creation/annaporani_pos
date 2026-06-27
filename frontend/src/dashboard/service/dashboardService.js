import api from "../../api/api";

// Function to get branch from localStorage
const getBranchId = () => {
  const branchId = localStorage.getItem("selectedBranchId");
  return branchId === 'all' ? null : branchId;
};

const dashboardService = {
  /**
   * Get comprehensive dashboard data
   * @param {String} period - 'today' | 'week' | 'month' | 'year'
   * @returns {Promise} Dashboard data
   */
  getDashboardData: async (period = 'today') => {
    const branchId = getBranchId();
    const params = { period };
    
    if (branchId) {
      params.branch_id = branchId;
    }
    
    const response = await api.get("/dashboard/data", { params });
    return response.data;
  },

  // Legacy endpoints (kept for backward compatibility)
  getSummary: () => api.get("/dashboard/summary"),
  getRecentBills: () => api.get("/dashboard/recent-bills"),
  getRevenueByDate: () => api.get("/dashboard/revenue"),
};

export default dashboardService;
