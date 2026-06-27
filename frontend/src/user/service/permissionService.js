import api from "../../api/api";

const permissionService = {
    // Permission CRUD
    createPermission: (data) => api.post("/user/permission", data),
    getPermissions: (params) => api.get("/user/permission", { params }),
    getAllPermissionsFlat: () => api.get("/user/permission/all"),
    getPermissionById: (id) => api.get(`/user/permission/${id}`),
    updatePermission: (id, data) => api.put(`/user/permission/${id}`, data),
    deletePermission: (id) => api.delete(`/user/permission/${id}`),
};

export default permissionService;
