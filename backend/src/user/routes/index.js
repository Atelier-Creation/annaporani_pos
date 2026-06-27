import express from 'express';
import roleRoutes from './role.routes.js';
import userRoutes from './user.routes.js';
import branchRoutes from './branch.routes.js';
import permissionRoutes from './permission.routes.js';


const router = express.Router();

// Mount routes with specific paths first, then wildcard routes
// This prevents /:id from catching specific routes like /my-branches
router.use('/user', permissionRoutes);   // Permission routes
router.use('/user', roleRoutes);
router.use('/user', branchRoutes);       // Mount branch routes before user routes
router.use('/user', userRoutes);         // User routes have /:id wildcard, so mount last



export default router;
