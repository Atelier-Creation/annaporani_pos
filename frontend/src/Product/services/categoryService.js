import api from "../../api/api";

const categoryService = {
  getAll: (params = {}) => api.get("/product/category", { params }),
  getById: (id) => api.get(`/product/category/${id}`),
  create: (data) => api.post("/product/category", data),
  update: (id, data) => api.put(`/product/category/${id}`, data),
  remove: (id) => api.delete(`/product/category/${id}`),
};

export default categoryService;
