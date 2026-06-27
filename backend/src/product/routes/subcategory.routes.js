// routes/subcategory.routes.js
import express from "express";
import subcategoryController from "../controller/subcategory.controller.js";
import { verifyToken } from "../../middleware/auth.js";

const router = express.Router();

// ✅ Create a new subcategory
router.post('/subcategory', verifyToken, subcategoryController.create);

// ✅ Get all subcategories
router.get('/subcategory', verifyToken, subcategoryController.getAll);

// ✅ Get subcategory by ID
router.get('/subcategory/:id', verifyToken, subcategoryController.getById);

// ✅ Update subcategory by ID
router.put('/subcategory/:id', verifyToken, subcategoryController.update);

// ✅ Delete subcategory by ID (soft delete)
router.delete('/subcategory/:id', verifyToken, subcategoryController.delete);

export default router;
