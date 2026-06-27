// routes/stock.routes.js
import express from "express";
import stockController from "../controller/stock.controller.js";
import { verifyToken } from "../../middleware/auth.js";
import { authenticateBranch, authenticateBranchRole } from "../../middleware/authenticateBranch.js";

const router = express.Router();

// ✅ Add new stock (single) - requires branch access
router.post('/stock', verifyToken, authenticateBranch(), stockController.create);

// ✅ Bulk add stock - requires branch access
router.post('/stockbulk', verifyToken, authenticateBranch(), stockController.createBulk);

// ✅ Get all stock records - allows multiple branches
router.get('/stock', verifyToken, authenticateBranch(true), stockController.getAll);

// ✅ Get stock by ID - requires branch access
router.get('/stock/:id', verifyToken, authenticateBranch(), stockController.getById);

// ✅ Update stock by ID - requires manager/admin role
router.put('/stock/:id', verifyToken, authenticateBranch(), authenticateBranchRole(['admin', 'manager']), stockController.update);

// ✅ Delete stock by ID (soft delete) - requires admin role
router.delete('/stock/:id', verifyToken, authenticateBranch(), authenticateBranchRole(['admin']), stockController.delete);

export default router;
