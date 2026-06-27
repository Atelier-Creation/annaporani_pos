import api from "../../api/api";

const subcategoryService = {
  getAll: (params = {}) => api.get("/product/subcategory", { params }),
  getByCategory: (categoryId) => api.get(`/product/subcategory?category_id=${categoryId}`),
  getById: (id) => api.get(`/product/subcategory/${id}`),
  create: (data) => api.post("/product/subcategory", data),
  update: (id, data) => api.put(`/product/subcategory/${id}`, data),
  remove: (id) => api.delete(`/product/subcategory/${id}`),
};

export default subcategoryService;
