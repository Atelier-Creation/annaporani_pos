import { z } from 'zod';

export const createBranchSchema = z.object({
    branch_name: z.string().min(1, 'Branch name is required').max(100),
    branch_code: z.string().min(1, 'Branch code is required').max(20),
    address: z.string().optional(),
    city: z.string().max(50).optional(),
    state: z.string().max(50).optional(),
    phone: z.string().max(15).optional(),
});

export const updateBranchSchema = z.object({
    branch_name: z.string().min(1).max(100).optional(),
    branch_code: z.string().min(1).max(20).optional(),
    address: z.string().optional(),
    city: z.string().max(50).optional(),
    state: z.string().max(50).optional(),
    phone: z.string().max(15).optional(),
    is_active: z.boolean().optional(),
});

export const assignUserToBranchSchema = z.object({
    user_id: z.string().uuid('Invalid user ID'),
    branch_id: z.string().uuid('Invalid branch ID'),
    role_id: z.string().uuid('Invalid role ID'),
});

export const removeUserFromBranchSchema = z.object({
    user_id: z.string().uuid('Invalid user ID'),
    branch_id: z.string().uuid('Invalid branch ID'),
});

export const updateUserBranchRoleSchema = z.object({
    user_id: z.string().uuid('Invalid user ID'),
    branch_id: z.string().uuid('Invalid branch ID'),
    role_id: z.string().uuid('Invalid role ID'),
});
