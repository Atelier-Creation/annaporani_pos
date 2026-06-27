import express from 'express';
import branchController from '../controller/branch.controller.js';
import { verifyToken } from '../../middleware/auth.js';

const router = express.Router();

// Branch CRUD - all require authentication
router.post('/branches', verifyToken, branchController.createBranch);
router.get('/branches', verifyToken, branchController.getBranches);
router.get('/branches/:id', verifyToken, branchController.getBranchById);
router.put('/branches/:id', verifyToken, branchController.updateBranch);
router.delete('/branches/:id', verifyToken, branchController.deleteBranch);

// User-Branch assignments - all require authentication
router.post('/branches/assign-user', verifyToken, branchController.assignUserToBranch);
router.post('/branches/remove-user', verifyToken, branchController.removeUserFromBranch);
router.put('/branches/update-user-role', verifyToken, branchController.updateUserBranchRole);

// Get branches for a user - require authentication
router.get('/users/:userId/branches', verifyToken, branchController.getUserBranches);
router.get('/my-branches', verifyToken, branchController.getUserBranches);

// Get users in a branch - require authentication
router.get('/branches/:branchId/users', verifyToken, branchController.getBranchUsers);

export default router;
