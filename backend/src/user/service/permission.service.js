// services/permission.service.js
import Permission from "../models/permission.model.js";
import RolePermission from "../models/rolepermission.model.js";
import { Op } from "sequelize";

const permissionService = {
    async createPermission(data) {
        return await Permission.create(data);
    },

    async getAllPermissions(params = {}) {
        const { search, category, page = 1, limit = 50 } = params;
        const where = {};

        if (search) {
            where[Op.or] = [
                { code: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
            ];
        }
        if (category) {
            where.category = category;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Permission.findAndCountAll({
            where,
            order: [["category", "ASC"], ["code", "ASC"]],
            limit: parseInt(limit),
            offset,
        });

        return {
            data: rows,
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
        };
    },

    async getAllPermissionsFlat() {
        return await Permission.findAll({
            where: { is_active: true },
            order: [["category", "ASC"], ["code", "ASC"]],
        });
    },

    async getPermissionById(id) {
        const permission = await Permission.findByPk(id);
        if (!permission) throw new Error("Permission not found");
        return permission;
    },

    async updatePermission(id, data) {
        const permission = await Permission.findByPk(id);
        if (!permission) throw new Error("Permission not found");
        await permission.update(data);
        return permission;
    },

    async deletePermission(id) {
        const permission = await Permission.findByPk(id);
        if (!permission) throw new Error("Permission not found");

        // Check if permission is assigned to any roles
        const usageCount = await RolePermission.count({ where: { permission_id: id } });
        if (usageCount > 0) {
            throw new Error(`Cannot delete. Permission is assigned to ${usageCount} role(s)`);
        }

        await permission.destroy();
        return { message: "Permission deleted successfully" };
    },

    async findByCode(code) {
        return await Permission.findOne({ where: { code } });
    },
};

export default permissionService;
