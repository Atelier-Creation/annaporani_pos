import branchService from '../service/branch.service.js';

const branchController = {
    // Create branch
    async createBranch(req, res) {
        try {
            const branch = await branchService.createBranch(req.body, req.user.id);
            res.status(201).json({
                success: true,
                message: 'Branch created successfully',
                data: branch
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Get all branches
    async getBranches(req, res) {
        try {
            const branches = await branchService.getBranches();
            res.status(200).json({
                success: true,
                data: branches
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Get branch by ID
    async getBranchById(req, res) {
        try {
            const branch = await branchService.getBranchById(req.params.id);
            res.status(200).json({
                success: true,
                data: branch
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // Update branch
    async updateBranch(req, res) {
        try {
            const branch = await branchService.updateBranch(
                req.params.id,
                req.body,
                req.user.id
            );
            res.status(200).json({
                success: true,
                message: 'Branch updated successfully',
                data: branch
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Delete branch
    async deleteBranch(req, res) {
        try {
            await branchService.deleteBranch(req.params.id);
            res.status(200).json({
                success: true,
                message: 'Branch deleted successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Assign user to branch
    async assignUserToBranch(req, res) {
        try {
            console.log('=== ASSIGN USER TO BRANCH ===');
            console.log('Request body:', JSON.stringify(req.body, null, 2));
            console.log('User from token:', req.user);
            
            const { user_id, branch_id, role_id } = req.body;
            
            console.log('Extracted values:', { user_id, branch_id, role_id });
            
            if (!user_id || !branch_id || !role_id) {
                console.log('ERROR: Missing required fields');
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: user_id, branch_id, and role_id are required',
                    received: { user_id, branch_id, role_id }
                });
            }
            
            const assignment = await branchService.assignUserToBranch(
                user_id,
                branch_id,
                role_id,
                req.user.id
            );
            
            console.log('Assignment successful:', assignment.id);
            console.log('==============================');
            
            res.status(201).json({
                success: true,
                message: 'User assigned to branch successfully',
                data: assignment
            });
        } catch (error) {
            console.log('ERROR in assignUserToBranch:', error.message);
            console.log('==============================');
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Remove user from branch
    async removeUserFromBranch(req, res) {
        try {
            const { user_id, branch_id } = req.body;
            await branchService.removeUserFromBranch(user_id, branch_id);
            res.status(200).json({
                success: true,
                message: 'User removed from branch successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Get user branches
    async getUserBranches(req, res) {
        try {
            const userId = req.params.userId || req.user.id;
            const branches = await branchService.getUserBranches(userId);
            res.status(200).json({
                success: true,
                data: branches
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Get branch users
    async getBranchUsers(req, res) {
        try {
            const users = await branchService.getBranchUsers(req.params.branchId);
            res.status(200).json({
                success: true,
                data: users
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Update user role in branch
    async updateUserBranchRole(req, res) {
        try {
            const { user_id, branch_id, role_id } = req.body;
            const updated = await branchService.updateUserBranchRole(
                user_id,
                branch_id,
                role_id,
                req.user.id
            );
            res.status(200).json({
                success: true,
                message: 'User branch role updated successfully',
                data: updated
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

export default branchController;
