// inwardService.js
import api from "../../api/api.js";

// Function to get branch from localStorage
const getBranchId = () => {
  const branchId = localStorage.getItem("selectedBranchId");
  // Don't send branch_id if "all" is selected
  return branchId === 'all' ? null : branchId;
};

const inwardService = {
  // 🔹 Get all inwards (with optional filters + pagination)
  async getAll(params = {}) {
    const branchId = getBranchId();
    const queryParams = { ...params };
    
    // Only add branch_id if it's not "all"
    if (branchId) {
      queryParams.branch_id = branchId;
    }
    
    const res = await api.get("/inward/inward", { params: queryParams });
    return res.data;
  },

  // 🔹 Get single inward by ID (with items)
  async getById(id) {
    const branchId = getBranchId();
    const queryParams = {};
    
    if (branchId) {
      queryParams.branch_id = branchId;
    }
    
    const res = await api.get(`/inward/inward/${id}`, { params: queryParams });
    return res.data;
  },

  // 🔹 Create new inward with items
  async create(data) {
    const branchId = getBranchId();
    
    // For create, we need a specific branch - if "all" is selected, user must choose
    if (!branchId) {
      throw new Error("Please select a specific branch to create inward");
    }
    
    const res = await api.post("/inward/inward", { ...data, branch_id: branchId });
    return res.data;
  },

  // 🔹 Update inward (requires manager/admin role)
  async update(id, data) {
    const branchId = getBranchId();
    const payload = { ...data };
    
    if (branchId) {
      payload.branch_id = branchId;
    }
    
    const res = await api.put(`/inward/inward/${id}`, payload);
    return res.data;
  },

  // 🔹 Delete inward (requires admin role)
  async remove(id) {
    const branchId = getBranchId();
    const queryParams = {};
    
    if (branchId) {
      queryParams.branch_id = branchId;
    }
    
    const res = await api.delete(`/inward/inward/${id}`, { params: queryParams });
    return res.data;
  },
};

export default inwardService;
