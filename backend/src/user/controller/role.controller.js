// controllers/role.controller.js
import roleService from "../service/role.service.js";
import { createRoleSchema, updateRoleSchema } from "../dto/role.dto.js";

const roleController = {
  // ✅ Create Role
  async create(req, res) {
    try {
      const { permission_ids = [], ...rest } = req.body;
      const validatedData = createRoleSchema.parse(rest);

      const existing = await roleService.findByName(validatedData.role_name);
      if (existing) {
        return res.status(400).json({ error: "Role name already exists" });
      }

      // Audit fields from token
      if (req.user) {
        validatedData.created_by = req.user.id;
        validatedData.created_by_name = req.user.username;
        validatedData.created_by_email = req.user.email;
      }

      const role = await roleService.createRole(validatedData, permission_ids);
      return res.status(201).json({ success: true, data: role });
    } catch (err) {
      return res.status(400).json({ error: err.errors || err.message });
    }
  },

  // ✅ Get All Roles
  async getAll(req, res) {
    try {
      const roles = await roleService.getAllRoles();
      return res.json({ success: true, data: roles });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ Get Role by ID
  async getById(req, res) {
    try {
      const role = await roleService.getRoleById(req.params.id);
      return res.json({ success: true, data: role });
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  },

  // ✅ Update Role
  async update(req, res) {
    try {
      const { permission_ids = [], ...rest } = req.body;
      const validatedData = updateRoleSchema.parse(rest);

      if (validatedData.role_name) {
        const existing = await roleService.findByName(validatedData.role_name);
        if (existing && existing.id !== req.params.id) {
          return res.status(400).json({ error: "Role name already exists" });
        }
      }

      // Audit fields
      if (req.user) {
        validatedData.updated_by = req.user.id;
        validatedData.updated_by_name = req.user.username;
        validatedData.updated_by_email = req.user.email;
      }

      const role = await roleService.updateRole(req.params.id, validatedData, permission_ids);
      return res.json({ success: true, data: role });
    } catch (err) {
      return res.status(400).json({ error: err.errors || err.message });
    }
  },

  // ✅ Delete Role
  async delete(req, res) {
    try {
      const result = await roleService.deleteRole(req.params.id);
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  },
};

export default roleController;

