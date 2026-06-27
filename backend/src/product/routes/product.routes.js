// routes/product.routes.js
import express from "express";
import productController from "../controller/product.controlller.js";
import { verifyToken } from "../../middleware/auth.js";
import { authenticateBranch } from "../../middleware/authenticateBranch.js";

const router = express.Router();

// ✅ Bulk upload products (must be before /:id route to avoid conflict)
router.post('/product/bulk-upload', verifyToken, authenticateBranch(), productController.bulkUpload);

// ✅ Create a new product
router.post('/product',verifyToken, productController.create);

// ✅ Get all products
router.get('/product',verifyToken, productController.getAll);

// ✅ Get product by ID
router.get('/product/:id',verifyToken, productController.getById);

router.get('/product/code/:code',verifyToken, productController.getByCode);

// ✅ Update product by ID
router.put('/product/:id',verifyToken, productController.update);

// ✅ Delete product by ID
router.delete('/product/:id',verifyToken, productController.delete);

// ✅ Bulk upload products
router.post('/product/bulk-upload', verifyToken, productController.bulkUpload);

export default router;
