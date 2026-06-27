// reportService.js
import api from "../../api/api.js";

// Function to get branch from localStorage
const getBranchId = () => {
  const branchId = localStorage.getItem("selectedBranchId");
  // Don't send branch_id if "all" is selected
  return branchId === 'all' ? null : branchId;
};

const reportService = {
  /**
   * Get sales report
   * @param {Object} params - { period, startDate, endDate }
   * @returns {Promise} Sales report data
   */
  async getSalesReport(params = {}) {
    const branchId = getBranchId();
    const queryParams = { ...params };
    
    // Only add branch_id if it's not "all"
    if (branchId) {
      queryParams.branch_id = branchId;
    }
    
    const res = await api.get("/billing/reports/sales", { params: queryParams });
    return res.data;
  },

  /**
   * Get source-wise billing report
   * @param {Object} params - { period, startDate, endDate }
   * @returns {Promise} Source-wise report data
   */
  async getSourceWiseReport(params = {}) {
    const branchId = getBranchId();
    const queryParams = { ...params };
    
    // Only add branch_id if it's not "all"
    if (branchId) {
      queryParams.branch_id = branchId;
    }
    
    const res = await api.get("/billing/reports/source-wise", { params: queryParams });
    return res.data;
  }
};

export default reportService;
