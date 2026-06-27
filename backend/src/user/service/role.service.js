// services/role.service.js
import Role from "../models/role.model.js";
import Permission from "../models/permission.model.js";

const roleService = {
  async createRole(data, permissionIds = []) {
    const role = await Role.create(data);
    if (permissionIds.length > 0) {
      const permissions = await Permission.findAll({ where: { id: permissionIds } });
      await role.setPermissions(permissions);
    }
    return await roleService.getRoleById(role.id);
  },

  async getAllRoles() {
    return await Role.findAll({
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: [] },
        required: false,
      }],
      order: [['role_name', 'ASC']],
    });
  },

  async getRoleById(id) {
    const role = await Role.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: [] },
        required: false,
      }],
    });
    if (!role) throw new Error("Role not found");
    return role;
  },

  async updateRole(id, data, permissionIds = []) {
    const role = await Role.findByPk(id);
    if (!role) throw new Error("Role not found");
    await role.update(data);
    // Always sync permissions (empty array = remove all)
    const permissions = await Permission.findAll({ where: { id: permissionIds } });
    await role.setPermissions(permissions);
    return await roleService.getRoleById(id);
  },

  async deleteRole(id) {
    const role = await Role.findByPk(id);
    if (!role) throw new Error("Role not found");
    // Remove all permission associations first
    await role.setPermissions([]);
    await role.destroy();
    return { message: "Role deleted successfully" };
  },

  async findByName(role_name) {
    return await Role.findOne({ where: { role_name } });
  },
};

export default roleService;
