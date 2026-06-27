// controllers/permission.controller.js
import permissionService from "../service/permission.service.js";
import { z } from "zod";

const createPermissionSchema = z.object({
    code: z
        .string()
        .min(2, "Code must be at least 2 characters")
        .max(100, "Code cannot exceed 100 characters")
        .regex(/^[a-z0-9_.]+$/, "Code must be lowercase with dots/underscores (e.g. billing.view)"),
    description: z.string().max(200).optional(),
    category: z.string().max(50).optional(),
    is_active: z.boolean().optional(),
});

const updatePermissionSchema = createPermissionSchema.partial();

const permissionController = {
    // GET /permission  — paginated list
    async getAll(req, res) {
        try {
            const result = await permissionService.getAllPermissions(req.query);
            return res.json({ success: true, ...result });
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    },

    // GET /permission/all  — flat list for dropdowns
    async getAllFlat(req, res) {
        try {
            const permissions = await permissionService.getAllPermissionsFlat();
            return res.json({ success: true, data: permissions });
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    },

    // GET /permission/:id
    async getById(req, res) {
        try {
            const permission = await permissionService.getPermissionById(req.params.id);
            return res.json({ success: true, data: permission });
        } catch (err) {
            return res.status(404).json({ success: false, error: err.message });
        }
    },

    // POST /permission
    async create(req, res) {
        try {
            const data = createPermissionSchema.parse(req.body);

            const existing = await permissionService.findByCode(data.code);
            if (existing) {
                return res.status(400).json({ success: false, error: "Permission code already exists" });
            }

            // Audit fields from token
            if (req.user) {
                data.created_by = req.user.id;
                data.created_by_name = req.user.username;
                data.created_by_email = req.user.email;
            }

            const permission = await permissionService.createPermission(data);
            return res.status(201).json({ success: true, data: permission });
        } catch (err) {
            return res.status(400).json({ success: false, error: err.errors || err.message });
        }
    },

    // PUT /permission/:id
    async update(req, res) {
        try {
            const data = updatePermissionSchema.parse(req.body);

            if (data.code) {
                const existing = await permissionService.findByCode(data.code);
                if (existing && existing.id !== req.params.id) {
                    return res.status(400).json({ success: false, error: "Permission code already exists" });
                }
            }

            // Audit fields
            if (req.user) {
                data.updated_by = req.user.id;
                data.updated_by_name = req.user.username;
                data.updated_by_email = req.user.email;
            }

            const permission = await permissionService.updatePermission(req.params.id, data);
            return res.json({ success: true, data: permission });
        } catch (err) {
            return res.status(400).json({ success: false, error: err.errors || err.message });
        }
    },

    // DELETE /permission/:id
    async delete(req, res) {
        try {
            const result = await permissionService.deletePermission(req.params.id);
            return res.json({ success: true, ...result });
        } catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
};

export default permissionController;
