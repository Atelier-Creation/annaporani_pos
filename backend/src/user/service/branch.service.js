import Branch from '../models/branch.model.js';
import UserBranch from '../models/userbranch.model.js';
import User from '../models/user.model.js';
import Role from '../models/role.model.js';

const branchService = {
    // Create a new branch
    async createBranch(data, created_by) {
        const exists = await Branch.findOne({ where: { branch_code: data.branch_code } });
        if (exists) throw new Error('Branch code already exists');

        return await Branch.create({ ...data, created_by });
    },

    // Get all active branches
    async getBranches() {
        return await Branch.findAll({ where: { is_active: true } });
    },

    // Get branch by ID
    async getBranchById(id) {
        const branch = await Branch.findByPk(id);
        if (!branch) throw new Error('Branch not found');
        return branch;
    },

    // Update branch
    async updateBranch(id, data, updated_by) {
        const branch = await Branch.findByPk(id);
        if (!branch) throw new Error('Branch not found');

        return await branch.update({ ...data, updated_by });
    },

    // Soft delete branch
    async deleteBranch(id) {
        const branch = await Branch.findByPk(id);
        if (!branch) throw new Error('Branch not found');

        await branch.update({ is_active: false });
        return true;
    },

    // Assign user to branch with role
    async assignUserToBranch(user_id, branch_id, role_id, created_by) {
        // Verify user exists
        const user = await User.findByPk(user_id);
        if (!user) throw new Error('User not found');

        // Verify branch exists
        const branch = await Branch.findByPk(branch_id);
        if (!branch) throw new Error('Branch not found');

        // Verify role exists
        const role = await Role.findByPk(role_id);
        if (!role) throw new Error('Role not found');

        // Check if assignment already exists
        const existing = await UserBranch.findOne({
            where: { user_id, branch_id }
        });

        if (existing) {
            // Update existing assignment
            return await existing.update({ role_id, is_active: true, updated_by: created_by });
        }

        // Create new assignment
        return await UserBranch.create({
            user_id,
            branch_id,
            role_id,
            created_by
        });
    },

    // Remove user from branch
    async removeUserFromBranch(user_id, branch_id) {
        const userBranch = await UserBranch.findOne({
            where: { user_id, branch_id }
        });

        if (!userBranch) throw new Error('User branch assignment not found');

        await userBranch.update({ is_active: false });
        return true;
    },

    // Get all branches for a user
    async getUserBranches(user_id) {
        // First, get the user with their role
        const user = await User.findByPk(user_id, {
            include: [{ model: Role, as: 'role' }]
        });

        if (!user) throw new Error('User not found');

        // Check if user is super admin
        const isSuperAdmin = user.role?.role_name?.toLowerCase() === 'super admin';

        if (isSuperAdmin) {
            // Super admin gets all branches with super admin role
            const allBranches = await Branch.findAll({ 
                where: { is_active: true } 
            });
            
            // Format response to match UserBranch structure
            return allBranches.map(branch => ({
                user_id: user_id,
                branch_id: branch.id,
                role_id: user.role_id,
                is_active: true,
                branch: branch,
                role: user.role
            }));
        }

        // Regular users get only their assigned branches
        return await UserBranch.findAll({
            where: { user_id, is_active: true },
            include: [
                { model: Branch, as: 'branch' },
                { model: Role, as: 'role' }
            ]
        });
    },

    // Get all users in a branch
    async getBranchUsers(branch_id) {
        return await UserBranch.findAll({
            where: { branch_id, is_active: true },
            include: [
                { 
                    model: User, 
                    as: 'user',
                    attributes: { exclude: ['password', 'token'] }
                },
                { model: Role, as: 'role' }
            ]
        });
    },

    // Update user role in a branch
    async updateUserBranchRole(user_id, branch_id, role_id, updated_by) {
        const userBranch = await UserBranch.findOne({
            where: { user_id, branch_id }
        });

        if (!userBranch) throw new Error('User branch assignment not found');

        return await userBranch.update({ role_id, updated_by });
    }
};

export default branchService;
