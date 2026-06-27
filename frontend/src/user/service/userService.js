import api from "../../api/api";

const userService = {
  // User CRUD
  createUser: (data) => api.post("/user", data),
  getUsers: (params) => api.get("/user", { params }),
  getUserById: (id) => api.get(`/user/${id}`),
  updateUser: (id, data) => api.put(`/user/${id}`, data),
  deleteUser: (id) => api.delete(`/user/${id}`),
  restoreUser: (id) => api.patch(`/user/${id}/restore`),
  
  // Auth
  login: (data) => api.post("/user/login", data),
  logout: () => api.post("/user/logout"),
  getMe: () => api.get("/user/me"),
  getProfile: () => api.get("/user/me/profile"),
  changePassword: (data) => api.post("/user/change-password", data),
  sendOtp: (data) => api.post("/user/send-otp", data),
  checkUserExists: (params) => api.get("/user/exists", { params }),
  
  // Role CRUD
  createRole: (data) => api.post("/user/role", data),
  getRoles: () => api.get("/user/role"),
  getRoleById: (id) => api.get(`/user/role/${id}`),
  updateRole: (id, data) => api.put(`/user/role/${id}`, data),
  deleteRole: (id) => api.delete(`/user/role/${id}`),
  
  // Branch CRUD
  createBranch: (data) => api.post("/user/branches", data),
  getBranches: () => api.get("/user/branches"),
  getBranchById: (id) => api.get(`/user/branches/${id}`),
  updateBranch: (id, data) => api.put(`/user/branches/${id}`, data),
  deleteBranch: (id) => api.delete(`/user/branches/${id}`),
  
  // Branch-User assignments
  assignUserToBranch: (data) => api.post("/user/branches/assign-user", data),
  removeUserFromBranch: (data) => api.post("/user/branches/remove-user", data),
  updateUserBranchRole: (data) => api.put("/user/branches/update-user-role", data),
  getUserBranches: (userId) => api.get(`/user/users/${userId}/branches`),
  getMyBranches: () => api.get("/user/my-branches"),
  getBranchUsers: (branchId) => api.get(`/user/branches/${branchId}/users`),
};

export default userService;
