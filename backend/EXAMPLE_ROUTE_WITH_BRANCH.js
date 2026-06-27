// Example: How to update product routes to use branch authentication
// File: src/product/routes/product.routes.js

import express from "express";
import productController from "../controller/product.controlller.js";
import { verifyToken } from "../../middleware/auth.js";
import { authenticateBranch, authenticateBranchRole } from "../../middleware/authenticateBranch.js";

const router = express.Router();

// ✅ Create a new product - requires branch access
// User must be assigned to the branch to create products
router.post('/product',
    verifyToken,           // 1. Verify user is logged in
    authenticateBranch,    // 2. Verify user has access to branch
    productController.create
);

// ✅ Get all products - requires branch access
// Returns products only from the specified branch
router.get('/product',
    verifyToken,
    authenticateBranch,
    productController.getAll
);

// ✅ Get product by ID - requires branch access
router.get('/product/:id',
    verifyToken,
    authenticateBranch,
    productController.getById
);

// ✅ Get product by code - requires branch access
router.get('/product/code/:code',
    verifyToken,
    authenticateBranch,
    productController.getByCode
);

// ✅ Update product - requires manager or admin role in branch
// Only managers and admins can update products
router.put('/product/:id',
    verifyToken,
    authenticateBranch,
    authenticateBranchRole(['admin', 'manager']),  // 3. Check role in branch
    productController.update
);

// ✅ Delete product - requires admin role in branch
// Only admins can delete products
router.delete('/product/:id',
    verifyToken,
    authenticateBranch,
    authenticateBranchRole(['admin']),  // Only admins
    productController.delete
);

export default router;

// ============================================
// Example Controller Usage
// ============================================

// File: src/product/controller/product.controller.js

const productController = {
    async create(req, res) {
        try {
            // Access branch context set by authenticateBranch middleware
            const { branchId, branchName, roleId, roleName } = req.branchContext;
            const userId = req.user.id;

            console.log(`User creating product in ${branchName} with role ${roleName}`);

            // Create product with branch context
            const product = await productService.create({
                ...req.body,
                branch_id: branchId,  // Automatically use authenticated branch
                created_by: userId
            });

            res.status(201).json({
                success: true,
                message: `Product created successfully in ${branchName}`,
                data: product
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    async getAll(req, res) {
        try {
            const { branchId } = req.branchContext;

            // Get products only from this branch
            const products = await productService.getByBranch(branchId);

            res.status(200).json({
                success: true,
                data: products
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    async update(req, res) {
        try {
            const { branchId, roleName } = req.branchContext;
            const userId = req.user.id;

            console.log(`${roleName} updating product in branch ${branchId}`);

            const product = await productService.update(
                req.params.id,
                {
                    ...req.body,
                    updated_by: userId
                }
            );

            res.status(200).json({
                success: true,
                message: 'Product updated successfully',
                data: product
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    async delete(req, res) {
        try {
            const { branchId, roleName } = req.branchContext;
            const userId = req.user.id;

            console.log(`Admin ${userId} deleting product from branch ${branchId}`);

            await productService.delete(req.params.id, userId);

            res.status(200).json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

export default productController;

// ============================================
// Example Service Usage
// ============================================

// File: src/product/service/product.service.js

const productService = {
    async create(data) {
        // data.branch_id is already set from controller
        return await Product.create(data);
    },

    async getByBranch(branchId) {
        return await Product.findAll({
            where: { 
                branch_id: branchId,
                is_active: true 
            }
        });
    },

    async update(id, data) {
        const product = await Product.findByPk(id);
        if (!product) throw new Error('Product not found');
        
        return await product.update(data);
    },

    async delete(id, deletedBy) {
        const product = await Product.findByPk(id);
        if (!product) throw new Error('Product not found');
        
        await product.update({ 
            is_active: false,
            deleted_by: deletedBy 
        });
        return true;
    }
};

export default productService;

// ============================================
// API Request Examples
// ============================================

/*
1. Create Product (requires branch access):
   POST /api/v1/billing/product?branch_id=uuid-of-branch
   Headers: Authorization: Bearer <token>
   Body: {
     "product_name": "Widget",
     "product_code": "WDG001",
     "price": 99.99
   }

2. Get Products (requires branch access):
   GET /api/v1/billing/product?branch_id=uuid-of-branch
   Headers: Authorization: Bearer <token>

3. Update Product (requires manager/admin role):
   PUT /api/v1/billing/product/product-uuid?branch_id=branch-uuid
   Headers: Authorization: Bearer <token>
   Body: {
     "price": 109.99
   }

4. Delete Product (requires admin role):
   DELETE /api/v1/billing/product/product-uuid?branch_id=branch-uuid
   Headers: Authorization: Bearer <token>
*/
