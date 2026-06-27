// services/stockService.js
import api from "../../api/api.js";

// Function to get branch from localStorage
const getBranchId = () => {
  const branchId = localStorage.getItem("selectedBranchId");
  // Don't send branch_id if "all" is selected
  return branchId === 'all' ? null : branchId;
};

const stockService = {
  // ✅ Get all stock records with optional filters
  async getAll(params = {}) {
    const branchId = getBranchId();
    const queryParams = { ...params };
    
    // Only add branch_id if it's not "all"
    if (branchId) {
      queryParams.branch_id = branchId;
    }
    
    const res = await api.get("/stock/stock", { params: queryParams });
    return res.data;
  },

  // ✅ Get stock by ID
  async getById(id) {
    const branchId = getBranchId();
    const queryParams = {};
    
    if (branchId) {
      queryParams.branch_id = branchId;
    }
    
    const res = await api.get(`/stock/stock/${id}`, { params: queryParams });
    return res.data;
  },

  // ✅ Add single stock
  async create(data) {
    const branchId = getBranchId();
    
    // For create, we need a specific branch
    if (!branchId) {
      throw new Error("Please select a specific branch to add stock");
    }
    
    const res = await api.post("/stock/stock", { ...data, branch_id: branchId });
    return res.data;
  },

  // ✅ Bulk add stock
  async createBulk(dataArray) {
    const branchId = getBranchId();
    
    // For bulk create, we need a specific branch
    if (!branchId) {
      throw new Error("Please select a specific branch to add stock");
    }
    
    const dataWithBranch = dataArray.map(item => ({ ...item, branch_id: branchId }));
    const res = await api.post("/stock/stockbulk", dataWithBranch);
    return res.data;
  },

  // ✅ Update stock by ID (requires manager/admin role)
  async update(id, data) {
    const branchId = getBranchId();
    const payload = { ...data };
    
    if (branchId) {
      payload.branch_id = branchId;
    }
    
    const res = await api.put(`/stock/stock/${id}`, payload);
    return res.data;
  },

  // ✅ Delete stock by ID (requires admin role)
  async remove(id) {
    const branchId = getBranchId();
    const queryParams = {};
    
    if (branchId) {
      queryParams.branch_id = branchId;
    }
    
    const res = await api.delete(`/stock/stock/${id}`, { params: queryParams });
    return res.data;
  },
};

export default stockService;
