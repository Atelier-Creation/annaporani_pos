import api from "../../api/api";

const ticketApi = {
  // Tickets
  create: (formData) => api.post("/tickets", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getAll: (params) => api.get("/tickets", { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  getStats: () => api.get("/tickets/stats"),
  assign: (id, data) => api.put(`/tickets/${id}/assign`, data),
  updateStatus: (id, data) => api.put(`/tickets/${id}/status`, data),

  // Developers (super admin only)
  getDevelopers: () => api.get("/developers"),
  addDeveloper: (data) => api.post("/developers", data),
  removeDeveloper: (id) => api.delete(`/developers/${id}`),
};

export default ticketApi;
