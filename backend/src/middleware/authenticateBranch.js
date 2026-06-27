import UserBranch from '../user/models/userbranch.model.js';
import Branch from '../user/models/branch.model.js';
import Role from '../user/models/role.model.js';

/**
 * Middleware to verify user has access to a specific branch
 * If branch_id is not provided and user has only one branch, automatically use it
 * Otherwise, expects branch_id in request body, query, or params
 * 
 * @param {boolean} allowMultipleBranches - If true, allows requests without branch_id for users with multiple branches
 */
export const authenticateBranch = (allowMultipleBranches = false) => async (req, res, next) => {
    try {
        console.log('=== AUTHENTICATE BRANCH DEBUG ===');
        console.log('User:', req.user);
        console.log('Body:', req.body);
        console.log('Query:', req.query);
        console.log('Params:', req.params);
        
        const userId = req.user?.id;
        // Handle null prototype objects from query params
        const queryBranchId = req.query && req.query.branch_id ? req.query.branch_id : null;
        const bodyBranchId = req.body && req.body.branch_id ? req.body.branch_id : null;
        const paramsBranchId = req.params && req.params.branch_id ? req.params.branch_id : null;
        
        let branchId = bodyBranchId || queryBranchId || paramsBranchId;

        console.log('Extracted userId:', userId);
        console.log('Extracted branchId:', branchId);
        console.log('Query branch_id:', queryBranchId);
        console.log('Body branch_id:', bodyBranchId);
        console.log('Params branch_id:', paramsBranchId);

        if (!userId) {
            return res.status(401).json({ 
                success: false,
                message: 'User not authenticated' 
            });
        }

        // If no branch_id provided, check if user has only one branch
        if (!branchId) {
            console.log('No branchId provided, fetching user branches...');
            
            const userBranches = await UserBranch.findAll({
                where: { 
                    user_id: userId,
                    is_active: true 
                },
                include: [
                    { 
                        model: Branch, 
                        as: 'branch', 
                        where: { is_active: true },
                        required: true
                    }
                ]
            });

            console.log('User branches found:', userBranches.length);
            console.log('User branches data:', JSON.stringify(userBranches, null, 2));

            if (userBranches.length === 0) {
                return res.status(403).json({ 
                    success: false,
                    message: 'You are not assigned to any branch. Please contact administrator.' 
                });
            }

            if (userBranches.length === 1) {
                // User has only one branch, use it automatically
                branchId = userBranches[0].branch_id;
                console.log(`Auto-selected branch ${branchId} for user ${userId}`);
            } else if (allowMultipleBranches) {
                // User has multiple branches, but we allow fetching from all
                console.log(`User has ${userBranches.length} branches, allowing multi-branch access`);
                req.branchContext = {
                    multipleBranches: true,
                    branches: userBranches.map(ub => ({
                        branchId: ub.branch_id,
                        branchName: ub.branch?.branch_name || 'Unknown',
                        branchCode: ub.branch?.branch_code || 'Unknown',
                        roleId: ub.role_id,
                        roleName: ub.role?.role_name || 'unknown'
                    }))
                };
                console.log('=== AUTHENTICATE BRANCH DEBUG END ===');
                return next();
            } else {
                // User has multiple branches, branch_id is required
                return res.status(400).json({ 
                    success: false,
                    message: 'Branch ID is required. You have access to multiple branches.',
                    availableBranches: userBranches.map(ub => ({
                        branch_id: ub.branch_id,
                        branch_name: ub.branch?.branch_name || 'Unknown',
                        branch_code: ub.branch?.branch_code || 'Unknown'
                    }))
                });
            }
        }

        console.log('Final branchId to verify:', branchId);

        // Check if user has access to this branch
        const userBranch = await UserBranch.findOne({
            where: { 
                user_id: userId, 
                branch_id: branchId,
                is_active: true 
            },
            include: [
                { 
                    model: Branch, 
                    as: 'branch',
                    required: false
                },
                { 
                    model: Role, 
                    as: 'role',
                    required: false
                }
            ]
        });

        console.log('UserBranch found:', userBranch ? 'Yes' : 'No');
        if (userBranch) {
            console.log('UserBranch data:', JSON.stringify(userBranch, null, 2));
        }

        if (!userBranch) {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied: You do not have access to this branch' 
            });
        }

        // Check if branch exists and is active
        if (!userBranch.branch) {
            return res.status(404).json({ 
                success: false,
                message: 'Branch not found' 
            });
        }

        if (!userBranch.branch.is_active) {
            return res.status(403).json({ 
                success: false,
                message: 'This branch is currently inactive' 
            });
        }

        // Attach branch context to request
        req.branchContext = {
            branchId: userBranch.branch_id,
            branchName: userBranch.branch.branch_name,
            branchCode: userBranch.branch.branch_code,
            roleId: userBranch.role_id,
            roleName: userBranch.role?.role_name || 'unknown'
        };

        console.log('=== AUTHENTICATE BRANCH DEBUG END ===');

        next();
    } catch (error) {
        console.error('Branch authentication error:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({ 
            success: false,
            message: 'Error verifying branch access',
            error: error.message 
        });
    }
};

/**
 * Middleware to verify user has specific role in a branch
 * Usage: authenticateBranchRole(['admin', 'manager'])
 */
export const authenticateBranchRole = (allowedRoles = []) => {
    return async (req, res, next) => {
        try {
            if (!req.branchContext) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Branch context not found. Use authenticateBranch middleware first.' 
                });
            }

            const userRole = req.branchContext.roleName;

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({ 
                    success: false,
                    message: `Access denied: Required role(s): ${allowedRoles.join(', ')}` 
                });
            }

            next();
        } catch (error) {
            console.error('Branch role authentication error:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Error verifying branch role',
                error: error.message 
            });
        }
    };
};
