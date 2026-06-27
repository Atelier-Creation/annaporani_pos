// billingService.js
import api from "../../api/api.js";

// Function to get branch from localStorage
const getBranchId = () => {
  const branchId = localStorage.getItem("selectedBranchId");
  // Don't send branch_id if "all" is selected
  return branchId === "all" ? null : branchId;
};

const billingService = {
  async getAll(params = {}) {
    const branchId = getBranchId();
    const queryParams = { ...params };

    if (branchId) {
      queryParams.branch_id = branchId;
    }

    const res = await api.get("/billing/billing", { params: queryParams });
    return res.data;
  },

  async getById(id) {
    const branchId = getBranchId();
    const queryParams = {};

    if (branchId) {
      queryParams.branch_id = branchId;
    }

    const res = await api.get(`/billing/billing/${id}`, { params: queryParams });
    return res.data;
  },

  async get(id) {
    return this.getById(id);
  },

  async create(data) {
    const branchId = getBranchId();

    if (!branchId) {
      throw new Error("Please select a specific branch to create billing");
    }

    const res = await api.post("/billing/billing", { ...data, branch_id: branchId });
    return res.data;
  },

  async update(id, data) {
    const branchId = getBranchId();
    const payload = { ...data };

    if (branchId) {
      payload.branch_id = branchId;
    }

    const res = await api.put(`/billing/billing/${id}`, payload);
    return res.data;
  },

  async remove(id) {
    const branchId = getBranchId();
    const queryParams = {};

    if (branchId) {
      queryParams.branch_id = branchId;
    }

    const res = await api.delete(`/billing/billing/${id}`, { params: queryParams });
    return res.data;
  },
};

export default billingService;
